import jwt from "jwt-simple";
import sha256 from 'crypto-js/sha256';
import Base64 from 'crypto-js/enc-base64';

export const generateGoogleOAuthLink = (userId: number) => {
  const secretKey = process.env.NEXT_PUBLIC_JWT_SECRET || "";
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_API_URL}/socials/auth/youtube`

  const payload = {userId, platform: 'web', code_verifier: '', iss: process.env.NEXT_PUBLIC_JWT_ISSUER};
  const state = jwt.encode(payload, secretKey, "HS256");
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${encodeURIComponent(redirectUri!!)}&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fyoutube.upload%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fyoutube.readonly%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fyoutube%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fyoutube.force-ssl%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fyt-analytics.readonly%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fyt-analytics-monetary.readonly&response_type=code&access_type=offline&prompt=consent&state=${state}`;
};

export const generateFacebookOAuthLink = (userId: number) => {
  const secretKey = process.env.NEXT_PUBLIC_JWT_SECRET || "";
  const facebookClientId = process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_API_URL}/socials/auth/instagram`

  const scopes = [
    'instagram_content_publish',
    'instagram_basic',
    'instagram_manage_insights',
    'pages_show_list',
    'pages_read_engagement',
    'business_management'
  ].join(',');

  const payload = {userId, platform: 'web', code_verifier: '', iss: process.env.NEXT_PUBLIC_JWT_ISSUER};
  const state = jwt.encode(payload, secretKey, "HS256");

  window.location.href = `https://www.facebook.com/v11.0/dialog/oauth?client_id=${facebookClientId}&redirect_uri=${encodeURIComponent(redirectUri!!)}&scope=${encodeURIComponent(scopes)}&response_type=code&state=${state}`;
};

export const generateTwitterOAuthLink = (userId: number) => {
  const secretKey = process.env.NEXT_PUBLIC_JWT_SECRET || "";

  const verifier = generateRandomString(128);
  const challenge = generateCodeChallenge(verifier);

  const twitterClientId = process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_API_URL}/socials/auth/twitter`
  const scopes = [
    "tweet.read",
    "tweet.write",
    "tweet.moderate.write",
    "users.read",
    "follows.read",
    "follows.write",
    "offline.access",
    "space.read",
    "mute.read",
    "mute.write",
    "like.read",
    "like.write",
    "list.read",
    "list.write",
    "block.read",
    "block.write",
    "bookmark.read",
    "bookmark.write"
  ].join(' ');

  const payload = {userId, platform: 'web', code_verifier: verifier, iss: process.env.NEXT_PUBLIC_JWT_ISSUER};
  const state = jwt.encode(payload, secretKey, "HS256");

  window.location.href = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${twitterClientId}&redirect_uri=${encodeURIComponent(redirectUri!!)}&scope=${encodeURIComponent(scopes)}&state=${state}&code_challenge=${challenge}&code_challenge_method=S256`;
};


export const generateLinkedInOAuthLink = (userId: number) => {
  const secretKey = process.env.NEXT_PUBLIC_JWT_SECRET || "";
  const linkedInClientId = process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_API_URL}/socials/auth/linkedin`
  const payload = {userId, platform: 'web', code_verifier: '', iss: process.env.NEXT_PUBLIC_JWT_ISSUER};
  const state = jwt.encode(payload, secretKey, "HS256");

  const scopes = [
    'r_liteprofile',
    'r_emailaddress',
    'w_member_social'
  ].join(' ');

  window.location.href = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${linkedInClientId}&redirect_uri=${encodeURIComponent(redirectUri!!)}&scope=${encodeURIComponent(scopes)}&state=${state}`;
};


// Generate a random string
const generateRandomString = (length: number) => {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let verifier = '';
  for (let i = 0; i < length; i++) {
    verifier += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return verifier;
};

const generateCodeChallenge = (verifier: string) => {
  const hash = sha256(verifier);
  const base64Hash = Base64.stringify(hash);
  return base64Hash.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
