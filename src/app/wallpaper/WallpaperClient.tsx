'use client';

import { useEffect, useState } from 'react';
import * as Backgrounds from '@/components/backgrounds';

type Note = {
  id: string;
  text: string;
  createdAt: string;
  selected?: boolean;
};

type Payout = {
  id: string;
  date: string;
  amount: number;
};

export default function WallpaperClient() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeBackground, setActiveBackground] = useState('Untitledblend');
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [payoutGoal, setPayoutGoal] = useState(1000);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [notesRes, settingsRes, payoutsRes] = await Promise.all([
          fetch('/api/notes', { cache: 'no-store' }),
          fetch('/api/settings', { cache: 'no-store' }),
          fetch('/api/payouts', { cache: 'no-store' }),
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

        if (payoutsRes.ok) {
          const data = await payoutsRes.json();
          if (Array.isArray(data.payouts)) setPayouts(data.payouts);
          if (data.payoutGoal) setPayoutGoal(Number(data.payoutGoal));
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

  const totalPayout = payouts.reduce((sum, p) => sum + p.amount, 0);
  const percentage = payoutGoal > 0 ? Math.min((totalPayout / payoutGoal) * 100, 100) : 0;

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

      {/* Payout Tracker — top right */}
      <div className="absolute top-8 right-8 z-20 pointer-events-none">
        <div className="payout-tracker-card">
          <div className="payout-tracker-content">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-semibold text-white/80 tracking-wide uppercase">Payout Tracker</span>
            </div>

            {/* Amount */}
            <div className="mb-1">
              <span className="text-3xl font-bold text-white tracking-tight">
                ${totalPayout.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
              <span className="text-lg text-white/50 font-medium ml-1">
                / ${payoutGoal.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>

            {/* Percentage */}
            <div className="text-xs font-mono text-white/60 mb-3">
              {percentage.toFixed(1)}% of goal
            </div>

            {/* Progress Bar */}
            <div className="payout-progress-track">
              <div 
                className="payout-progress-fill"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Notes — bottom */}
      <div className="absolute inset-0 z-10 pointer-events-none p-12 overflow-hidden flex flex-col justify-end bg-gradient-to-t from-black/20 to-transparent">
        <div className="flex flex-col gap-8 max-w-2xl w-full mx-auto pb-12 items-start justify-end h-full">
          {notes.map((note) => (
            <div
              key={note.id}
              className="liquid-glass-note p-7 w-full flex items-start gap-5"
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
