import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { PlaylistItemsResponse } from '../_components/video-response-type'

export const VideoDataCard = ({
  kind, items, etag, pageInfo
                              }: PlaylistItemsResponse) => {
  return (
    <div className="bg-secondary dark:bg-secondary/50 shadow flex w-full flex-col gap-3 rounded-lg p-5">
      {/* Thumbnail */}
      <div className="flex justify-center mb-3">
        <Image src={items[0].snippet.thumbnails.high.url} alt={items[0].snippet.title} width={150} height={150} className="rounded-lg" />
      </div>
      {/* Title */}
      <h2 className="text-lg font-semibold">{items[0].snippet.title}</h2>
      {/* Video Details */}
      <div className="flex flex-col gap-1">
        <p className="text-sm">Views: {items[0].statistics.viewCount}</p>
        <p className="text-sm">Likes: {items[0].statistics.likeCount}</p>
        <p className="text-sm">Comments: {items[0].statistics.commentCount}</p>
        <p className="text-sm">Duration: {items[0].contentDetails!!.duration}</p>
      </div>
    </div>
  );
};

export function VideoDataCardContent(
  props: React.HTMLAttributes<HTMLDivElement>
) {
  return (
    <div
      {...props}
      className={cn(
        'flex w-full flex-col gap-3 rounded-lg p-5 shadow bg-secondary dark:bg-secondary/50',
        props.className
      )}
    />
  );
}
