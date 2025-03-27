'use client';

import { Box, Button, Container, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { textGradientStyles, buttonStyles } from '@/constants/styles';
import HomeIcon from '@mui/icons-material/Home';

export default function NotFound() {
  const router = useRouter();

  return (
    <Container maxWidth="md" sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh', 
      textAlign: 'center',
      padding: '20px'
    }}>
      <Typography variant="h1" sx={{ fontSize: '6rem', fontWeight: 700, ...textGradientStyles, mb: 2 }}>
        404
      </Typography>
      <Typography variant="h2" sx={{ mb: 2 }}>
        Page Not Found
      </Typography>
      <Typography variant="body1" sx={{ mb: 4 }}>
        The page you're looking for doesn't exist or has been moved.
      </Typography>
      <Button 
        variant="contained"
        startIcon={<HomeIcon />}
        onClick={() => router.push('/')}
        sx={{
          ...buttonStyles.primary,
          minWidth: '200px'
        }}
      >
        Back to Home
      </Button>
    </Container>
  );
}