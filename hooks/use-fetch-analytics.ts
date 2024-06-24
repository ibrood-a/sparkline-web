// hooks/useFetchAnalytics.ts
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export interface VideoDataProps {
  title: string;
  thumbnail: string;
  views: number;
  likes: number;
  comments: number;
  duration: string;
  publishedAt: string;
}

interface ChannelDataProps {
  statistics: {
    viewCount: number;
    subscriberCount: number;
  };
}

interface FetchAnalyticsResult {
  error: string | null;
  videoData: VideoDataProps[];
  channelData: ChannelDataProps | null;
}

interface LineGraphData {
  month: string;
  users: number;
}

interface BarChartData {
  month: string;
  total: number;
}

export async function fetchAnalytics(videoDataCache: string | null, channelDataCache: string | null): Promise<FetchAnalyticsResult> {
  if (videoDataCache && channelDataCache) {
    return {
      videoData: JSON.parse(videoDataCache),
      channelData: JSON.parse(channelDataCache),
      error: null,
    };
  }

  try {
    const response = await axios.get('/api/analytics');
    return {
      videoData: response.data.videoData,
      channelData: response.data.channelData,
      error: null,
    };
  } catch (err: any) {
    toast.error(err.message);
    return {
      videoData: [],
      channelData: null,
      error: err.message,
    };
  }
}

export function groupVideosByDate(videoData: VideoDataProps[]): Record<string, VideoDataProps[]> {
  return videoData.reduce((acc, video) => {
    const date = new Date(video.publishedAt).toDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(video);
    return acc;
  }, {} as Record<string, VideoDataProps[]>);
}

export function generateLineGraphData(groupedVideos: Record<string, VideoDataProps[]>): LineGraphData[] {
  return Object.entries(groupedVideos).map(([date, videos]) => ({
    month: format(new Date(date), "MMMM do, yyyy H:mma"),
    users: videos.length,
  }));
}

export function generateBarChartData(groupedVideos: Record<string, VideoDataProps[]>): BarChartData[] {
  return Object.entries(groupedVideos).map(([date, videos]) => ({
    month: format(new Date(date), "MMMM do, yyyy H:mma"),
    total: videos.reduce((sum, video) => sum + video.views, 0),
  }));
}
