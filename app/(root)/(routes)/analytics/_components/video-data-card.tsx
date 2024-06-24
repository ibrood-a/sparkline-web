import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { VideoDataProps } from '@/hooks/use-fetch-analytics'

export const VideoDataCard = ({
                                title,
                                thumbnail,
                                views,
                                likes,
                                comments,
                                duration
                              }: VideoDataProps) => {
  return (
    <div className="bg-secondary dark:bg-secondary/50 shadow flex w-full flex-col gap-3 rounded-lg p-5">
      {/* Thumbnail */}
      <div className="flex justify-center mb-3">
        <Image src={thumbnail} alt={title} width={150} height={150} className="rounded-lg" />
      </div>
      {/* Title */}
      <h2 className="text-lg font-semibold">{title}</h2>
      {/* Video Details */}
      <div className="flex flex-col gap-1">
        <p className="text-sm">Views: {views}</p>
        <p className="text-sm">Likes: {likes}</p>
        <p className="text-sm">Comments: {comments}</p>
        <p className="text-sm">Duration: {duration}</p>
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
