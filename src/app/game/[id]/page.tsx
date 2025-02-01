'use client';

import { useState, useEffect, use } from 'react';
import { Container } from '@mui/material';
import { Game, GameType } from '@/types/game';
import { amplifyClient as client } from '@/utils/amplifyClient';
import { getGame } from '@/graphql/queries';
import LetterGameComponent from '@/app/components/LetterGame';
import PictureGameComponent from '@/app/components/PictureGame';
import { useRouter } from 'next/navigation';

interface GamePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function GamePage({ params }: GamePageProps) {
  const resolvedParams = use(params);
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!resolvedParams?.id) {
      router.push('/');
      return;
    }

    const fetchGame = async () => {
      try {
        const result = await client.graphql({
          query: getGame,
          variables: { id: resolvedParams?.id }
        });
        setGame(result.data.getGame);
      } catch (error) {
        console.error('Error fetching game:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGame();
  }, [resolvedParams?.id]);

  if (loading) return <div>Loading...</div>;
  if (!game) return <div>Game not found</div>;
  if (!game.gameType) {
    router.push('/');
    return null;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {game.gameType === GameType.LETTER_RACE ? (
        <LetterGameComponent 
          game={game} 
          onGameUpdate={(updatedGame) => setGame(updatedGame)} 
        />
      ) : (
        <PictureGameComponent 
          game={game} 
          onGameUpdate={(updatedGame) => setGame(updatedGame)} 
        />
      )}
    </Container>
  );
}