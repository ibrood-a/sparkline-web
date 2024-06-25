'use client'
import axios, {AxiosProgressEvent} from 'axios';
import { InstagramPostRequest, UploadRequest, YoutubePostRequest } from '@/data/youtube'

export const postService = {
    uploadVideo: async (request: UploadRequest, onDownloadProgress: (progressEvent: AxiosProgressEvent) => void) => {

        // Log the request to the console
        console.log('Video Upload Request:', JSON.stringify(request));

        try {
            const response = await axios.post(`${process.env.API_URL}/socials/upload/video`,
                JSON.stringify({
                    token: request.token,
                    byteArray: request.byteArray
                }),
                {
                    headers: {
                        "Content-Type": "application/json"
                    },
                    onDownloadProgress,
                });
            return response.data;  // Assuming the backend returns the uploaded video URL
        } catch (error) {
            console.error('Error uploading file:', error);
        }
    },

    uploadImage: async (request: UploadRequest, onUploadProgress: (progressEvent: AxiosProgressEvent) => void) => {
        try {
            await axios.post(`${process.env.API_URL}/socials/upload/image`, {
                token: request.token,
                byteArray: request.byteArray
            }, {
                headers: {
                    "Content-Type": "application/json"
                },
                onUploadProgress,
            });
        } catch (error) {
            console.error('Error uploading file:', error);
        }
    },

    postVideoToYoutube: async (request: YoutubePostRequest): Promise<any> => {
        try {
            const response = await axios.post(`${process.env.API_URL}/socials/publish/video/youtube`, request, {
                headers: {
                    "Content-Type": "application/json"
                }
            });
            return response.data;  // Return the data from the response
        } catch (error: any) {
            console.error('Error creating video post:', error);
            if (error.response && error.response.data) {
                throw new Error(error.response.data.error);  // Propagate error message from the response
            } else {
                throw new Error('An error occurred while posting the video.');
            }
        }
    },

    postVideoToInstagram: async (request: InstagramPostRequest) => {
        try {
            return await axios.post(`${process.env.API_URL}/socials/publish/video/instagram`, request, {
                headers: {
                    "Content-Type": "application/json"
                }
            });  // Assuming the backend returns the video post URL
        } catch (error) {
            console.error('Error:', error);
        }
    },
};
