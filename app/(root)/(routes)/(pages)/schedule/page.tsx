// app/schedule/page.server.tsx
import React from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import ScheduleClient from './schedule-page';

export default async function SchedulePage() {
  const userRole = await auth();

  if (!userRole) {
    redirect('/login');
  }

  console.log(userRole)
  return <ScheduleClient role={userRole} />;
}
