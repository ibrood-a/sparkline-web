import { useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Extend dayjs with the necessary plugins
dayjs.extend(utc);
dayjs.extend(timezone);

// Function to format the date in US/Eastern timezone
const formatDateToUSEastern = (date: any) => {
    return dayjs(date).utc().format('YYYY-MM-DD HH:mm:ss');
};

export const usePostVideo = () => {
    const [notificationMessage, setNotificationMessage] = useState<{
        type: 'success' | 'error';
        message: string;
        description: string;
    } | null>(null);

    const handlePostError = (error: any, platform: string) => {
        const errorMessage = error.message || "An error occurred";
        setNotificationMessage({ type: 'error', message: `Failed to Post on ${platform}`, description: errorMessage });
    };

    const postVideo = async (userId: number, values: {
        dateToPost: Date | null;
        description: string;
        title: string;
        categoryId: number;
        tags: string;
    }, videoUrl: string, selectedPlatforms: { [key: string]: boolean }) => {
        const formattedDate = formatDateToUSEastern(values.dateToPost);

        const requestBody = {
            userId,
            values,
            videoUrl,
            selectedPlatforms,
            formattedDate
        };

        try {
            const response = await fetch('/api/post', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                throw new Error('Failed to post video');
            }

            const data = await response.json();

            if (data.error) {
                handlePostError(new Error(data.error), "API");
            } else {
                setNotificationMessage({ type: 'success', message: 'Post Successful', description: '' });
            }
        } catch (error: any) {
            handlePostError(error, 'API');
        }
    };

    return { postVideo, notificationMessage };
};
