export interface Thumbnail {
    url: string;
    width: number;
    height: number;
}

export interface Thumbnails {
    default: Thumbnail;
    medium: Thumbnail;
    high: Thumbnail;
    standard?: Thumbnail;
    maxres?: Thumbnail;
}

export interface ResourceId {
    kind: string;
    videoId: string;
}

export interface Snippet {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: Thumbnails;
    channelTitle: string;
    playlistId: string;
    position: number;
    resourceId: ResourceId;
    videoOwnerChannelTitle: string;
    videoOwnerChannelId: string;
}

export interface Statistics {
    viewCount: string;
    likeCount: string;
    dislikeCount: string;
    favoriteCount: string;
    commentCount: string;
}

export interface ContentDetails {
    duration: string;
    dimension: string;
    definition: string;
}

export interface PlaylistItem {
    kind: string;
    etag: string;
    id: string;
    snippet: Snippet;
    statistics: Statistics;
    contentDetails?: ContentDetails;
}

export interface PlaylistItemsResponse {
    kind: string;
    etag: string;
    items: PlaylistItem[];
    pageInfo: {
        totalResults: number;
        resultsPerPage: number;
    };
}
