import React, { useState, useEffect, useRef } from 'react';
import { Song } from '../types';
import { searchSongs } from '../services/songService';

interface AutocompleteInputProps {
  label: string;
  value: Song | string;
  onChange: (value: Song | string) => void;
  placeholder: string;
  colorClass: string;
  disabled?: boolean;
}

export const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  label,
  value,
  onChange,
  placeholder,
  colorClass,
  disabled
}) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync internal input value with prop value if it's a string, or formatted song
  useEffect(() => {
    if (typeof value === 'string') {
      setInputValue(value);
    } else {
      setInputValue(`${value.title} - ${value.artist}`);
    }
  }, [value]);

  // Handle outside clicks to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    // If the input value matches the current selected song object, don't search
    if (typeof value !== 'string' && inputValue === `${value.title} - ${value.artist}`) {
      return;
    }

    // Only search if it looks like a new query
    if (!inputValue || inputValue.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Faster debounce for local data (200ms)
    const timer = setTimeout(async () => {
      setIsLoading(true);
      const results = await searchSongs(inputValue);
      setSuggestions(results);
      setIsLoading(false);
      if (results.length > 0) {
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [inputValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue); // Propagate string change to parent
  };

  const handleSelectSong = (song: Song) => {
    setInputValue(`${song.title} - ${song.artist}`);
    onChange(song); // Propagate object change to parent
    setShowSuggestions(false);
  };

  return (
    <div className="space-y-2 group relative" ref={wrapperRef}>
      <label className={`block text-sm font-medium ${colorClass}`}>
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => inputValue.length >= 2 && setShowSuggestions(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all disabled:opacity-50"
          autoComplete="off"
        />
        
        {/* Loading Indicator */}
        {isLoading && (
          <div className="absolute right-3 top-3.5">
            <div className="w-5 h-5 border-2 border-slate-500 border-t-white rounded-full animate-spin"></div>
          </div>
        )}

        {/* Dropdown Results */}
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-20 w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-xl max-h-60 overflow-y-auto overflow-x-hidden animate-in fade-in zoom-in-95 duration-100">
            {suggestions.map((song, idx) => (
              <li 
                key={idx}
                onClick={() => handleSelectSong(song)}
                className="px-4 py-3 hover:bg-slate-700 cursor-pointer flex items-center justify-between group/item border-b border-slate-700/50 last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">{song.title}</p>
                  <p className="text-slate-400 text-xs truncate">{song.artist}</p>
                </div>
                <div className="opacity-0 group-hover/item:opacity-100 transition-opacity">
                   <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                   </svg>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
