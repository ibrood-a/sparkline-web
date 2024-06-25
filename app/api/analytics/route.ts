import { NextApiRequest, NextApiResponse } from 'next'
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

    const payload = {user: user?.user.id, iss: process.env.JWT_ISSUER};
    const token = jwt.encode(payload, process.env.JWT_SECRET!!, "HS256");

    const [videoResponse, channelResponse] = await Promise.all([
      axios.get(`${process.env.API_URL}/socials/analyze/youtube/post`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      axios.get(`${process.env.API_URL}/socials/analyze/youtube/page`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    ]);

    localStorage.setItem('videoData', JSON.stringify(videoResponse.data));
    localStorage.setItem('channelData', JSON.stringify(channelResponse.data.items[0]));

    return new NextResponse(JSON.stringify({ videoData: videoResponse.data, channelData: channelResponse.data.items[0] }))
  } catch (error) {
    console.error(error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
