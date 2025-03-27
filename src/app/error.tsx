'use client';

import { Box, Button, Container, Typography } from '@mui/material';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
      <Typography variant="h2" sx={{ mb: 4 }}>
        Something went wrong!
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 6 }}>
        An unexpected error has occurred. Please try again later.
      </Typography>
      
      <Box>
        <Button 
          onClick={reset}
          variant="contained" 
          size="large"
          sx={{
            py: 2,
            px: 4,
            fontSize: '1.1rem',
            fontWeight: 600,
            borderRadius: 2,
          }}
        >
          Try again
        </Button>
      </Box>
    </Container>
  );
}