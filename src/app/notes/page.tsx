'use client';

import { useState, useEffect } from 'react';

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

  const fetchNotes = async () => {
    try {
      const res = await fetch('/api/notes', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setNotes(data);
      }
    } catch (error) {
      console.error('Failed to fetch notes:', error);
    }
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
  }, []);

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
        setStatus(`Error saving background: ${data.error}`);
      }
    } catch (error) {}
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans pb-24">
      <div className="max-w-xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-900">Manage Notes</h1>
        
        <form onSubmit={handleSaveNote} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Passcode</label>
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div className="pt-2 pb-2 border-t border-b border-gray-100 my-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Wallpaper Background</label>
              <select
                value={activeBackground}
                onChange={(e) => handleChangeBackground(e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500"
              >
                {BACKGROUNDS.map(bg => (
                  <option key={bg.id} value={bg.id}>{bg.name}</option>
                ))}
              </select>
            </div>
            
            {activeBackground === 'Custom' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Custom Image URL</label>
                <input
                  type="url"
                  value={customImageUrl}
                  onChange={(e) => setCustomImageUrl(e.target.value)}
                  onBlur={() => handleChangeBackground('Custom', customImageUrl)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full border-gray-300 rounded-md shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Paste a direct image link (Drive, Imgur, etc.). Applies when you click away.</p>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">Changes are saved instantly if passcode is correct.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Note</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              required
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Save Note
            </button>
            <span className="text-sm font-medium text-gray-600">{status}</span>
          </div>
        </form>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Current Notes</h2>
            <button
              onClick={() => handleDelete()}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Clear All
            </button>
          </div>
          <div className="space-y-4">
            {notes.length === 0 ? (
              <p className="text-gray-500 text-sm">No notes available.</p>
            ) : (
              notes.map((note) => (
                <div key={note.id} className={`p-4 rounded-lg border flex gap-3 ${note.selected ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-100'}`}>
                  <div className="pt-1">
                    <input 
                      type="checkbox" 
                      checked={!!note.selected} 
                      onChange={() => handleToggleSelect(note)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      title="Show SVG bullet on wallpaper"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-800 whitespace-pre-wrap">{note.text}</p>
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-xs text-gray-400 font-mono">
                        {new Date(note.createdAt).toLocaleString()}
                      </p>
                      <button onClick={() => handleDelete(note.id)} className="text-xs text-red-500 hover:text-red-700">Delete</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
