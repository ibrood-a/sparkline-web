'use client';
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';

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
    <div>
      {!preview && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          style={{
            border: '2px dashed #d9d9d9',
            borderRadius: '4px',
            padding: '20px',
            textAlign: 'center',
            marginBottom: '24px',
          }}
        >
          <p>Click or drag file to this area to upload</p>
          <p>Support for a single upload.</p>
          <input
            type="file"
            accept=".mp4,.mov,.avi,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            id="fileUpload"
          />
          <label htmlFor="fileUpload" style={{ cursor: 'pointer', color: 'blue', textDecoration: 'underline' }}>
            Choose a file
          </label>
        </div>
      )}
      {preview && (
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <video width="100%" style={{ marginBottom: 10 }} controls>
            <source src={preview} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <Button onClick={handleRemovePreview}>
            Remove Video
          </Button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;

