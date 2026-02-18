import React, { useMemo, useState } from 'react';
import { RoomData, Song } from '../types';

interface RoomDashboardProps {
  roomData: RoomData;
  onRefresh: () => void;
  onAddEntry: () => void;
}

const SpotifyLink: React.FC<{ url: string }> = ({ url }) => (
  <a 
    href={url} 
    target="_blank" 
    rel="noopener noreferrer"
    className="inline-flex items-center justify-center w-6 h-6 ml-2 text-[#1DB954] hover:text-white hover:bg-[#1DB954] rounded-full transition-colors"
    title="Open in Spotify"
  >
    <svg role="img" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
  </a>
);

export const RoomDashboard: React.FC<RoomDashboardProps> = ({ roomData, onRefresh, onAddEntry }) => {
  const [showQr, setShowQr] = useState(false);

  // The previous user is at index 1 (index 0 is current user) assuming sorted by new
  // Note: roomData.entries is sorted by created_at desc in storageService
  const previousEntry = roomData.entries.length > 1 ? roomData.entries[1] : null;

  // Calculate most frequent songs locally without AI
  const playlist = useMemo(() => {
    const allSongs = roomData.entries.flatMap(e => [e.current, e.favorite, e.underrated]);
    const counts = new Map<string, { count: number, song: Song }>();

    allSongs.forEach(song => {
      // Create a composite key to group identical songs
      const key = `${song.title.toLowerCase().trim()}|${song.artist.toLowerCase().trim()}`;
      if (!counts.has(key)) {
        counts.set(key, { count: 0, song });
      }
      counts.get(key)!.count++;
    });

    // Sort by frequency (desc) then by title
    return Array.from(counts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 3) // Limit to top 3 songs
      .map(item => ({
        title: item.song.title,
        artist: item.song.artist,
        spotifyUrl: item.song.spotifyUrl,
        reason: `${item.count} listener${item.count > 1 ? 's' : ''}`
      }));
  }, [roomData.entries]);

  // Determine room statistics
  const totalEntries = roomData.entries.length;
  const uniqueSongs = new Set(roomData.entries.flatMap(e => [e.current.title, e.favorite.title, e.underrated.title])).size;

  // Generate current page URL for QR
  const currentUrl = window.location.href;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(currentUrl)}`;

  // Helper to render a song row
  const renderSongRow = (label: string, song: Song, labelColor: string) => (
    <div>
      <p className={`text-xs ${labelColor}`}>{label}</p>
      <div className="flex items-center">
        <p className="text-lg font-semibold text-white truncate max-w-[85%]">
          {song.title} <span className="text-slate-400 font-normal text-sm">by {song.artist}</span>
        </p>
        <SpotifyLink url={song.spotifyUrl} />
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto p-4 pb-20 space-y-8 animate-in fade-in duration-700 relative">
      
      {/* QR Modal */}
      {showQr && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm"
          onClick={() => setShowQr(false)}
        >
          <div className="bg-white p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
             <h3 className="text-slate-900 font-bold text-xl">{roomData.roomName || 'Room Code'}</h3>
             <img src={qrUrl} alt="Room QR" className="w-64 h-64 border-2 border-slate-100 rounded-lg" />
             <p className="text-slate-500 text-sm font-mono text-center break-all max-w-xs">{currentUrl}</p>
             <button 
               onClick={() => setShowQr(false)}
               className="mt-2 px-6 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-bold"
             >
               Close
             </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center space-y-2 relative">
        <button 
          onClick={() => setShowQr(true)}
          className="absolute right-0 top-0 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors group"
          title="Show Room QR Code"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
        </button>

        <h2 className="text-3xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400">
          VIBE CHECK COMPLETE
        </h2>
        <div className="flex flex-col items-center">
           <h3 className="text-xl font-bold text-white">{roomData.roomName || roomData.roomId}</h3>
           <p className="text-slate-400 text-sm">{totalEntries} {totalEntries === 1 ? 'Person' : 'People'} Checked In</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Previous User Card */}
        <div className="bg-slate-800/40 border border-slate-700 p-6 rounded-2xl backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
          </div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Before You</h3>
          
          {previousEntry ? (
            <div className="space-y-4 relative z-10">
              {renderSongRow("They were listening to", previousEntry.current, "text-purple-300")}
              {renderSongRow("Their all-time fav", previousEntry.favorite, "text-pink-300")}
              {renderSongRow("Their underrated pick", previousEntry.underrated, "text-amber-300")}
              
              <div className="text-xs text-slate-500 mt-2">
                 Submitted {new Date(previousEntry.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </div>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-slate-500 italic">
              You are the first one here! Start the trend.
            </div>
          )}
        </div>

        {/* Room Playlist Card */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 border border-indigo-500/30 p-6 rounded-2xl relative">
          <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            Collective Playlist
          </h3>

          <div className="animate-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-indigo-300">
                Top {playlist.length} Tracks
              </h2>
              <p className="text-sm text-indigo-200 mt-1 leading-relaxed">
                Generated from {uniqueSongs} unique songs submitted by the room.
              </p>
            </div>

            {playlist.length > 0 ? (
              <div className="space-y-3">
                {playlist.map((track, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors group">
                     <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-slate-800 rounded-full text-xs font-mono text-slate-400 border border-slate-700">
                       {idx + 1}
                     </div>
                     <div className="flex-1 min-w-0">
                       <div className="flex items-center gap-2">
                         <p className="text-sm font-medium text-white truncate group-hover:text-cyan-300 transition-colors">
                           {track.title}
                         </p>
                         <SpotifyLink url={track.spotifyUrl} />
                       </div>
                       <p className="text-xs text-slate-400 truncate">
                         {track.artist}
                       </p>
                       <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1 italic">
                         {track.reason}
                       </p>
                     </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-400 italic text-sm">
                Not enough data yet. Add more songs to build the playlist!
              </div>
            )}
          </div>
        </div>

      </div>

      <div className="flex flex-col items-center gap-4 pt-8 border-t border-slate-800/50 mt-8">
        <button 
          onClick={onAddEntry}
          className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 hover:border-cyan-500/50 rounded-xl font-semibold text-sm transition-all flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
          Add Another Song
        </button>

        <button 
          onClick={() => window.location.reload()}
          className="text-slate-500 hover:text-white text-xs underline transition-colors"
        >
          Refresh Feed
        </button>
      </div>
    </div>
  );
};