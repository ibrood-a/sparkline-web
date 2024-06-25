export const categories = [
    {value: '2', label: 'Autos & Vehicles'},
    {value: '1', label: 'Film & Animation'},
    {value: '10', label: 'Music'},
    {value: '15', label: 'Pets & Animals'},
    {value: '17', label: 'Sports'},
    {value: '18', label: 'Short Movies'},
    {value: '19', label: 'Travel & Events'},
    {value: '20', label: 'Gaming'},
    {value: '21', label: 'Videoblogging'},
    {value: '22', label: 'People & Blogs'},
    {value: '23', label: 'Comedy'},
    {value: '24', label: 'Entertainment'},
    {value: '25', label: 'News & Politics'},
    {value: '26', label: 'Howto & Style'},
    {value: '27', label: 'Education'},
    {value: '28', label: 'Science & Technology'},
    {value: '29', label: 'Nonprofits & Activism'},
    {value: '30', label: 'Movies'},
    {value: '31', label: 'Anime/Animation'},
    {value: '32', label: 'Action/Adventure'},
    {value: '33', label: 'Classics'},
    {value: '34', label: 'Comedy'},
    {value: '35', label: 'Documentary'},
    {value: '36', label: 'Drama'},
    {value: '37', label: 'Family'},
    {value: '38', label: 'Foreign'},
    {value: '39', label: 'Horror'},
    {value: '40', label: 'Sci-Fi/Fantasy'},
    {value: '41', label: 'Thriller'},
    {value: '42', label: 'Shorts'},
    {value: '43', label: 'Shows'},
    {value: '44', label: 'Trailers'},
];

export interface UploadRequest {
    token: string;
    byteArray: string; // Change from number[] to string
}

export interface TokenAndVideoUrl {
    token: string;
    videoUrl: string;
}

export enum YoutubePrivacyStatuses {
    PRIVATE = "private",
    PUBLIC = "public",
    UNLISTED = "unlisted"
}

export interface YoutubePrivacyStatus {
    privacyStatus: YoutubePrivacyStatuses;
}

export interface YoutubeShortSnippet {
    title: string;
    description: string;
    tags: string[];
    categoryId: string;
}

export interface YoutubePostRequest {
    snippet: YoutubeShortSnippet;
    status: YoutubePrivacyStatus;
    tokenAndVideoUrl?: TokenAndVideoUrl;
}

export interface InstagramPostRequest {
    caption: string;
    tokenAndVideoUrl?: TokenAndVideoUrl;
}
