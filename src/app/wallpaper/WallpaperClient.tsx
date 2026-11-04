'use client';

import { useEffect, useState, useCallback } from 'react';
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

type SpotifyData = {
  isPlaying: boolean;
  needsAuth?: boolean;
  title?: string;
  artist?: string;
  album?: string;
  albumArt?: string;
  progress?: number;
  duration?: number;
};

type WeatherData = {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  icon: string;
  isDay: boolean;
  high: number;
  low: number;
  city: string;
};

// ---------- Weather SVG Icons ----------
function WeatherIcon({ icon, isDay }: { icon: string; isDay: boolean }) {
  const cls = "h-10 w-10 drop-shadow-lg";
  
  if (icon === 'clear' && isDay) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className={cls} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="4" fill="#FBBF24" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <line key={deg} x1="12" y1="2" x2="12" y2="5" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round"
            transform={`rotate(${deg} 12 12)`} />
        ))}
      </svg>
    );
  }
  if (icon === 'clear') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className={cls} viewBox="0 0 24 24" fill="none">
        <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" fill="#CBD5E1" />
      </svg>
    );
  }
  if (icon === 'cloudy') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className={cls} viewBox="0 0 24 24" fill="none">
        <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" fill="#94A3B8" />
      </svg>
    );
  }
  if (icon === 'rain' || icon === 'drizzle') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className={cls} viewBox="0 0 24 24" fill="none">
        <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" fill="#64748B" />
        <line x1="8" y1="22" x2="7" y2="24" stroke="#60A5FA" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="12" y1="22" x2="11" y2="24" stroke="#60A5FA" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="16" y1="22" x2="15" y2="24" stroke="#60A5FA" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (icon === 'snow') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className={cls} viewBox="0 0 24 24" fill="none">
        <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" fill="#94A3B8" />
        <circle cx="8" cy="22" r="1" fill="#E2E8F0" />
        <circle cx="12" cy="23" r="1" fill="#E2E8F0" />
        <circle cx="16" cy="22" r="1" fill="#E2E8F0" />
      </svg>
    );
  }
  if (icon === 'thunder') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className={cls} viewBox="0 0 24 24" fill="none">
        <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" fill="#475569" />
        <path d="M13 16l-2 4 3-1-2 4" stroke="#FBBF24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (icon === 'fog') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className={cls} viewBox="0 0 24 24" fill="none">
        <line x1="3" y1="10" x2="21" y2="10" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
        <line x1="5" y1="14" x2="19" y2="14" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
        <line x1="7" y1="18" x2="17" y2="18" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  // fallback
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={cls} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="4" fill="#FBBF24" />
    </svg>
  );
}

export default function WallpaperClient() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeBackground, setActiveBackground] = useState('Untitledblend');
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [payoutGoal, setPayoutGoal] = useState(1000);
  const [now, setNow] = useState(new Date());
  const [spotify, setSpotify] = useState<SpotifyData>({ isPlaying: false });
  const [weather, setWeather] = useState<WeatherData | null>(null);

  // Real-time clock — tick every second
  useEffect(() => {
    const clockInterval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // Fast poll: notes, settings, payouts, spotify (every 5s)
  const fetchFastData = useCallback(async () => {
    try {
      const [notesRes, settingsRes, payoutsRes, spotifyRes] = await Promise.all([
        fetch('/api/notes', { cache: 'no-store' }),
        fetch('/api/settings', { cache: 'no-store' }),
        fetch('/api/payouts', { cache: 'no-store' }),
        fetch('/api/spotify/now-playing', { cache: 'no-store' }).catch(() => null),
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
      if (spotifyRes && spotifyRes.ok) {
        const data = await spotifyRes.json();
        setSpotify(data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  }, []);

  // Slow poll: weather (every 5 minutes)
  const fetchWeather = useCallback(async () => {
    try {
      const res = await fetch('/api/weather', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (!data.error) setWeather(data);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchFastData();
    const fast = setInterval(fetchFastData, 5000);
    return () => clearInterval(fast);
  }, [fetchFastData]);

  useEffect(() => {
    fetchWeather();
    const slow = setInterval(fetchWeather, 300000); // 5 minutes
    return () => clearInterval(slow);
  }, [fetchWeather]);

  // @ts-ignore
  const BackgroundComponent = Backgrounds[activeBackground] || Backgrounds.Untitledblend;

  const totalPayout = payouts.reduce((sum, p) => sum + p.amount, 0);
  const percentage = payoutGoal > 0 ? Math.min((totalPayout / payoutGoal) * 100, 100) : 0;

  // Clock formatting
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const timeStr = `${displayHours}:${String(minutes).padStart(2, '0')}`;
  const secondsStr = `:${String(seconds).padStart(2, '0')}`;
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // Spotify progress
  const spotifyProgress = spotify.duration ? Math.min((spotify.progress! / spotify.duration) * 100, 100) : 0;
  const formatMs = (ms: number) => {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

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

      {/* ========== TOP-RIGHT WIDGET COLUMN ========== */}
      <div className="absolute top-8 right-8 z-20 pointer-events-none flex flex-col gap-4 items-end">

        {/* Payout Tracker */}
        <div className="payout-tracker-card">
          <div className="payout-tracker-content">
            <div className="flex items-center gap-2 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-semibold text-white/80 tracking-wide uppercase">Payout Tracker</span>
            </div>
            <div className="mb-1">
              <span className="text-3xl font-bold text-white tracking-tight">
                ${totalPayout.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
              <span className="text-lg text-white/50 font-medium ml-1">
                / ${payoutGoal.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="text-xs font-mono text-white/60 mb-3">
              {percentage.toFixed(1)}% of goal
            </div>
            <div className="payout-progress-track">
              <div className="payout-progress-fill" style={{ width: `${percentage}%` }} />
            </div>
          </div>
        </div>

        {/* Clock */}
        <div className="payout-tracker-card">
          <div className="payout-tracker-content">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-white tracking-tight tabular-nums">{timeStr}</span>
              <span className="text-lg font-medium text-white/40 tabular-nums">{secondsStr}</span>
              <span className="text-sm font-semibold text-white/60 ml-1 uppercase">{ampm}</span>
            </div>
            <div className="text-xs font-medium text-white/50 mt-2 tracking-wide">{dateStr}</div>
          </div>
        </div>

        {/* Weather */}
        {weather && (
          <div className="payout-tracker-card">
            <div className="payout-tracker-content">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white tracking-tight">{weather.temperature}°</span>
                    <span className="text-lg text-white/40 font-medium">C</span>
                  </div>
                  <div className="text-xs text-white/50 mt-1">
                    Feels {weather.feelsLike}° · H:{weather.high}° L:{weather.low}°
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <WeatherIcon icon={weather.icon} isDay={weather.isDay} />
                  <span className="text-[10px] font-medium text-white/50">{weather.condition}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-xs font-medium text-white/40">{weather.city}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========== SPOTIFY NOW PLAYING — BOTTOM LEFT (CLEARS DESKTOP ICONS) ========== */}
      {spotify.title && (
        <div className="absolute bottom-14 left-[210px] z-20 pointer-events-none" 
             style={{ animation: 'floatIn 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards' }}>
          <div className="payout-tracker-card" style={{ width: '320px' }}>
            <div className="payout-tracker-content">
              <div className="flex gap-4">
                {/* Album Art */}
                {spotify.albumArt && (
                  <div className="flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={spotify.albumArt}
                      alt=""
                      className="w-14 h-14 rounded-xl object-cover"
                      style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}
                    />
                  </div>
                )}
                {/* Track Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="#1DB954">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                    </svg>
                    <span className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">
                      {spotify.isPlaying ? 'Now Playing' : 'Paused'}
                    </span>
                    {/* Equalizer bars */}
                    <div className="flex items-end gap-[2px] h-4 ml-auto">
                      {[0,1,2,3].map(i => (
                        <div key={i} className={spotify.isPlaying ? 'eq-bar' : 'eq-bar-paused'} />
                      ))}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-white truncate leading-tight">{spotify.title}</div>
                  <div className="text-xs text-white/50 truncate mt-0.5">{spotify.artist}</div>
                </div>
              </div>
              {/* Progress Bar */}
              {spotify.duration && spotify.duration > 0 && (
                <div>
                  <div className="spotify-progress-track">
                    <div className="spotify-progress-fill" style={{ width: `${spotifyProgress}%` }} />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[10px] font-mono text-white/30 tabular-nums">{formatMs(spotify.progress || 0)}</span>
                    <span className="text-[10px] font-mono text-white/30 tabular-nums">{formatMs(spotify.duration)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========== NOTES — BOTTOM CENTER ========== */}
      <div className="absolute inset-0 z-10 pointer-events-none p-12 overflow-hidden flex flex-col justify-end bg-gradient-to-t from-black/20 to-transparent">
        <div className="flex flex-col gap-8 max-w-2xl w-full mx-auto pb-12 items-start justify-end h-full">
          {notes.map((note) => (
            <div key={note.id} className="liquid-glass-note p-7 w-full flex items-start gap-5">
              <div className="liquid-glass-note-content w-full flex items-start gap-5">
                {note.selected && (
                  <div className="mt-1 flex-shrink-0 text-yellow-300 drop-shadow-[0_0_8px_rgba(253,224,71,0.6)]">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z"/>
                    </svg>
                  </div>
                )}
                <div className="flex-1">
                  <div className="text-2xl font-medium leading-relaxed text-white drop-shadow-md">{note.text}</div>
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
