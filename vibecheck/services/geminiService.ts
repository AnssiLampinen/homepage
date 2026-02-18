import { GoogleGenAI, Type } from "@google/genai";
import { RoomVibe, SongEntry, Song } from "../types";

// Helper to get environment variables safely
const getEnv = (key: string): string => {
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    // @ts-ignore
    return import.meta.env[key];
  }
  return '';
};

// Use VITE_GOOGLE_API_KEY for the frontend build
const apiKey = getEnv('VITE_GOOGLE_API_KEY');

if (!apiKey) {
  console.warn("Missing VITE_GOOGLE_API_KEY. AI features will not work.");
}

const ai = new GoogleGenAI({ apiKey: apiKey });

export const resolveSongMetadata = async (
  rawCurrent: Song | string, 
  rawFavorite: Song | string, 
  rawUnderrated: Song | string
): Promise<{ current: Song; favorite: Song; underrated: Song }> => {
  
  const formatInput = (input: Song | string) => 
    typeof input === 'string' ? input : `${input.title} by ${input.artist}`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `
      Identify the following songs and return them in a structured JSON format.
      For each song, provide the correct Title, Artist, and a Spotify URL.
      If you cannot find the exact Spotify URL, provide a Spotify Search URL (e.g. https://open.spotify.com/search/Title%20Artist).

      1. Current Song: "${formatInput(rawCurrent)}"
      2. Favorite Song: "${formatInput(rawFavorite)}"
      3. Underrated Song: "${formatInput(rawUnderrated)}"
    `,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          current: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              artist: { type: Type.STRING },
              spotifyUrl: { type: Type.STRING },
            },
            required: ['title', 'artist', 'spotifyUrl'],
          },
          favorite: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              artist: { type: Type.STRING },
              spotifyUrl: { type: Type.STRING },
            },
            required: ['title', 'artist', 'spotifyUrl'],
          },
          underrated: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              artist: { type: Type.STRING },
              spotifyUrl: { type: Type.STRING },
            },
            required: ['title', 'artist', 'spotifyUrl'],
          },
        },
        required: ['current', 'favorite', 'underrated'],
      },
    },
  });

  const text = response.text || "{}";
  const data = JSON.parse(text);

  return {
    current: data.current,
    favorite: data.favorite,
    underrated: data.underrated
  };
};

export const generateRoomVibe = async (entries: SongEntry[]): Promise<RoomVibe> => {
  if (entries.length === 0) {
    return {
      vibeName: "Quiet Room",
      description: "It's a bit quiet here. Add some songs to get the vibe started!",
      playlist: []
    };
  }

  const songsList = entries.flatMap(e => [
    `${e.current.title} - ${e.current.artist}`,
    `${e.favorite.title} - ${e.favorite.artist}`,
    `${e.underrated.title} - ${e.underrated.artist}`
  ]).join('\n');

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `
      Analyze the musical vibe of a room based on the following songs:
      ${songsList}

      Determine a creative "Vibe Name" and a short description.
      Recommend 5 songs that fit this vibe.
      For each recommendation, explain the reason and provide a Spotify URL (or search URL).
    `,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          vibeName: { type: Type.STRING },
          description: { type: Type.STRING },
          playlist: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                artist: { type: Type.STRING },
                reason: { type: Type.STRING },
                spotifyUrl: { type: Type.STRING },
              },
              required: ['title', 'artist', 'reason', 'spotifyUrl'],
            },
          },
        },
        required: ['vibeName', 'description', 'playlist'],
      },
    },
  });

  const text = response.text || "{}";
  return JSON.parse(text) as RoomVibe;
};