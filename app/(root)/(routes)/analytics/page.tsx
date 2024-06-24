'use client'
import React, { useEffect, useState } from 'react'
import {
  fetchAnalytics,
  groupVideosByDate,
  generateLineGraphData,
  generateBarChartData,
  VideoDataProps
} from '@/hooks/use-fetch-analytics'
import { DollarSign, UserPlus, VideoIcon, CreditCard } from 'lucide-react';
import { DashboardCard, DashboardCardContent } from './_components/dashboard-card';
import { VideoDataCard } from './_components/video-data-card';
import LineGraph from './_components/line-graph';
import BarChart from './_components/barchart';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import axios from 'axios'
import { Progress } from '@/components/ui/progress'
import { ProgressIndicator } from '@radix-ui/react-progress'


const AnalyticsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoData, setVideoData] = useState<VideoDataProps[]>([]);
  const [channelData, setChannelData] = useState<any>(null);

  useEffect(() => {
    let videoDataCache = localStorage.getItem('videoData');
    let channelDataCache = localStorage.getItem('channelData');

    const fetchData = async () => {
      const { videoData, channelData, error } = await fetchAnalytics(videoDataCache, channelDataCache);

      if (error) {
        setError(error);
      } else {
        setVideoData(videoData);
        setChannelData(channelData);
      }
      setLoading(false);
    };

    fetchData()
  }, []);

    if (loading) {
        return (
          <div className="flex justify-center items-center h-screen">
              <Progress className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                  <ProgressIndicator className="bg-blue-600 h-full transition-all" style={{ width: '50%' }} />
              </Progress>
          </div>
        );
    }

    if (error) {
        return (
          <div className="flex justify-center items-center h-screen">
              <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
              </Alert>
          </div>
        );
    }

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
    const lineGraphData = generateLineGraphData(groupedVideos);
    const barChartData = generateBarChartData(groupedVideos);

    const currentVideos: [string, VideoDataProps[]][] = Object.entries(groupedVideos);

    return (
      <div className="flex flex-col gap-10 w-full mt-8 mb-12">
          <h1 className="font-bold text-4xl text-center">YouTube Analytics</h1>
          <div className="flex flex-col gap-6 w-full">
              <section className="grid w-full grid-cols-1 gap-6 transition-all sm:grid-cols-2 xl:grid-cols-4">
                  <DashboardCard label="Total Videos" Icon={VideoIcon} amount={`+${videoData.length}`} description="All time" />
                  <DashboardCard label="Total Views" Icon={DollarSign} amount={`+${channelData?.statistics.viewCount}`} description="All time" />
                  <DashboardCard label="Subscribers" Icon={UserPlus} amount={`+${channelData?.statistics.subscriberCount}`} description="All time" />
                  <DashboardCard
                    label="Total Comments"
                    Icon={CreditCard}
                    amount={`+${videoData.reduce((acc: any, video: any) => acc + video.comments, 0)}`}
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
                            {videos.map((video, index) => (
                              <VideoDataCard
                                key={`video-${index}`}
                                title={video.title}
                                thumbnail={video.thumbnail}
                                views={video.views}
                                likes={video.likes}
                                comments={video.comments}
                                duration={video.duration}
                                publishedAt={video.publishedAt}
                              />
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
              <section className="grid grid-cols-1 gap-6 transition-all lg:grid-cols-2 text-primary">
                  <LineGraph data={lineGraphData} />
                  <BarChart data={barChartData} />
              </section>
          </div>
      </div>
    );
};

export default AnalyticsPage;