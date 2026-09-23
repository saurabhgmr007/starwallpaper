'use client';

import { useState, useEffect } from 'react';
import * as Backgrounds from '@/components/backgrounds';

type Note = {
  id: string;
  text: string;
  createdAt: string;
  selected?: boolean;
};

const BACKGROUNDS = [
  { id: 'Untitledblend', name: 'Untitled blend' },
  { id: 'Glassymint', name: 'Glassy mint' },
  { id: 'Moonlit', name: 'Moonlit' },
  { id: 'NewYork', name: 'New York' },
  { id: 'Nightsky', name: 'Night sky' },
  { id: 'Custom', name: 'Custom Image URL' },
];

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState('');
  const [passcode, setPasscode] = useState('');
  const [status, setStatus] = useState('');
  const [activeBackground, setActiveBackground] = useState('Untitledblend');
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  const fetchNotes = async () => {
    try {
      const res = await fetch('/api/notes', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setNotes(data);
      }
    } catch (error) {}
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.activeBackground) setActiveBackground(data.activeBackground);
        if (data.customImageUrl) setCustomImageUrl(data.customImageUrl);
      }
    } catch (error) {}
  };

  useEffect(() => {
    fetchNotes();
    fetchSettings();
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') setIsDarkMode(true);
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Saving...');
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, passcode }),
      });
      if (res.ok) {
        setText('');
        setStatus('Saved!');
        fetchNotes();
        setTimeout(() => setStatus(''), 2000);
      } else {
        const data = await res.json();
        setStatus(`Error: ${data.error}`);
      }
    } catch (error) {
      setStatus('Failed to save');
    }
  };

  const handleToggleSelect = async (note: Note) => {
    try {
      const res = await fetch('/api/notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: note.id, selected: !note.selected, passcode }),
      });
      if (res.ok) {
        fetchNotes();
      } else {
        const data = await res.json();
        setStatus(`Error: ${data.error}`);
      }
    } catch (error) {}
  };

  const handleDelete = async (id?: string) => {
    if (!id && !confirm('Are you sure you want to clear all notes?')) return;
    setStatus('Deleting...');
    try {
      const res = await fetch('/api/notes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, passcode }),
      });
      if (res.ok) {
        setStatus('Deleted!');
        fetchNotes();
        setTimeout(() => setStatus(''), 2000);
      } else {
        const data = await res.json();
        setStatus(`Error: ${data.error}`);
      }
    } catch (error) {}
  };

  const handleChangeBackground = async (newBg: string, urlStr?: string) => {
    setActiveBackground(newBg);
    const url = urlStr !== undefined ? urlStr : customImageUrl;
    if (urlStr !== undefined) setCustomImageUrl(urlStr);
    
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activeBackground: newBg, customImageUrl: url, passcode }),
      });
      if (!res.ok) {
        const data = await res.json();
        setStatus(`Error: ${data.error}`);
      }
    } catch (error) {}
  };

  // @ts-ignore
  const BackgroundComponent = Backgrounds[activeBackground] || Backgrounds.Untitledblend;

  return (
    <div className={`min-h-screen relative font-sans pb-24 ${isDarkMode ? 'dark text-white' : 'text-gray-900'}`}>
      
      {/* Background layer for liquid glass to refract */}
      <div className="fixed inset-0 z-0">
        {activeBackground === 'Custom' ? (
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000"
            style={{ backgroundImage: customImageUrl ? `url(${customImageUrl})` : 'none', backgroundColor: isDarkMode ? '#1a1a2e' : '#f0f0f5' }}
          />
        ) : (
          <div className="absolute inset-0 transition-opacity duration-1000">
            <BackgroundComponent />
          </div>
        )}
        <div className={`absolute inset-0 ${isDarkMode ? 'bg-black/40' : 'bg-white/20'}`}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-2xl mx-auto space-y-8 p-8 pt-16">
        
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold tracking-tight drop-shadow-sm">Dashboard</h1>
          <button 
            onClick={toggleTheme}
            className={`px-4 py-2 rounded-full font-medium transition-all ${isDarkMode ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-black/5 hover:bg-black/10 text-black'}`}
          >
            {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
        </div>
        
        <div className="liquid-glass-panel">
          <form onSubmit={handleSaveNote} className="liquid-glass-content p-8 space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2 opacity-80">Passcode</label>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className={`w-full rounded-xl p-3 border focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors ${
                  isDarkMode ? 'bg-black/30 border-white/10 text-white placeholder-white/30' : 'bg-white/50 border-black/10 text-black placeholder-black/30'
                }`}
                placeholder="Enter passcode to make changes..."
                required
              />
            </div>

            <div className={`pt-6 pb-6 border-t border-b space-y-4 ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}>
              <div>
                <label className="block text-sm font-semibold mb-2 opacity-80">Wallpaper Background</label>
                <select
                  value={activeBackground}
                  onChange={(e) => handleChangeBackground(e.target.value)}
                  className={`w-full rounded-xl p-3 border focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none transition-colors ${
                    isDarkMode ? 'bg-black/30 border-white/10 text-white' : 'bg-white/50 border-black/10 text-black'
                  }`}
                >
                  {BACKGROUNDS.map(bg => (
                    <option key={bg.id} value={bg.id} className="text-black">{bg.name}</option>
                  ))}
                </select>
              </div>
              
              {activeBackground === 'Custom' && (
                <div className="animate-fade-in">
                  <label className="block text-sm font-semibold mb-2 opacity-80">Custom Image URL</label>
                  <input
                    type="url"
                    value={customImageUrl}
                    onChange={(e) => setCustomImageUrl(e.target.value)}
                    onBlur={() => handleChangeBackground('Custom', customImageUrl)}
                    placeholder="https://example.com/image.jpg"
                    className={`w-full rounded-xl p-3 border focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors ${
                      isDarkMode ? 'bg-black/30 border-white/10 text-white placeholder-white/30' : 'bg-white/50 border-black/10 text-black placeholder-black/30'
                    }`}
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 opacity-80">New Note</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className={`w-full rounded-xl p-3 border focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors resize-none ${
                  isDarkMode ? 'bg-black/30 border-white/10 text-white placeholder-white/30' : 'bg-white/50 border-black/10 text-black placeholder-black/30'
                }`}
                rows={3}
                placeholder="Type your note here..."
                required
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <button
                type="submit"
                className="bg-blue-600/90 hover:bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium transition-all shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5"
              >
                Save Note
              </button>
              <span className="text-sm font-medium opacity-80">{status}</span>
            </div>
          </form>
        </div>

        <div className="liquid-glass-panel">
          <div className="liquid-glass-content p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold drop-shadow-sm">Current Notes</h2>
              <button
                onClick={() => handleDelete()}
                className="text-red-500 hover:text-red-400 text-sm font-semibold transition-colors bg-red-500/10 px-3 py-1.5 rounded-lg"
              >
                Clear All
              </button>
            </div>
            <div className="space-y-4">
              {notes.length === 0 ? (
                <p className="text-center opacity-60 py-8 text-sm font-medium">No notes available.</p>
              ) : (
                notes.map((note) => (
                  <div key={note.id} className={`p-5 rounded-2xl border transition-all flex gap-4 ${
                    isDarkMode 
                      ? (note.selected ? 'bg-blue-500/20 border-blue-400/30' : 'bg-white/5 border-white/10') 
                      : (note.selected ? 'bg-blue-500/10 border-blue-400/30' : 'bg-white/40 border-white/40')
                  }`}>
                    <div className="pt-1">
                      <input 
                        type="checkbox" 
                        checked={!!note.selected} 
                        onChange={() => handleToggleSelect(note)}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer bg-black/10"
                        title="Show SVG bullet on wallpaper"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="whitespace-pre-wrap text-lg leading-relaxed">{note.text}</p>
                      <div className="flex justify-between items-center mt-3">
                        <p className="text-xs font-mono opacity-60">
                          {new Date(note.createdAt).toLocaleString()}
                        </p>
                        <button onClick={() => handleDelete(note.id)} className="text-xs text-red-500 hover:text-red-400 font-semibold opacity-80 hover:opacity-100 transition-opacity">Delete</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
