'use client';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import * as Label from '@radix-ui/react-label';
import { Form } from '@/components/ui/form';
import { CardWrapper } from '@/components/profile/card-wrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import dynamic from 'next/dynamic';
import { Accounts } from './page';
import { ExtendedUser } from '@/next-auth'
import {
  generateFacebookOAuthLink,
  generateGoogleOAuthLink,
  generateLinkedInOAuthLink,
  generateTwitterOAuthLink
} from '@/lib/oauth'
const MarkdownEditor = dynamic(() => import('@/components/ui/markdown-editor'), { ssr: false });

interface ProfileFormProps {
  userProfile: {
    user: ExtendedUser,
    id: string,
    role: string,
    name: string;
    email: string;
    accounts: { [key: string]: boolean },
  /*
    id: string;
    profilePic: string;
    createdAt: string;
    linkedAccounts: { [key: string]: boolean };
    recentPosts: Array<{ title: string; date: string }>;
 */
  };
}


const ProfileForm: React.FC<ProfileFormProps> = ({ userProfile }) => {
  //const [profilePicUrl, setProfilePicUrl] = useState<string | null>(userProfile.profilePic);
  const [linkedAccounts, setLinkedAccounts] = useState<{ [key: string]: boolean }>({
    youtube: false,
    twitter: false,
    instagram: false,
    linkedin: false,
    tiktok: false,
  });

  const [isEditing, setIsEditing] = useState(false);
  const form = useForm({
    defaultValues: {
      name: userProfile.name,
      email: userProfile.email,
    },
  });

  const handleSwitchChange = (platform: string, checked: boolean) => {
    if (platform === 'youtube') {
      // Update youtube logic here
      generateGoogleOAuthLink(Number(userProfile.id)).then(link => window.open(link));
    }
    if (platform === 'twitter') {
      // Update twitter logic here
      generateTwitterOAuthLink(Number(userProfile.id)).then(link => window.open(link));
    }
    if (platform === 'instagram') {
      // Update instagram logic here
      generateFacebookOAuthLink(Number(userProfile.id)).then(link => window.open(link));
    }
    if (platform === 'linkedin') {
      // Update facebook logic here
      generateLinkedInOAuthLink(Number(userProfile.id)).then(link => window.open(link));
    }
    if (platform === 'tiktok') {
      // Update tiktok logic here
    }

    setLinkedAccounts((prev) => ({
      ...prev,
      [platform]: checked,
    }));
  };

  const onSubmit = (values: { name: string; email: string }) => {
    // Update profile logic here
    console.log('Updating profile', values);
    console.log('linked accounts', userProfile.accounts)
    console.log('user struct', userProfile.user)
    toast.success('Profile updated successfully');
    setIsEditing(false);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 grid grid-cols-1 md:grid-cols-[50%,50%] gap-6 h-2xl">
      <div className="grid gap-6">
        <CardWrapper className="w-full">
          <div className="flex flex-col md:flex-row items-center space-x-6">
            {/*<img src={profilePicUrl || '/default-profile-pic.jpg'} alt="Profile Pic"
                 className="h-24 w-24 object-cover -ml-7 rounded-lg" />*/}
            <div className="flex flex-col items-start">
              <h2 className="text-2xl font-bold">{userProfile.name}</h2>
              <p>{userProfile.email}</p>


            </div>
            <Button className="mt-4" onClick={() => setIsEditing(true)}>Edit Profile</Button>
          </div>
        </CardWrapper>

        {isEditing && (
          <CardWrapper className="w-full">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label.Root className="block text-sm font-medium mt-4">
                    Name
                  </Label.Root>
                  <Input
                    {...form.register('name')}
                  />
                </div>
                <div>
                  <Label.Root className="block text-sm font-medium mt-4">
                    Email
                  </Label.Root>
                  <Input
                    {...form.register('email')}
                  />
                </div>
                <div className="mt-4">
                  <Button className="w-full mb-5" type="submit">
                    Update Profile
                  </Button>
                </div>
              </form>
            </Form>
          </CardWrapper>
        )}

        <CardWrapper className="w-full">
          {Object.keys(linkedAccounts).map((platform) => (
            <div key={platform} className="flex items-center justify-between mb-2">
              <Label.Root className="text-lg font-medium">
                {platform.charAt(0).toUpperCase() + platform.slice(1)}
              </Label.Root>
              <Button
                className={`w-20 px-2 py-2 rounded-full h-5 mt-2 ${linkedAccounts[platform] ? 'bg-green-500' : 'bg-red-500'}`}
                onClick={() => handleSwitchChange(platform, !linkedAccounts[platform])}
              >
                {userProfile.accounts[platform] ? 'Linked' : 'Not Linked'}
              </Button>
            </div>
          ))}
        </CardWrapper>
      </div>

      <div className="md:col-span-1 grid">
        <CardWrapper className="w-full">
          <div className="flex flex-col space-y-6 pt-6 pb-6 h-auto">
            <h3 className="text-lg font-medium mb-4">Recent Posts</h3>
            <ul className="space-y-2">
              {/*{userProfile.recentPosts.map((post, index) => (
                <li key={index} className="flex justify-between">
                  <span>{post.title}</span>
                  <span>{post.date}</span>
                </li>
              ))}*/}
            </ul>
          </div>
        </CardWrapper>
      </div>
    </div>
  );
};

export default ProfileForm
