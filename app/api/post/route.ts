// /app/api/postVideo/register.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jwt-simple';
import { postVideoToInstagram, postVideoToYoutube } from '@/lib/post-service';
import { InstagramPostRequest, YoutubePostRequest, YoutubePrivacyStatuses } from '@/data/youtube';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const formatDateToUSEastern = (date: any) => {
  return dayjs(date).utc().format('YYYY-MM-DD HH:mm:ss');
};

async function handlePostVideo(req: NextRequest) {
  const body = await req.json();
  const { userId, values, videoUrl, selectedPlatforms } = body;

  const payload = { userId, iss: process.env.JWT_ISSUER };
  const token = jwt.encode(payload, process.env.JWT_SECRET!!, "HS256");

  const formattedDate = formatDateToUSEastern(values.dateToPost);
  const instagramPostRequest: InstagramPostRequest = {
    tokenAndVideoUrl: {
      token,
      videoUrl: videoUrl || ''
    },
    caption: values.description || '',
  };

  const youtubePostRequest: YoutubePostRequest = {
    tokenAndVideoUrl: {
      token,
      videoUrl: videoUrl || ''
    },
    snippet: {
      title: values.title || '',
      description: values.description || '',
      tags: values.tags ? values.tags.split(',') : [''],
      categoryId: (values.categoryId || "").toString() || '',
    },
    status: { privacyStatus: YoutubePrivacyStatuses.UNLISTED },
  };

  if (values.dateToPost) {
    const url = `${process.env.API_URL}/socials/schedule`;

    const schedulePostRequest = {
      token,
      mediaType: 'video',
      contentUrl: videoUrl,
      postTime: formattedDate,
      providers: Object.keys(selectedPlatforms).filter((platform: string) => selectedPlatforms[platform as keyof typeof selectedPlatforms]),
      instagramPostRequest: instagramPostRequest,
      youtubePostRequest: youtubePostRequest
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(schedulePostRequest),
      });

      if (response.ok) {
        return new NextResponse(JSON.stringify({ success: true, message: 'Post Scheduled Successfully' }), { status: 200 });
      } else {
        throw new Error('Failed to schedule post');
      }
    } catch (error: any) {
      return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
    }
  }

  // Post to individual platforms
  const results = { instagram: "null", youtube: "null" };

  if (selectedPlatforms.instagram) {
    try {
      const response = await postVideoToInstagram(instagramPostRequest);
      if (response!!.status === 200) {
        results.instagram = 'Post Successful on Instagram';
      } else {
        throw new Error('Failed to post on Instagram');
      }
    } catch (error: any) {
      return new NextResponse(JSON.stringify({ error: `Instagram: ${error.message}` }), { status: 500 });
    }
  }

  if (selectedPlatforms.youtube) {
    try {
      const response = await postVideoToYoutube(youtubePostRequest);
      if (response!!.status === 200) {
        results.youtube = `Post Successful on YouTube: Video ID: ${response.videoId}`;
      } else {
        throw new Error('Failed to post on YouTube');
      }
    } catch (error: any) {
      return new NextResponse(JSON.stringify({ error: `YouTube: ${error.message}` }), { status: 500 });
    }
  }

  return new NextResponse(JSON.stringify({ success: true, results }), { status: 200 });
}

export async function POST(req: NextRequest) {
  return handlePostVideo(req);
}
