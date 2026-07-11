const searchParams = new URLSearchParams(window.location.search);
export const STAGING_QUERY_PARAMS = searchParams.has('staging');

const PRODUCTION_URL = 'https://www.worldcubeassociation.org';
const STAGING_URL = 'https://staging.worldcubeassociation.org';
const STAGING_APP_ID = 'example-application-id';

const PLACEHOLDER_CLIENT_IDS = new Set([
  '',
  STAGING_APP_ID,
  'PASTE_YOUR_APPLICATION_ID_HERE',
]);

export const isOAuthClientConfigured = (): boolean => {
  if (STAGING_QUERY_PARAMS) {
    return true;
  }

  const clientId = import.meta.env.VITE_WCA_OAUTH_CLIENT_ID;
  return typeof clientId === 'string' && !PLACEHOLDER_CLIENT_IDS.has(clientId.trim());
};

if (
  import.meta.env.PROD &&
  !STAGING_QUERY_PARAMS &&
  !isOAuthClientConfigured()
) {
  console.error(
    'VITE_WCA_OAUTH_CLIENT_ID is missing or still a placeholder. OAuth sign-in will fail. ' +
      'Set your WCA Application ID in Netlify environment variables and redeploy.'
  );
}

if (
  import.meta.env.DEV &&
  !STAGING_QUERY_PARAMS &&
  !isOAuthClientConfigured()
) {
  console.warn(
    'VITE_WCA_OAUTH_CLIENT_ID is not set in .env — OAuth sign-in will fail against production. ' +
      'Add your WCA Application ID and restart the dev server.'
  );
}

export const WCA_ORIGIN: string = STAGING_QUERY_PARAMS
  ? STAGING_URL
  : import.meta.env.VITE_WCA_ORIGIN || PRODUCTION_URL;

export const WCA_OAUTH_CLIENT_ID: string = STAGING_QUERY_PARAMS
  ? STAGING_APP_ID
  : (import.meta.env.VITE_WCA_OAUTH_CLIENT_ID?.trim() || STAGING_APP_ID);
