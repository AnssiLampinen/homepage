import React, { useState } from 'react';

interface DatabaseSetupProps {
  onRetry: () => void;
}

export const DatabaseSetup: React.FC<DatabaseSetupProps> = ({ onRetry }) => {
  const [copied, setCopied] = useState(false);

  const sqlCode = `-- Run this in your Supabase SQL Editor

-- 1. Create Rooms Table (Using BIGINT/int8 for IDs)
create table if not exists rooms (
  id bigint generated always as identity primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null
);

-- 2. Create Entries Table
create table if not exists entries (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  room_id bigint not null, -- Must match rooms.id type
  user_id text not null,
  current_song jsonb not null,
  favorite_song jsonb not null,
  underrated_song jsonb not null
);

-- Optional: Create an index for performance
create index if not exists entries_room_id_idx on entries (room_id);

-- Enable security policies
alter table rooms enable row level security;
alter table entries enable row level security;

create policy "Enable read access for all users" on rooms for select using (true);
create policy "Enable insert access for all users" on rooms for insert with check (true);

create policy "Enable read access for all users" on entries for select using (true);
create policy "Enable insert access for all users" on entries for insert with check (true);

-- SEED DATA: Manually create your rooms here
-- You can run this line multiple times with different names to create more rooms.
-- Since 'id' is an identity column, it will auto-increment (1, 2, 3...)
insert into rooms (name) values ('The Main Stage');
insert into rooms (name) values ('The Chill Lounge');
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-900">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse"></span>
            Database Setup Required
          </h2>
          <p className="text-slate-400 mt-2 text-sm">
            The application is connected to Supabase, but the required tables were not found.
          </p>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-400 shrink-0">1</div>
            <div>
              <p className="font-semibold text-white">Go to Supabase Dashboard</p>
              <p className="text-sm text-slate-400">Open your project and navigate to the <strong className="text-white">SQL Editor</strong> in the left sidebar.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-400 shrink-0">2</div>
            <div className="w-full">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-white">Run this SQL Query</p>
                <button 
                  onClick={handleCopy}
                  className={`text-xs px-3 py-1 rounded transition-colors ${copied ? 'bg-green-500/20 text-green-400' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
                >
                  {copied ? 'Copied!' : 'Copy to Clipboard'}
                </button>
              </div>
              <div className="bg-slate-950 rounded-lg border border-slate-800 p-4 font-mono text-xs text-slate-300 overflow-x-auto whitespace-pre">
                {sqlCode}
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-900 flex justify-end gap-3">
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-slate-400 hover:text-white text-sm transition-colors"
          >
            Refresh Page
          </button>
          <button 
            onClick={onRetry}
            className="px-6 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-lg transition-all shadow-lg shadow-orange-900/20"
          >
            I've Run the SQL &rarr; Retry
          </button>
        </div>

      </div>
    </div>
  );
};