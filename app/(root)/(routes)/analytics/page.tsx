import React from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import ClientComponent from './videoCache';
import { fetchAnalytics } from '@/hooks/use-fetch-analytics';

export default async function AnalyticsPage() {
  const role = await auth();

  if (!role) {
    return redirect('/');
  }

  // Fetch data from localStorage (simulated here since localStorage is not available on the server)
  const videoDataCache = null; // localStorage.getItem('videoData') would go here in a client environment
  const channelDataCache = null; // localStorage.getItem('channelData') would go here in a client environment

  // Fetch the analytics data
  const { videoData, channelData, error } = await fetchAnalytics(videoDataCache, channelDataCache);

  if (error) {
    console.error('Error fetching analytics data:', error);
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="alert alert-error">
          <div className="alert-title">Error</div>
          <div className="alert-description">There was an error fetching analytics data.</div>
        </div>
      </div>
    );
  }

  return <ClientComponent initialVideoData={videoData} initialChannelData={channelData} />;
}
