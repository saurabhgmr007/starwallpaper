'use client';

import { useEffect, useState } from 'react';
import * as Backgrounds from '@/components/backgrounds';

type Note = {
  id: string;
  text: string;
  createdAt: string;
  selected?: boolean;
};

export default function WallpaperClient() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeBackground, setActiveBackground] = useState('Untitledblend');
  const [customImageUrl, setCustomImageUrl] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [notesRes, settingsRes] = await Promise.all([
          fetch('/api/notes', { cache: 'no-store' }),
          fetch('/api/settings', { cache: 'no-store' })
        ]);

        if (notesRes.ok) {
          const data = await notesRes.json();
          if (Array.isArray(data)) setNotes(data);
        }

        if (settingsRes.ok) {
          const data = await settingsRes.json();
          if (data.activeBackground) setActiveBackground(data.activeBackground);
          if (data.customImageUrl) setCustomImageUrl(data.customImageUrl);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    // Fetch immediately on mount
    fetchData();

    // Poll every 5 seconds
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  // @ts-ignore
  const BackgroundComponent = Backgrounds[activeBackground] || Backgrounds.Untitledblend;

  return (
    <>
      {activeBackground === 'Custom' ? (
        <div 
          className="fixed inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: customImageUrl ? `url(${customImageUrl})` : 'none', backgroundColor: '#000' }}
        />
      ) : (
        <BackgroundComponent />
      )}
      
      <div className="absolute inset-0 z-10 pointer-events-none p-12 overflow-hidden flex flex-col justify-end bg-gradient-to-t from-black/50 to-transparent">
        <div className="flex flex-col gap-6 max-w-2xl w-full mx-auto pb-12 items-start justify-end h-full">
          {notes.map((note) => (
            <div
              key={note.id}
              className="bg-black/60 backdrop-blur-md text-white p-6 rounded-2xl shadow-xl w-full transform transition-all flex items-start gap-4"
            >
              {note.selected && (
                <div className="mt-1 flex-shrink-0 text-yellow-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z"/>
                  </svg>
                </div>
              )}
              <div className="flex-1">
                <div className="text-xl font-medium leading-relaxed">
                  {note.text}
                </div>
                <div className="mt-3 text-sm text-gray-400 font-mono">
                  {new Date(note.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
