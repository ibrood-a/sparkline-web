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
import { Input } from '@/components/ui/input';
import FileUpload from './file-upload';
import { generateGoogleOAuthLink } from '@/lib/oauth';
import dynamic from 'next/dynamic';
import { categories } from '@/data/youtube'
import { Select } from '@/components/ui/select'

const MarkdownEditor = dynamic(() => import('@/components/ui/markdown-editor'), { ssr: false });

interface PostFormProps {
  selectedDate: Date | null;
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
    tiktok: false,
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
    dateToPost: Date | null;
    description: string;
    title: string;
    categoryId: number;
    tags: string;
  }) => {
    postVideo(role.user.id, values, videoUrl || "", selectedPlatforms)
      .then(() => {
        toast.success('Successfully posted video');
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
      <div className="w-full max-w-6xl mx-auto p-6 grid grid-cols-1 md:grid-cols-[50%,50%] gap-6 h-2xl">
        <div className="grid gap-6">
          <FileUpload userId={role.user.id} setVideoUrl={setVideoUrl} />
          <CardWrapper>
            <div className="flex flex-col md:flex-row items-center space-x-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <Input
                      {...form.register('title')}
                      placeholder="Enter your title here"
                    />
                  </div>
                  <div>
                    <div className="h-96"> {/* Set the desired height here */}
                      <MarkdownEditor value={form.watch('description')}
                                      onChange={(value) => form.setValue('description', value)} />
                    </div>
                  </div>
                </form>
              </Form>

            </div>
          </CardWrapper>

        </div>

        <div className="md:col-span-1 grid mr-6">
          <CardWrapper>
            <div className="flex flex-col space-y-4">
              {Object.keys(selectedPlatforms).map((platform) => (
                <div>
                  <div key={platform} className="flex items-center justify-between">
                    <Label.Root className="text-lg font-medium">
                      {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </Label.Root>
                    <Switch.Root
                      className={`relative inline-flex h-6 w-11 items-center rounded-full ${selectedPlatforms[platform] ? 'bg-primary' : 'bg-background'}`}
                      checked={selectedPlatforms[platform]}
                      onCheckedChange={(checked: boolean) => handleSwitchChange(platform, checked)}
                    >
                      <Switch.Thumb
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${selectedPlatforms[platform] ? 'translate-x-6' : 'translate-x-1'}`}
                      />
                    </Switch.Root>
                  </div>
                  {platform === 'youtube' && selectedPlatforms[platform] && (
                    <div>
                      <div>
                        <Label.Root className="block text-sm font-medium mt-4">
                          Category
                        </Label.Root>
                        <Select
                          {...form.register('categoryId', { required: true })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50"
                        >
                          <option value="">Select a category</option>
                          {categories.map((category) => (
                            <option key={category.value} value={category.value}>
                              {category.label}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <Label.Root className="block text-sm font-medium mt-4">
                          Tags
                        </Label.Root>
                        <Input
                          {...form.register('tags')}
                          placeholder="e.g., tag1,tag2"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardWrapper>
        </div>
      </div>
  );
};

export default PostForm;
