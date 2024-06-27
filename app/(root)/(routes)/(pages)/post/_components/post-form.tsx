'use client';
import React, { useEffect, useState } from 'react';
import { Dayjs } from 'dayjs';
import { useForm } from 'react-hook-form';
import { usePostVideo } from '@/hooks/use-post-video';
import toast from 'react-hot-toast';
import * as Label from '@radix-ui/react-label';
import * as Switch from '@radix-ui/react-switch';
import { Form } from '@/components/ui/form';
import { CardWrapper } from '@/components/post/card-wrapper';
import { Button } from '@/components/ui/button';
import { getSession } from 'next-auth/react';
import FileUpload from './file-upload';
import PostFormFields from './post-form-fields';
import { generateGoogleOAuthLink } from '@/lib/oauth'
import bcrypt from 'bcrypt'

interface PostFormProps {
  selectedDate: Dayjs | null;
  role: any; // Update this to the specific type if you have one
}

const PostForm: React.FC<PostFormProps> = ({ selectedDate, role }) => {
  const [link, setLink] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<{ [key: string]: boolean }>({
    youtube: false,
    twitter: false,
    instagram: false,
    facebook: false,
  });
  const { postVideo, notificationMessage } = usePostVideo();
  const form = useForm({
    defaultValues: {
      dateToPost: selectedDate,
      description: '',
      title: '',
      categoryId: 0,
      tags: '',
    },
  });

  useEffect(() => {
    if (notificationMessage) {
      if (notificationMessage.type === 'success') {
        toast.success(notificationMessage.message);
      } else {
        toast.error(notificationMessage.message);
      }
    }
  }, [notificationMessage]);

  useEffect(() => {
    if (selectedDate) {
      form.setValue('dateToPost', selectedDate);
    }
  }, [selectedDate, form]);

  const handleSwitchChange = (platform: string, checked: boolean) => {
    setSelectedPlatforms((prev) => ({
      ...prev,
      [platform]: checked,
    }));
  };

  const onSubmit = (values: {
    dateToPost: Dayjs | null;
    description: string;
    title: string;
    categoryId: number;
    tags: string;
  }) => {
    postVideo(role.user.id, values, videoUrl || "", selectedPlatforms)
      .then((url) => {
        toast.success('Successfully uploaded file.');
      })
      .catch((error) => {
        console.error('Failed to post video:', error);
        toast.error('Failed to post video.');
      });

    form.reset();
  };

  useEffect(() => {
    const fetchLink = async () => {
      const url = await generateGoogleOAuthLink(role.user.id);
      setLink(url);
    };

    fetchLink();
  }, [role.user.id]);

  return (
    <div className="w-6xl px-6 py-4 items-center justify-center flex gap-10">

      <CardWrapper headerTitle={"Video Preview"}>
        <FileUpload userId={role.user.id} setVideoUrl={setVideoUrl} />
        <Button>
          <a href={link}>Link Google Account</a>
        </Button>
      </CardWrapper>

      <CardWrapper headerTitle="New Post">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <PostFormFields
              form={form}
              selectedPlatforms={selectedPlatforms}
              handleSwitchChange={handleSwitchChange}
            />
            <div className="flex justify-center">
              <Button className="w-[50%] mt-2" type="submit">
                Post
              </Button>
            </div>
          </form>
        </Form>
      </CardWrapper>
    </div>
  );
};

export default PostForm;
