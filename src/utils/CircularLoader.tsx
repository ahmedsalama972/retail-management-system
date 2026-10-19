import { Box, CircularProgress, Typography } from '@mui/material';

export const CircularLoader = ({ text }: any) => (
  <Box sx={styles.loaderContainer}>
    <CircularProgress size={100} sx={styles.loader} />
    {text && (
      <Typography variant="h5" sx={styles.loader}>
        {text}
      </Typography>
    )}
  </Box>
);

const styles = {
  loader: {
    color: '#fff'
  },
  loaderContainer: {
    position: 'fixed',
    zIndex: 10000,
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    opacity: 0.4,
    backgroundColor: 'black',
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'center'
  }
};
