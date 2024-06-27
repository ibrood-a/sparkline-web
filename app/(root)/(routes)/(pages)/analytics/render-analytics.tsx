'use client';

import React, { useEffect, useState } from 'react';
import { VideoDataCard } from '..//analytics/_components/video-data-card';
import { DashboardCard, DashboardCardContent } from '../analytics/_components/dashboard-card';
import { VideoIcon, DollarSign, UserPlus, CreditCard } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { fetchAnalytics, groupVideosByDate } from '@/hooks/use-fetch-analytics';
import { PlaylistItemsResponse } from '../analytics/_components/video-response-type';
import { getItem, setItem } from '@/lib/indexed-db';

const ClientComponent: React.FC<ClientComponentProps> = ({ initialVideoData, initialChannelData }) => {
  const [videoData, setVideoData] = useState<PlaylistItemsResponse[]>(initialVideoData);
  const [channelData, setChannelData] = useState<ChannelData | null>(initialChannelData);
  const [currentPage, setCurrentPage] = useState(1);
  const [videosPerPage] = useState(4);

  useEffect(() => {
    const fetchData = async () => {
      const videoDataCache = await getItem('AnalyticsDB', 'Cache', 'videoData');
      const channelDataCache = await getItem('AnalyticsDB', 'Cache', 'channelData');

      if (videoDataCache && channelDataCache) {
        setVideoData(JSON.parse(videoDataCache));
        setChannelData(JSON.parse(channelDataCache));
        return;
      }

      const result = await fetchAnalytics(videoDataCache, channelDataCache);
      if (result.error) {
        console.error(result.error);
      } else {
        setVideoData(result.videoData);
        setChannelData(result.channelData);

        await setItem('AnalyticsDB', 'Cache', 'videoData', JSON.stringify(result.videoData));
        await setItem('AnalyticsDB', 'Cache', 'channelData', JSON.stringify(result.channelData));
      }
    };

    fetchData();
  }, []);

  if (!videoData || videoData.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Alert variant="default">
          <AlertTitle>No Data</AlertTitle>
          <AlertDescription>No video data available.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const groupedVideos = groupVideosByDate(videoData);
  const indexOfLastVideo = currentPage * videosPerPage;
  const indexOfFirstVideo = indexOfLastVideo - videosPerPage;
  const currentVideos = Object.entries(groupedVideos).slice(indexOfFirstVideo, indexOfLastVideo);

  return (
    <div className="flex flex-col gap-10 w-full mt-8 mb-12">
      <h1 className="font-bold text-4xl text-center">YouTube Analytics</h1>
      <div className="flex flex-col gap-6 w-full">
        <section className="grid w-full grid-cols-1 gap-6 transition-all sm:grid-cols-2 xl:grid-cols-4">
          <DashboardCard label="Total Videos" Icon={VideoIcon} amount={`+${videoData.length}`} description="All time" />
          <DashboardCard label="Total Views" Icon={DollarSign} amount={`+${channelData?.statistics?.viewCount}`} description="All time" />
          <DashboardCard label="Subscribers" Icon={UserPlus} amount={`+${channelData?.statistics?.subscriberCount}`} description="All time" />
          <DashboardCard
            label="Total Comments"
            Icon={CreditCard}
            amount={`+${videoData.reduce((acc: number, video: PlaylistItemsResponse) => acc + video.items.reduce((a, v) => a + parseInt(v.statistics.commentCount || '0'), 0), 0)}`}
            description="All time"
          />
        </section>
        <section className="grid grid-cols-1 gap-6 transition-all lg:grid-cols-2 text-primary">
          <DashboardCardContent>
            <section className="flex justify-between gap-2 text-primary pb-2">
              <p>Recent Videos</p>
              <VideoIcon className="h-4 w-4" />
            </section>
            {currentVideos.map(([date, videos]) => (
              <div key={date}>
                <h3 className="text-lg font-semibold">{date}</h3>
                {videos.map((videoGroup) => (
                  videoGroup.items.map((video: any, index: any) => (
                    <VideoDataCard
                      key={`video-${index}`}
                      kind={videoGroup.kind}
                      items={videoGroup.items}
                      etag={videoGroup.etag}
                      pageInfo={videoGroup.pageInfo}
                    />
                  ))
                ))}
              </div>
            ))}
          </DashboardCardContent>
          <DashboardCardContent>
            <section className="flex justify-between gap-2 text-primary pb-2">
              <p>Recent Comments</p>
              <CreditCard className="h-4 w-4" />
            </section>
            {/* Render comments data here */}
          </DashboardCardContent>
        </section>
        <section className="grid grid-cols-1 gap-6 transition-all lg:grid-cols-2 text-primary"></section>
      </div>
    </div>
  );
};

export class ChannelData {
  statistics: {
    viewCount: string;
    subscriberCount: string;
  } | undefined;
}

interface ClientComponentProps {
  initialVideoData: PlaylistItemsResponse[];
  initialChannelData: ChannelData | null;
}

class FetchAnalyticsResult {
  error: string | null | undefined;
  videoData: PlaylistItemsResponse[] | undefined;
  channelData: ChannelData | null | undefined;
}

export default ClientComponent;
