import { afterEach, describe, expect, it, vi } from 'vitest';

const setLocationSearch = (search: string) => {
  Object.defineProperty(window, 'location', {
    value: { ...window.location, search },
    writable: true,
  });
};

afterEach(() => {
  vi.resetModules();
});

describe('wca env helpers', () => {
  it('prefers staging configuration when staging query is present', async () => {
    setLocationSearch('?staging=true');
    const env = await import('./wca-env');

    expect(env.STAGING_QUERY_PARAMS).toBe(true);
    expect(env.WCA_ORIGIN).toBe('https://staging.worldcubeassociation.org');
    expect(env.WCA_OAUTH_CLIENT_ID).toBe('example-application-id');
  });

  it('falls back to environment variables when staging is absent', async () => {
    vi.stubEnv('VITE_WCA_ORIGIN', 'https://prod.example');
    vi.stubEnv('VITE_WCA_OAUTH_CLIENT_ID', 'prod-client');
    setLocationSearch('');

    const env = await import('./wca-env');

    expect(env.STAGING_QUERY_PARAMS).toBe(false);
    expect(env.WCA_ORIGIN).toBe('https://prod.example');
    expect(env.WCA_OAUTH_CLIENT_ID).toBe('prod-client');
  });

  it('defaults to production WCA origin when staging is absent and env is unset', async () => {
    vi.unstubAllEnvs();
    vi.stubEnv('VITE_WCA_OAUTH_CLIENT_ID', '');
    setLocationSearch('');

    const env = await import('./wca-env');

    expect(env.STAGING_QUERY_PARAMS).toBe(false);
    expect(env.WCA_ORIGIN).toBe('https://www.worldcubeassociation.org');
    expect(env.isOAuthClientConfigured()).toBe(false);
  });

  it('treats a configured client id as valid for production OAuth', async () => {
    vi.stubEnv('VITE_WCA_OAUTH_CLIENT_ID', 'my-wca-application-id');
    setLocationSearch('');

    const env = await import('./wca-env');

    expect(env.isOAuthClientConfigured()).toBe(true);
    expect(env.WCA_OAUTH_CLIENT_ID).toBe('my-wca-application-id');
  });
});
