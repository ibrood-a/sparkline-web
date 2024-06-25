import { useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { InstagramPostRequest, YoutubePostRequest, YoutubePrivacyStatuses } from '@/data/youtube';
import { postService } from '@/lib/post-service';

// Extend dayjs with the necessary plugins
dayjs.extend(utc);
dayjs.extend(timezone);

// Function to format the date in US/Eastern timezone
const formatDateToUSEastern = (date: any) => {
    return dayjs(date).utc().format('YYYY-MM-DD HH:mm:ss');
};

export const usePostVideo = (videoUrl: string, selectedPlatforms: { [key: string]: boolean }) => {
    const [notificationMessage, setNotificationMessage] = useState<{
        type: 'success' | 'error';
        message: string;
        description: string;
    } | null>(null);

    const handlePostError = (error: any, platform: string) => {
        const errorMessage = error.message || "An error occurred";

        setNotificationMessage({ type: 'error', message: `Failed to Post on ${platform}`, description: errorMessage });
    };

    const postVideo = async (values: {
        dateToPost: Dayjs | null;
        description: string;
        title: string;
        categoryId: number;
        tags: string;
    }, user: any) => {
        const formattedDate = formatDateToUSEastern(values.dateToPost);
        const instagramPostRequest: InstagramPostRequest = {
            tokenAndVideoUrl: {
                token: user ? user.token : '',
                videoUrl: videoUrl || ''
            },
            caption: values.description || '',
        };

        const youtubePostRequest: YoutubePostRequest = {
            tokenAndVideoUrl: {
                token: user ? user.token : '',
                videoUrl: videoUrl || ''
            },
            snippet: {
                title: values.title || '',
                description: values.description || '',
                tags: values.tags ? values.tags.split(',') : [''],
                categoryId: (values.categoryId || "").toString() || '',
            },
            status: { privacyStatus: YoutubePrivacyStatuses.UNLISTED },
        };

        const schedulePostRequest = {
            token: user?.token,
            mediaType: 'video',
            contentUrl: videoUrl,
            postTime: formattedDate,
            providers: Object.keys(selectedPlatforms).filter((platform: string) => selectedPlatforms[platform as keyof typeof selectedPlatforms]),
            instagramPostRequest: instagramPostRequest,
            youtubePostRequest: youtubePostRequest
        };

        if (values.dateToPost) {
            const url = `${process.env.NEXT_PUBLIC_API_URL}/socials/schedule`;

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    body: JSON.stringify(schedulePostRequest),
                });

                if (response.ok) {
                    setNotificationMessage({ type: 'success', message: 'Post Scheduled Successfully', description: '' });
                } else {
                    handlePostError(new Error('Unexpected response format'), "Schedule");
                }
            } catch (error: any) {
                handlePostError(error, 'Scheduling');
            }
            return;
        }
        // Post to individual platforms
        if (selectedPlatforms.instagram) {
            try {
                const response = await postService.postVideoToInstagram(instagramPostRequest);

                if (response!!.status === 200) {
                    setNotificationMessage({ type: 'success', message: 'Post Successful on Instagram', description: '' });
                } else {
                    handlePostError(new Error('Unexpected response format'), "Instagram");
                }
            } catch (error: any) {
                handlePostError(error, 'Instagram');
            }
        }
        if (selectedPlatforms.youtube) {
            try {
                const response = await postService.postVideoToYoutube(youtubePostRequest);

                // Assuming the response contains a videoId on success
                if (response!!.status === 200) {
                    setNotificationMessage({
                        type: 'success',
                        message: 'Post Successful on YouTube',
                        description: `Video ID: ${response.videoId}`
                    });
                } else {
                    handlePostError(new Error('Unexpected response format'), "YouTube");
                }
            } catch (error: any) {
                handlePostError(error, 'YouTube');
            }
        }
    };

    return { postVideo, notificationMessage };
};
