import React, { useState } from 'react';

interface RoomEntryProps {
  onJoinRoom: (roomId: string) => void;
}

export const RoomEntry: React.FC<RoomEntryProps> = ({ onJoinRoom }) => {
  const [inputCode, setInputCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = () => {
    setIsScanning(true);
    // Simulate a QR scan delay for demo
    setTimeout(() => {
      setIsScanning(false);
      onJoinRoom('1'); // Default to room 1 for demo
    }, 2000);
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode.trim()) {
      onJoinRoom(inputCode.trim());
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-md relative overflow-hidden">
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-purple-500"></div>

        <h1 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
          VibeCheck
        </h1>
        <p className="text-slate-400 mb-8">Scan a room code or enter the ID to join.</p>

        {isScanning ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 border-4 border-cyan-500 rounded-lg animate-pulse"></div>
              <div className="absolute inset-0 border-t-4 border-purple-500 rounded-lg animate-spin"></div>
            </div>
            <p className="text-cyan-400 font-mono animate-pulse">SCANNING...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <button
              onClick={handleScan}
              className="w-full py-4 bg-slate-700 hover:bg-slate-600 border border-slate-500 rounded-xl flex items-center justify-center gap-3 transition-all group"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-400 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              <span className="font-semibold text-lg">Scan QR Code</span>
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-slate-800 text-slate-500">Or enter room ID</span>
              </div>
            </div>

            <form onSubmit={handleJoinSubmit} className="flex gap-2">
              <input
                type="number"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="e.g. 1"
                className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:outline-none focus:border-cyan-500 transition-colors placeholder-slate-600 text-sm font-mono"
              />
              <button
                type="submit"
                disabled={!inputCode.trim()}
                className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Go
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};