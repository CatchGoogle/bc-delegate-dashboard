import { APP_NAME, APP_TAGLINE, ORIGINAL_PROJECT } from '../../config/branding';
import { useAuth } from '../../providers/AuthProvider';
import { isOAuthClientConfigured } from '../../lib/api';
import CompetitionList from '../../components/CompetitionList';
import Header from './Header';
import { Alert, Button, Container, Divider, Link, Typography } from '@mui/material';

const Home = () => {
  const { signedIn, signIn, userFetchError } = useAuth();
  const oauthConfigured = isOAuthClientConfigured();

  return (
    <>
      <Header />
      <div style={{ overflowY: 'auto', paddingTop: '1em' }}>
        <Container>
          {!oauthConfigured && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Sign-in is not configured for this deployment. Add{' '}
              <code>VITE_WCA_OAUTH_CLIENT_ID</code> (your WCA Application ID) in Netlify
              environment variables, then trigger a new deploy.
            </Alert>
          )}
          {userFetchError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {userFetchError.message}
            </Alert>
          )}
        </Container>
        {signedIn() ? (
          <CompetitionList />
        ) : (
          <Container>
            <Typography sx={{ mb: 2 }}>
              Welcome to {APP_NAME}!
              <br />
              {APP_TAGLINE}
              <br />
              <br />
              This fork adds custom competition roles and WCIF export support on top of{' '}
              <Link href={ORIGINAL_PROJECT.url} target="_blank" rel="noopener noreferrer">
                {ORIGINAL_PROJECT.name}
              </Link>{' '}
              by {ORIGINAL_PROJECT.author}.
            </Typography>
            <Typography sx={{ mb: 2 }}>
              Use this tool to generate and configure groups, export data, or import your own
              groups. Requires no setup — configure groups for any round you want, pick scramblers,
              set group counts, and populate groups with the press of a button.
            </Typography>
            <Divider style={{ margin: '1em 0' }} />
            <Typography sx={{ mb: 1 }}>Sign in to view comps!</Typography>
            <Button onClick={() => signIn()} variant="outlined" disabled={!oauthConfigured}>
              Sign In
            </Button>
          </Container>
        )}
      </div>
    </>
  );
};

export default Home;
