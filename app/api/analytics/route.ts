'use server'
import { auth } from '@/auth'
import axios from 'axios'
import { NextResponse } from 'next/server'
import jwt from 'jwt-simple'

export async function GET(req: Request) {
  try {
    const user = await auth()

    if (!user || !user.user.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const payload = { userId: user.user.id, iss: process.env.JWT_ISSUER };
    console.log(payload);
    const token = jwt.encode(payload, process.env.JWT_SECRET!!, 'HS256');

    console.log(payload, token);
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

    return new NextResponse(JSON.stringify({ videoData: videoResponse.data, channelData: channelResponse.data.items[0] }));
  } catch (error) {
    console.error(error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
