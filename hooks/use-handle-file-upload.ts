'use server'
import {AxiosProgressEvent} from 'axios';
import { UploadRequest } from '@/data/youtube';
import jwt from 'jwt-simple';
import { uploadImage, uploadVideo } from '@/lib/post-service';

export const useHandleFileUpload = async (userId: number, options: any, videoUrl: string) => {
    let uploadProgress: any = null;
    let preview: any = null;

    const handleFileUpload = async () => {
        const { file, onProgress, onError, onSuccess } = options;

        const payload = { userId, iss: process.env.JWT_ISSUER };
        const token = jwt.encode(payload, process.env.JWT_SECRET!!, "HS256");

        console.error('token', token);
        if (!file) {
            console.error('No file selected');
            onError(new Error('No file selected'));
            return Promise.reject('No file selected');
        }

        console.error('file', file);
        return new Promise<string>((resolve, reject) => {
            const fileReader = new FileReader();
            fileReader.onload = async () => {
                let binaryString = '';
                const fileExtension = file.name.split('.').pop()?.toLowerCase();
                const byteArray = new Uint8Array(fileReader.result as ArrayBuffer);

                for (let i = 0; i < byteArray.length; i++) {
                    binaryString += String.fromCharCode(byteArray[i]);
                }

                const base64String = btoa(binaryString);
                const request: UploadRequest = {
                    token: token,
                    byteArray: base64String, // This is now a string
                };

                console.log(request);
                try {
                    let url;
                    if (['mp4', 'mov', 'avi'].includes(fileExtension)) {
                        url = await uploadVideo(request, (event: AxiosProgressEvent) => {
                            const percent = Math.round((event.loaded * 100) / event.total!!);
                            uploadProgress = percent;
                            onProgress?.({ percent });
                        });
                    } else {
                        await uploadImage(request, (event: AxiosProgressEvent) => {
                            const percent = Math.round((event.loaded * 100) / event.total!!);
                            uploadProgress = percent;
                            onProgress?.({ percent });
                        });
                    }
                    videoUrl = url;
                    preview = URL.createObjectURL(file);
                    onSuccess('ok');
                    resolve(url); // Resolve with the URL
                    console.log('Post successfully uploaded');
                } catch (error) {
                    console.error('Error uploading post:', error);
                    onError(error);
                    reject(error); // Reject the promise with the error
                }
            };

            fileReader.readAsArrayBuffer(file);
        });
    };

    return { handleFileUpload, uploadProgress, videoUrl, preview };
};
