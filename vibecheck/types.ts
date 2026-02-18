export interface Song {
  title: string;
  artist: string;
  spotifyUrl: string;
}

export interface SongEntry {
  id: string;
  current: Song;
  favorite: Song;
  underrated: Song;
  timestamp: number;
  userId: string;
}

export interface Room {
  id: string;
  name: string;
  created_at: string;
}

export interface RoomData {
  roomId: string;
  roomName?: string; // Added optional room name
  entries: SongEntry[];
}

export interface RecommendedTrack {
  title: string;
  artist: string;
  reason: string;
  spotifyUrl: string;
}

export interface RoomVibe {
  vibeName: string;
  description: string;
  playlist: RecommendedTrack[];
}

export enum AppState {
  SCANNING = 'SCANNING',
  INPUT = 'INPUT',
  RESULTS = 'RESULTS',
}