import { useAuth } from '../providers/AuthProvider';
import { useEffect, useState } from 'react';
import ReactGA from 'react-ga';
import { useLocation } from 'react-router-dom';

const usePageTracking = (trackingCode?: string) => {
  const location = useLocation();
  const { user } = useAuth();
  const [initialized, setInitialized] = useState(false);
  const measurementId = trackingCode?.trim() ?? '';

  useEffect(() => {
    if (!measurementId) {
      setInitialized(false);
      return;
    }

    ReactGA.initialize(measurementId, {
      debug: window.location.href.includes('localhost'),
      gaOptions: {
        name: user?.name,
        ...(user?.id ? { userId: user?.id?.toString() } : {}),
      },
    });
    setInitialized(true);
  }, [measurementId, user?.id, user?.name]);

  useEffect(() => {
    if (initialized && measurementId) {
      ReactGA.pageview(location.pathname + location.search);
    }
  }, [initialized, location, measurementId]);
};

export default usePageTracking;
