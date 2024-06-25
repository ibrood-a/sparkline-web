'use client';
import React, { useEffect, useState } from 'react';
import { Dayjs } from 'dayjs';
import { useForm } from 'react-hook-form';
import { usePostVideo } from '@/hooks/use-post-video';
import { useHandleFileUpload } from '@/hooks/use-handle-file-upload';
import { categories } from '@/data/youtube';
import toast from 'react-hot-toast';
import * as Checkbox from '@radix-ui/react-checkbox';
import * as Label from '@radix-ui/react-label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { CardWrapper } from '@/components/auth/card-wrapper';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getSession } from 'next-auth/react'

interface PostFormProps {
  videoUrl: string;
  selectedDate: Dayjs | null;
  role: any; // Update this to the specific type if you have one
}

const PostForm: React.FC<PostFormProps> = ({ videoUrl, selectedDate, role }) => {

  const session = getSession()

  const { handleFileUpload, uploadProgress, preview } = useHandleFileUpload();
  const [selectedPlatforms, setSelectedPlatforms] = useState<{ [key: string]: boolean }>({
    youtube: false,
    twitter: false,
    instagram: false,
    facebook: false,
  });
  const { postVideo, notificationMessage } = usePostVideo(videoUrl, selectedPlatforms);
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
    console.log(session)
    console.log(role)

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
    if (values.dateToPost === null) {
      return;
    }
    postVideo(values, role.user.id);
    form.reset();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  return (
    <CardWrapper headerTitle="New Post" backButtonHref={"/"} backButtonLabel={""}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-1">
          <div className="space-y-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter title"
                      className="bg-background/50 dark:bg-background/30 ring-foreground/5"
                    />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input
                    {...field}
                    placeholder="Enter description"
                    className="bg-background/50 dark:bg-background/30 ring-foreground/5"
                  />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dateToPost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date to Post</FormLabel>
                  <FormControl>

                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />
            <div className="flex gap-5 justify-center">
              {['youtube', 'twitter', 'instagram', 'facebook'].map((platform) => (
                <div key={platform} className="flex items-center">
                  <Checkbox.Root
                    checked={selectedPlatforms[platform]}
                    onCheckedChange={(checked) => handleSwitchChange(platform, checked.valueOf().toString() == platform)}
                    disabled={!role.user.accounts?.length || !role.user.accounts.find((account: any) => account.provider.toUpperCase() === platform.toUpperCase())}
                    className="mr-2"
                  >
                    <Checkbox.Indicator className="flex items-center justify-center">
                      <span className="block w-3 h-3 bg-blue-600"></span>
                    </Checkbox.Indicator>
                  </Checkbox.Root>
                  <Label.Root className="text-gray-700">{platform.charAt(0).toUpperCase() + platform.slice(1)}</Label.Root>
                </div>
              ))}
            </div>
            {selectedPlatforms.youtube && (
              <div>
                <h5>YouTube Settings</h5>
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <select {...field} className="w-full p-2 border rounded">
                          {categories.map((category) => (
                            <option key={category.value} value={category.value}>
                              {category.label}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., tag1,tag2"
                          className="w-full p-2 border rounded"
                        />
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>
          <Button className="w-full" type="submit">
            Post
          </Button>
        </form>
      </Form>
    </CardWrapper>
  );
};

export default PostForm;
