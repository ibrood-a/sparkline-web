import React from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import ClientComponent from './render-analytics';
import axios from 'axios';
import jwt from 'jwt-simple';

async function fetchAnalytics(userId: string) {
  const payload = { userId, iss: process.env.JWT_ISSUER };
  const token = jwt.encode(payload, process.env.JWT_SECRET!!, 'HS256');

  const [videoResponse, channelResponse] = await Promise.all([
    axios.post(
      `${process.env.API_URL}/socials/analyze/youtube/post`,
      { token },
      { headers: { 'Content-Type': 'application/json' } }
    ),
    axios.post(
      `${process.env.API_URL}/socials/analyze/youtube/page`,
      { token },
      { headers: { 'Content-Type': 'application/json' } }
    ),
  ]);

  return {
    videoData: videoResponse.data,
    channelData: channelResponse.data.items[0],
  };
}

export default async function AnalyticsPage() {
  const user = await auth();

  if (!user || !user.user.id) {
    return redirect('/login');
  }

  // Fetch the analytics data
  const { videoData, channelData } = await fetchAnalytics(user.user.id!!);

  return <ClientComponent initialVideoData={videoData} initialChannelData={channelData} />;
}
