// Common gradient definitions
export const gradients = {
  primary: 'linear-gradient(45deg, #00e5ff 30%, #00bcd4 90%)',
  secondary: 'linear-gradient(45deg, #00e5ff 30%, #00bcd4 90%)',
  dark: 'linear-gradient(145deg, #1a1a1a 0%, #2a2a2a 100%)',
};

// Common paper styles
export const paperStyles = {
  default: {
    p: { xs: 2, sm: 3 },
    bgcolor: 'background.paper',
    borderRadius: 2,
    border: '1px solid',
    borderColor: 'divider',
  },
  gradient: {
    p: { xs: 2, sm: 3 },
    bgcolor: 'background.paper',
    borderRadius: 2,
    background: gradients.dark,
    border: '1px solid',
    borderColor: 'divider',
  }
};

// Common scrollbar styles
export const scrollbarStyles = {
  '&::-webkit-scrollbar': {
    width: '8px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'rgba(0,0,0,0.1)',
    borderRadius: '4px',
    margin: '4px'
  },
  '&::-webkit-scrollbar-thumb': {
    background: 'rgba(0, 229, 255, 0.5)',
    borderRadius: '4px',
    border: '2px solid transparent',
    backgroundClip: 'padding-box',
    '&:hover': {
      background: 'rgba(0, 229, 255, 0.7)',
    }
  },
  scrollbarWidth: 'thin',
  scrollbarColor: 'rgba(0, 229, 255, 0.5) rgba(0, 0, 0, 0.1)'
};

// Common text gradient styles
export const textGradientStyles = {
  background: gradients.secondary,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
};

// Common button styles
export const buttonStyles = {
  primary: {
    py: 2,
    px: 4,
    fontSize: '1.1rem',
    fontWeight: 600,
    borderRadius: 2,
    background: gradients.primary,
    boxShadow: '0 3px 5px 2px rgba(0, 229, 255, .3)',
    transition: 'all 0.2s',
    '&:hover': {
      background: gradients.primary,
      filter: 'brightness(1.1)'
    }
  }
}; 