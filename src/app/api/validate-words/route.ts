import { NextResponse } from 'next/server';

const DICTIONARY_API_BASE = 'https://api.dictionaryapi.dev/api/v2/entries/en/';

export async function POST(request: Request) {
  try {
    const { words } = await request.json();

    // Validate each word against the dictionary API
    const validations = await Promise.all(
      words.map(async (word: string) => {
        try {
          const response = await fetch(`${DICTIONARY_API_BASE}${word.toLowerCase()}`);
          return response.ok;
        } catch {
          return false;
        }
      })
    );

    return NextResponse.json(validations);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to validate words' }, { status: 500 });
  }
} 