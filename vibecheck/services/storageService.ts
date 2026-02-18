import { RoomData, SongEntry, Song, Room } from '../types';
import { USER_ID_KEY } from '../constants';
import { supabase } from '../lib/supabaseClient';

// Helper to ensure we don't send invalid strings to integer columns
const isValidRoomId = (id: string | number): boolean => {
  return /^\d+$/.test(String(id));
};

// Keep user ID logic client-side as it is specific to the browser session (anonymous auth)
export const getUserId = (): string => {
  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
};

export const checkDatabaseConnection = async (): Promise<{ success: boolean; message?: string; code?: string }> => {
  try {
    // Attempt a lightweight query to check connection and table existence
    const { error } = await supabase.from('entries').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error("Supabase connection check failed:", error);
      
      // Postgrest error code 42P01 means "relation does not exist" (Table missing)
      if (error.code === '42P01') {
        return { 
          success: false, 
          message: "The 'entries' table does not exist.",
          code: 'MISSING_TABLE'
        };
      }

      return { 
        success: false, 
        message: `Database Error: ${error.message}`,
        code: error.code
      };
    }
    
    return { success: true };
  } catch (err: any) {
    console.error("Supabase connection exception:", err);
    return { 
      success: false, 
      message: `Connection Error: ${err.message || 'Check your internet or API keys.'}`,
      code: 'CONNECTION_ERROR'
    };
  }
};

export const getRoomDetails = async (roomId: string): Promise<Room | null> => {
  // Prevent invalid input syntax errors for integer columns
  if (!isValidRoomId(roomId)) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (error) {
      // Graceful fallback if room '1' isn't explicitly in the DB
      if (roomId === '1') {
         return { 
          id: '1', 
          name: 'The Main Stage', 
          created_at: new Date().toISOString() 
        };
      }
      return null;
    }
    
    return {
      ...data,
      id: String(data.id)
    };
  } catch (err) {
    return null;
  }
};

export const getRoomData = async (roomId: string): Promise<RoomData> => {
  // Guard clause against non-numeric IDs
  if (!isValidRoomId(roomId)) {
    console.warn(`Invalid non-numeric Room ID provided: ${roomId}`);
    return { roomId, entries: [] };
  }

  try {
    // Fetch room details for name
    const roomDetails = await getRoomDetails(roomId);
    const roomName = roomDetails ? roomDetails.name : `Room #${roomId}`;

    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .eq('room_id', roomId) // This will now safely be a number string like "1"
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching room data:', error);
      return { roomId, roomName, entries: [] };
    }

    // Map Supabase rows to our app's SongEntry type
    const entries: SongEntry[] = (data || []).map((row: any) => ({
      id: row.id,
      current: row.current_song,
      favorite: row.favorite_song,
      underrated: row.underrated_song,
      userId: row.user_id,
      timestamp: new Date(row.created_at).getTime()
    }));

    return { roomId, roomName, entries };
  } catch (err) {
    console.error('Unexpected error in getRoomData:', err);
    return { roomId, entries: [] };
  }
};

export const saveRoomEntry = async (roomId: string, entry: { current: Song; favorite: Song; underrated: Song }): Promise<RoomData> => {
  const userId = getUserId();
  
  if (!isValidRoomId(roomId)) {
    throw new Error("Invalid Room ID");
  }

  const { error } = await supabase
    .from('entries')
    .insert({
      room_id: roomId, // Supabase expects int8, passing string "1" works if it parses to int
      user_id: userId,
      current_song: entry.current,
      favorite_song: entry.favorite,
      underrated_song: entry.underrated
    });

  if (error) {
    console.error("Error saving entry to Supabase:", error);
    throw new Error(error.message);
  }

  // Fetch updated list to ensure state is synced
  return await getRoomData(roomId);
};

export const hasUserSubmittedRecently = async (roomId: string): Promise<boolean> => {
  if (!isValidRoomId(roomId)) return false;

  const userId = getUserId();
  const ONE_HOUR_AGO = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  // Check if there is an entry for this user in this room created in the last hour
  const { data, error } = await supabase
    .from('entries')
    .select('id')
    .eq('room_id', roomId)
    .eq('user_id', userId)
    .gt('created_at', ONE_HOUR_AGO)
    .limit(1);

  if (error) {
    console.warn("Error checking recent submission:", error);
    return false;
  }

  return data && data.length > 0;
};