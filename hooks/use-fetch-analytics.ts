// hooks/useFetchAnalytics.ts
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { PlaylistItemsResponse } from '@/app/(root)/(routes)/(pages)/analytics/_components/video-response-type'
import { ChannelData } from '@/app/(root)/(routes)/(pages)/analytics/render-analytics'
import { getItem, setItem } from '@/lib/indexed-db';

interface FetchAnalyticsResult {
  error: string | null;
  videoData: PlaylistItemsResponse[];
  channelData: ChannelData | null;
}

interface LineGraphData {
  month: string;
  users: number;
}

interface BarChartData {
  month: string;
  total: number;
}

const DB_NAME = 'AnalyticsDB';
const STORE_NAME = 'Cache';

export async function fetchAnalytics(videoDataCache: string, channelDataCache: string): Promise<FetchAnalyticsResult> {

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
    return {
      videoData: [],
      channelData: null,
      error: err.message,
    };
  }
}

export function groupVideosByDate(videoData: PlaylistItemsResponse[]): Record<string, PlaylistItemsResponse[]> {
  return videoData.reduce((acc, video) => {
    const date = new Date(video.items[0].snippet.publishedAt).toDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(video);
    return acc;
  }, {} as Record<string, PlaylistItemsResponse[]>);
}

export function generateLineGraphData(groupedVideos: Record<string, PlaylistItemsResponse[]>): LineGraphData[] {
  return Object.entries(groupedVideos).map(([date, videos]) => ({
    month: format(new Date(date), "MMMM do, yyyy H:mma"),
    users: videos.length,
  }));
}
