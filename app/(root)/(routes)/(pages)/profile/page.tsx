'use server'
import ProfileForm from './render-page'
import React from 'react'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export type Accounts = { [key: string]: boolean };

const ProfilePage: React.FC = async () => {

  const role = await auth();

  if (!role) {
    redirect('/login');
  }

  const sampleUserProfile = {
    user: role.user,
    id: role.user.id || "",
    role: role.user.role.toString() || "",
    name: role.user.name || "",
    email: role.user.email || "",
    accounts: {}
  };

  return <ProfileForm userProfile={sampleUserProfile} />;
};

export default ProfilePage;
