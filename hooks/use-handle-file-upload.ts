import {AxiosProgressEvent} from 'axios';
import { UploadRequest } from '@/data/youtube'
import { postService } from '@/lib/post-service'

export const useHandleFileUpload = () => {
    let uploadProgress: any = null;
    let videoUrl: any = null;
    let preview: any = null;

    const handleFileUpload = async (options: any) => {
        const {file, onProgress, onError, onSuccess} = options;
        const token = localStorage.getItem('token')!!.replace(/"/g, '');

        if (!file) {
            console.error('No file selected');
            onError(new Error('No file selected'));
            return;
        }

        const fileReader = new FileReader();
        fileReader.onload = async () => {
            const fileExtension = file.name.split('.').pop()?.toLowerCase();
            const byteArray = new Uint8Array(fileReader.result as ArrayBuffer);

            let binaryString = '';
            for (let i = 0; i < byteArray.length; i++) {
                binaryString += String.fromCharCode(byteArray[i]);
            }

            const base64String = btoa(binaryString);

            const request: UploadRequest = {
                token: token,
                byteArray: base64String, // This is now a string
            };

            try {
                let url;
                if (['mp4', 'mov', 'avi'].includes(fileExtension)) {
                    url = await postService.uploadVideo(request, (event: AxiosProgressEvent) => {
                        const percent = Math.round((event.loaded * 100) / event.total!!);
                        uploadProgress = percent;
                        onProgress?.({percent});
                    });
                } else {
                    await postService.uploadImage(request, (event: AxiosProgressEvent) => {
                        const percent = Math.round((event.loaded * 100) / event.total!!);
                        uploadProgress = percent;
                        onProgress?.({percent});
                    });
                }
                videoUrl = url
                preview = URL.createObjectURL(file)
                onSuccess('ok');
                console.log('Post successfully uploaded');
            } catch (error) {
                console.error('Error uploading post:', error);
                onError(error);
            }
        };

        fileReader.readAsArrayBuffer(file);
    };

    return {handleFileUpload, uploadProgress, videoUrl, preview};
};
