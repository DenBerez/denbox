export const playSound = (soundName: string) => {
  const audio = new Audio(`/sounds/${soundName}.mp3`);
  audio.play().catch(error => {
    console.error('Error playing sound:', error);
  });
};

export const Sounds = {
  START: 'fanfare',
  END: 'tada',
  WARNING: 'ticking'
} as const; 