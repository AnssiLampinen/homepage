import React, { useState, useEffect } from 'react';
import { RoomEntry } from './components/RoomEntry';
import { SongForm } from './components/SongForm';
import { RoomDashboard } from './components/RoomDashboard';
import { DatabaseSetup } from './components/DatabaseSetup';
import { AppState, RoomData, Song } from './types';
import { getRoomData, saveRoomEntry, hasUserSubmittedRecently, checkDatabaseConnection } from './services/storageService';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.SCANNING);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; message?: string; code?: string } | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    verifyDb();

    // Check URL hash on load
    const hash = window.location.hash.replace('#', '');
    
    // Only accept numeric hashes (e.g., #1, #123) to match int8 DB column
    if (hash && /^\d+$/.test(hash)) {
      handleJoinRoom(hash);
    } else if (hash) {
      console.warn("Invalid non-numeric room ID in URL, ignoring.");
      window.location.hash = ''; // Clear invalid hash
    }
  }, []);

  const verifyDb = async () => {
    const result = await checkDatabaseConnection();
    setDbStatus({ 
      connected: result.success, 
      message: result.message,
      code: result.code 
    });

    if (result.code === 'MISSING_TABLE') {
      setShowSetup(true);
    } else {
      setShowSetup(false);
    }
  };

  const handleJoinRoom = async (id: string) => {
    setRoomId(id);
    setIsLoading(true);
    // Update URL
    window.location.hash = id;

    try {
      const data = await getRoomData(id);
      setRoomData(data);

      const submitted = await hasUserSubmittedRecently(id);
      if (submitted) {
        setAppState(AppState.RESULTS);
      } else {
        setAppState(AppState.INPUT);
      }
    } catch (e) {
      console.error("Error joining room:", e);
      setAppState(AppState.SCANNING);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSongSubmit = async (entry: { current: Song; favorite: Song; underrated: Song }) => {
    if (!roomId) return;
    
    try {
      const updatedData = await saveRoomEntry(roomId, entry);
      setRoomData(updatedData);
      setAppState(AppState.RESULTS);
    } catch (e) {
      console.error("Error saving entry:", e);
      alert("Failed to save entry. Please try again.");
    }
  };

  const handleLeaveRoom = () => {
    setRoomId(null);
    setRoomData(null);
    setAppState(AppState.SCANNING);
    window.location.hash = '';
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans relative">
      
      {/* Setup Modal */}
      {showSetup && (
        <DatabaseSetup onRetry={() => { verifyDb(); window.location.reload(); }} />
      )}

      {/* Navbar */}
      <header className="p-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={handleLeaveRoom}
          >
             <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                </svg>
             </div>
             <span className="font-bold text-xl tracking-tight hidden sm:block">VibeCheck</span>
          </div>
          {roomId && (
            <div className="text-xs font-mono text-slate-500 bg-slate-800 px-2 py-1 rounded max-w-[150px] truncate">
              {roomData?.roomName || `Room #${roomId}`}
            </div>
          )}
        </div>
      </header>

      {/* Status Banner */}
      {dbStatus && !dbStatus.connected && dbStatus.code !== 'MISSING_TABLE' && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2">
          <div className="max-w-6xl mx-auto flex items-center justify-between text-red-200 text-sm">
             <div className="flex items-center gap-2">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                 <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
               </svg>
               <span className="font-semibold">Connection Failed:</span> {dbStatus.message}
             </div>
             <button onClick={verifyDb} className="underline hover:text-white">Retry</button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
              <p className="text-slate-500 font-mono animate-pulse">Loading Room...</p>
            </div>
          </div>
        ) : (
          <>
            {appState === AppState.SCANNING && (
              <RoomEntry onJoinRoom={handleJoinRoom} />
            )}

            {appState === AppState.INPUT && roomId && (
              <div className="flex-1 flex items-center justify-center animate-in zoom-in-95 duration-300">
                <SongForm 
                  onSubmit={handleSongSubmit} 
                  roomId={roomId} 
                  roomName={roomData?.roomName}
                />
              </div>
            )}

            {appState === AppState.RESULTS && roomData && (
              <RoomDashboard 
                roomData={roomData} 
                onRefresh={async () => {
                   if (roomId) {
                     const data = await getRoomData(roomId);
                     setRoomData(data);
                   }
                }}
                onAddEntry={() => setAppState(AppState.INPUT)}
              />
            )}
          </>
        )}
      </main>

      <footer className="p-6 text-center text-slate-600 text-xs">
        <p>VibeCheck &copy; {new Date().getFullYear()}.</p>
        <p className="mt-1">
          {dbStatus?.connected ? (
            <span className="text-green-500/50 flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              System Operational
            </span>
          ) : (
            <span className="text-red-500/50">System Offline</span>
          )}
        </p>
      </footer>
    </div>
  );
};

export default App;