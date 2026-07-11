import {
  getLocalStorage,
  localStorageKey,
  setLocalStorage,
  WCA_ORIGIN,
  WCA_OAUTH_CLIENT_ID,
  getMe,
  isOAuthClientConfigured,
} from '../../lib/api';
import { type WcaUser } from '../../lib/api/types';
import { AuthContext } from './AuthContext';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Must match a callback URL registered on the WCA OAuth application exactly.
 */
const oauthRedirectUri = () => {
  const redirectUri = window.location.origin;
  const searchParams = new URLSearchParams(window.location.search);
  const stagingParam = searchParams.has('staging');
  return stagingParam ? `${redirectUri}?staging=true` : redirectUri;
};

const clearSession = () => {
  localStorage.removeItem(localStorageKey('accessToken'));
  localStorage.removeItem(localStorageKey('expirationTime'));
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState(getLocalStorage('accessToken'));
  const [expirationTime, setExpirationTime] = useState(() => {
    const expirationTime = getLocalStorage('expirationTime');
    return expirationTime ? new Date(expirationTime) : null;
  });
  const [user, setUser] = useState<WcaUser | null>(null);
  const [userFetchError, setUserFetchError] = useState<Error | undefined>();
  const [now, setNow] = useState(new Date());

  const location = useLocation();
  const navigate = useNavigate();

  const expired = useMemo(
    () => expirationTime && now >= new Date(expirationTime),
    [expirationTime, now]
  );

  useEffect(() => {
    const token = getLocalStorage('accessToken');
    if (token) {
      setAccessToken(token);
    }

    const interval = setInterval(() => {
      setNow(new Date());
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (expired) {
      setAccessToken(null);
      setUser(null);
      setExpirationTime(null);
      clearSession();
    }
  }, [expired]);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, '');

    if (!hash) {
      return;
    }
    const hashParams = new URLSearchParams(hash);

    if (hashParams.has('access_token')) {
      setLocalStorage('accessToken', hashParams.get('access_token'));

      setAccessToken(hashParams.get('access_token'));
    }

    if (hashParams.has('expires_in')) {
      /* Expire the token 15 minutes before it actually does,
           this way it doesn't expire right after the user enters the page. */
      const expiresInSeconds = Number.parseInt(hashParams.get('expires_in') ?? '0', 10) - 15 * 60;
      const expirationTime = new Date(new Date().getTime() + expiresInSeconds * 1000);
      setLocalStorage('expirationTime', expirationTime.toISOString());
    }
    /* Clear the hash if there is a token. */
    if (hashParams.has('access_token')) {
      // history.replace({ ...history.location, hash: null });
      navigate({
        pathname: '/',
        hash: '',
      });
    }
  }, [location, navigate]);

  const signedIn = useCallback(() => !!accessToken, [accessToken]);

  useEffect(() => {
    if (user || !accessToken || expired) {
      return;
    }

    getMe()
      .then(({ me }) => {
        setUser(me);
        setUserFetchError(undefined);
      })
      .catch((err: Error) => {
        console.error(err);
        if (err.message.includes('401')) {
          setAccessToken(null);
          setUser(null);
          setExpirationTime(null);
          clearSession();
        }
        setUserFetchError(err);
      });
  }, [accessToken, expired, user]);

  const signIn = () => {
    if (!isOAuthClientConfigured()) {
      setUserFetchError(
        new Error(
          'OAuth is not configured for this deployment. Set VITE_WCA_OAUTH_CLIENT_ID to your WCA Application ID in Netlify environment variables, then redeploy.'
        )
      );
      return;
    }

    const params = new URLSearchParams({
      client_id: WCA_OAUTH_CLIENT_ID,
      response_type: 'token',
      redirect_uri: oauthRedirectUri(),
      scope: 'public manage_competitions',
    });

    window.location.href = `${WCA_ORIGIN}/oauth/authorize?${params.toString()}`;
  };

  const signOut = () => {
    setAccessToken(null);
    setExpirationTime(null);
    clearSession();
    setUser(null);
    setUserFetchError(undefined);
  };

  const value = { user, signIn, signOut, signedIn, userFetchError };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
