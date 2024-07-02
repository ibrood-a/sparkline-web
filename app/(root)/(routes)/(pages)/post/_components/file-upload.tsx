'use client';
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card'
import { CardWrapper } from '@/components/post/card-wrapper'

interface FileUploadProps {
  userId: number;
  setVideoUrl: (url: string | null) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ userId, setVideoUrl }) => {
  const [preview, setPreviewLocal] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    try {
      const fileReader = new FileReader();
      fileReader.onload = async () => {
        const byteArray = new Uint8Array(fileReader.result as ArrayBuffer);
        let binaryString = '';
        for (let i = 0; i < byteArray.length; i++) {
          binaryString += String.fromCharCode(byteArray[i]);
        }
        const base64String = btoa(binaryString);

        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            fileData: base64String,
            fileName: file.name,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to upload file');
        }

        const data = await response.json();
        setVideoUrl(data.url);
        setPreviewLocal(URL.createObjectURL(file));
        toast.success('File uploaded successfully');
      };

      fileReader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    handleFileChange(event as any);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleRemovePreview = () => {
    setVideoUrl(null);
    setPreviewLocal(null);
  };

  return (
      <div className="grid rounded-xl">
      {!preview && (
        <CardWrapper>
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => document.getElementById('fileUpload')?.click()}
          className="flex flex-col items-center justify-center rounded-lg text-center cursor-pointer hover:bg-gray-700 hover:bg-opacity-30 h-64 w-full"
        >
          <p className="">Click or drag file to this area to upload</p>
          <p className="text-gray-400">Support for a single upload.</p>
          <input
            type="file"
            accept=".mp4,.mov,.avi,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            className="hidden"
            id="fileUpload"
          />
          <label htmlFor="fileUpload" className="text-blue-500 cursor-pointer hover:underline">
            Choose a file
          </label>
        </div>
        </CardWrapper>
      )}
      {preview && (
        <div className="relative text-center">
          <video width="100%" className="rounded-lg" controls>
            <source src={preview} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <button
            onClick={handleRemovePreview}
            className="absolute top-2 right-2 bg-opacity-0 cursor-pointer shadow-xl hover:bg-opacity-10 rounded-full px-2 py-1 text-black"
          >
            Remove Video
          </button>
        </div>

      )}
      </div>
  );
};

export default FileUpload;
