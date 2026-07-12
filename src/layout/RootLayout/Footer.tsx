import { APP_NAME, FORK_PROJECT, ORIGINAL_PROJECT } from '../../config/branding';
import { WCA_ORIGIN } from '../../lib/api';
import { Box, Link, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';

const linkStyle = {
  fontWeight: 500,
  color: grey[900],
  '&:hover': {
    textDecoration: 'none',
    opacity: 0.7,
  },
};

const gitSha = import.meta.env.VITE_GIT_SHA;

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        px: 2,
        py: 1.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.75,
        borderTop: 1,
        borderColor: 'divider',
      }}>
      <Typography variant="body2" lineHeight={1.6}>
        Based on{' '}
        <Link sx={linkStyle} href={ORIGINAL_PROJECT.url} target="_blank" rel="noopener noreferrer">
          {ORIGINAL_PROJECT.name}
        </Link>{' '}
        by {ORIGINAL_PROJECT.author} ·{' '}
        <Link sx={linkStyle} href={FORK_PROJECT.url} target="_blank" rel="noopener noreferrer">
          {FORK_PROJECT.name}
        </Link>{' '}
        by {FORK_PROJECT.author} ·{' '}
        <Link sx={linkStyle} href={`mailto:${FORK_PROJECT.contactEmail}`}>
          Contact
        </Link>
      </Typography>

      <Typography variant="body2" lineHeight={1.6} color="text.secondary">
        {APP_NAME} uses data from{' '}
        <Link sx={linkStyle} href={WCA_ORIGIN} target="_blank" rel="noopener noreferrer">
          {WCA_ORIGIN}
        </Link>
        {gitSha && (
          <>
            {' · '}
            <Link
              sx={linkStyle}
              href={`${FORK_PROJECT.url}/commit/${gitSha}`}
              target="_blank"
              rel="noopener noreferrer">
              {gitSha}
            </Link>
          </>
        )}
      </Typography>
    </Box>
  );
};

export default Footer;
