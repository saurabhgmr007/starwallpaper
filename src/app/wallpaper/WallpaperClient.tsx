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
      
      {/* Hidden SVG Filter for Liquid Glass Refraction */}
      <svg style={{ width: 0, height: 0, position: 'absolute' }}>
        <defs>
          <filter id="liquid-glass-filter" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="1" result="noise" />
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1.5 -0.2" in="noise" result="coloredNoise" />
            <feDisplacementMap in="SourceGraphic" in2="coloredNoise" scale="12" xChannelSelector="R" yChannelSelector="G" result="displacement" />
            <feGaussianBlur in="displacement" stdDeviation="0.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
      </svg>

      <div className="absolute inset-0 z-10 pointer-events-none p-12 overflow-hidden flex flex-col justify-end bg-gradient-to-t from-black/20 to-transparent">
        <div className="flex flex-col gap-8 max-w-2xl w-full mx-auto pb-12 items-start justify-end h-full">
          {notes.map((note) => (
            <div
              key={note.id}
              className="liquid-glass-note p-7 w-full flex items-start gap-5"
              style={{ filter: 'url(#liquid-glass-filter)' }}
            >
              <div className="liquid-glass-note-content w-full flex items-start gap-5">
                {note.selected && (
                  <div className="mt-1 flex-shrink-0 text-yellow-300 drop-shadow-[0_0_8px_rgba(253,224,71,0.6)]">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z"/>
                    </svg>
                  </div>
                )}
                <div className="flex-1">
                  <div className="text-2xl font-medium leading-relaxed text-white drop-shadow-md">
                    {note.text}
                  </div>
                  <div className="mt-3 text-sm text-gray-200/80 font-mono tracking-wide">
                    {new Date(note.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
