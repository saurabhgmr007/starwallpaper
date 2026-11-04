'use client';

import { useState, useEffect } from 'react';
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

type WidgetCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

type WidgetLayout = {
  'top-left': string[];
  'top-right': string[];
  'bottom-left': string[];
  'bottom-right': string[];
};

const DEFAULT_LAYOUT: WidgetLayout = {
  'top-left': [],
  'top-right': ['payout', 'clock', 'weather'],
  'bottom-left': ['spotify'],
  'bottom-right': [],
};

const WIDGET_INFO: Record<string, { name: string; icon: string; desc: string }> = {
  payout: { name: 'Payout Tracker', icon: '💰', desc: 'Goal & cumulative payouts' },
  clock: { name: 'Clock', icon: '⏰', desc: 'Real-time 12h clock & date' },
  weather: { name: 'Weather', icon: '🌤️', desc: 'Live temp & local forecast' },
  spotify: { name: 'Spotify Music', icon: '🎵', desc: 'Now playing album & bars' },
};

const CORNERS: { id: WidgetCorner; label: string; icon: string }[] = [
  { id: 'top-left', label: 'Top-Left', icon: '↖' },
  { id: 'top-right', label: 'Top-Right', icon: '↗' },
  { id: 'bottom-left', label: 'Bottom-Left', icon: '↙' },
  { id: 'bottom-right', label: 'Bottom-Right', icon: '↘' },
];

const BACKGROUNDS = [
  { id: 'Untitledblend', name: 'Untitled blend' },
  { id: 'Glassymint', name: 'Glassy mint' },
  { id: 'Moonlit', name: 'Moonlit' },
  { id: 'NewYork', name: 'New York' },
  { id: 'Nightsky', name: 'Night sky' },
  { id: 'Pixelmatcha', name: 'Pixel matcha' },
  { id: 'Pixelobsidian', name: '✦ Pixel obsidian (Dark)' },
  { id: 'Pixellavender', name: 'Pixel lavender' },
  { id: 'Pixelember', name: 'Pixel ember' },
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

  // Widget Layout state
  const [widgetLayout, setWidgetLayout] = useState<WidgetLayout>(DEFAULT_LAYOUT);
  const [layoutStatus, setLayoutStatus] = useState('');
  const [draggingWidget, setDraggingWidget] = useState<string | null>(null);

  // Payout state
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [payoutGoal, setPayoutGoal] = useState(1000);
  const [newPayoutDate, setNewPayoutDate] = useState('');
  const [newPayoutAmount, setNewPayoutAmount] = useState('');
  const [editingPayoutId, setEditingPayoutId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [goalInput, setGoalInput] = useState('');
  const [payoutStatus, setPayoutStatus] = useState('');

  // Weather state
  const [weatherCity, setWeatherCity] = useState('');
  const [weatherStatus, setWeatherStatus] = useState('');

  // Spotify state
  const [spotifyConnected, setSpotifyConnected] = useState(false);

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
        if (data.widgetLayout) {
          setWidgetLayout({
            'top-left': data.widgetLayout['top-left'] || [],
            'top-right': data.widgetLayout['top-right'] || [],
            'bottom-left': data.widgetLayout['bottom-left'] || [],
            'bottom-right': data.widgetLayout['bottom-right'] || [],
          });
        }
      }
    } catch (error) {}
  };

  const fetchPayouts = async () => {
    try {
      const res = await fetch('/api/payouts', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.payouts)) setPayouts(data.payouts);
        if (data.payoutGoal) {
          const goal = Number(data.payoutGoal);
          setPayoutGoal(goal);
          setGoalInput(String(goal));
        }
      }
    } catch (error) {}
  };

  const fetchWeatherCity = async () => {
    try {
      const res = await fetch('/api/weather', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.city) setWeatherCity(data.city);
      }
    } catch {}
  };

  const checkSpotifyStatus = async () => {
    try {
      const res = await fetch('/api/spotify/now-playing', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setSpotifyConnected(!data.needsAuth);
      }
    } catch {}
  };

  useEffect(() => {
    fetchNotes();
    fetchSettings();
    fetchPayouts();
    fetchWeatherCity();
    checkSpotifyStatus();
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') setIsDarkMode(true);

    const params = new URLSearchParams(window.location.search);
    if (params.get('spotify') === 'connected') {
      setSpotifyConnected(true);
      setStatus('Spotify connected successfully!');
      setTimeout(() => setStatus(''), 3000);
      window.history.replaceState({}, '', '/notes');
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  // ---- Save Settings (Layout / Background) ----
  const handleSaveLayout = async (newLayout: WidgetLayout) => {
    setWidgetLayout(newLayout);
    setLayoutStatus('Saving...');
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ widgetLayout: newLayout, passcode }),
      });
      if (res.ok) {
        setLayoutStatus('Saved! Wallpaper updated.');
        setTimeout(() => setLayoutStatus(''), 2500);
      } else {
        const data = await res.json();
        setLayoutStatus(`Error: ${data.error || 'Failed to save'}`);
      }
    } catch {
      setLayoutStatus('Failed to save layout');
    }
  };

  // Move widget to a new corner
  const moveWidgetToCorner = (widgetId: string, targetCorner: WidgetCorner) => {
    const newLayout: WidgetLayout = {
      'top-left': widgetLayout['top-left'].filter((id) => id !== widgetId),
      'top-right': widgetLayout['top-right'].filter((id) => id !== widgetId),
      'bottom-left': widgetLayout['bottom-left'].filter((id) => id !== widgetId),
      'bottom-right': widgetLayout['bottom-right'].filter((id) => id !== widgetId),
    };
    newLayout[targetCorner].push(widgetId);
    handleSaveLayout(newLayout);
  };

  // Reorder widget inside the same corner
  const reorderInCorner = (corner: WidgetCorner, index: number, direction: 'up' | 'down') => {
    const list = [...widgetLayout[corner]];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    const newLayout: WidgetLayout = {
      ...widgetLayout,
      [corner]: list,
    };
    handleSaveLayout(newLayout);
  };

  // Drag and Drop handlers
  const onDragStart = (e: React.DragEvent, widgetId: string) => {
    setDraggingWidget(widgetId);
    e.dataTransfer.setData('text/plain', widgetId);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDropCorner = (corner: WidgetCorner) => {
    if (!draggingWidget) return;
    moveWidgetToCorner(draggingWidget, corner);
    setDraggingWidget(null);
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

  // ---- Payout handlers ----
  const handleAddPayout = async () => {
    if (!newPayoutDate || !newPayoutAmount) return;
    setPayoutStatus('Adding...');
    try {
      const res = await fetch('/api/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: newPayoutDate, amount: Number(newPayoutAmount), passcode }),
      });
      if (res.ok) {
        const data = await res.json();
        setPayouts(data.payouts);
        setNewPayoutDate('');
        setNewPayoutAmount('');
        setPayoutStatus('Added!');
        setTimeout(() => setPayoutStatus(''), 2000);
      } else {
        const data = await res.json();
        setPayoutStatus(`Error: ${data.error}`);
      }
    } catch (error) {
      setPayoutStatus('Failed');
    }
  };

  const handleEditPayout = async (id: string) => {
    if (!editDate || !editAmount) return;
    setPayoutStatus('Saving...');
    try {
      const res = await fetch('/api/payouts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, date: editDate, amount: Number(editAmount), passcode }),
      });
      if (res.ok) {
        const data = await res.json();
        setPayouts(data.payouts);
        setEditingPayoutId(null);
        setPayoutStatus('Updated!');
        setTimeout(() => setPayoutStatus(''), 2000);
      } else {
        const data = await res.json();
        setPayoutStatus(`Error: ${data.error}`);
      }
    } catch (error) {
      setPayoutStatus('Failed');
    }
  };

  const handleDeletePayout = async (id: string) => {
    setPayoutStatus('Deleting...');
    try {
      const res = await fetch('/api/payouts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, passcode }),
      });
      if (res.ok) {
        const data = await res.json();
        setPayouts(data.payouts);
        setPayoutStatus('Deleted!');
        setTimeout(() => setPayoutStatus(''), 2000);
      } else {
        const data = await res.json();
        setPayoutStatus(`Error: ${data.error}`);
      }
    } catch (error) {
      setPayoutStatus('Failed');
    }
  };

  const handleSaveGoal = async () => {
    const newGoal = Number(goalInput);
    if (!newGoal || newGoal <= 0) return;
    try {
      const res = await fetch('/api/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payoutGoal: newGoal, passcode }),
      });
      if (res.ok) {
        setPayoutGoal(newGoal);
        setPayoutStatus('Goal updated!');
        setTimeout(() => setPayoutStatus(''), 2000);
      } else {
        const data = await res.json();
        setPayoutStatus(`Error: ${data.error}`);
      }
    } catch (error) {}
  };

  const startEditing = (payout: Payout) => {
    setEditingPayoutId(payout.id);
    setEditDate(payout.date);
    setEditAmount(String(payout.amount));
  };

  // ---- Weather handler ----
  const handleSetWeatherCity = async () => {
    if (!weatherCity.trim()) return;
    setWeatherStatus('Searching...');
    try {
      const res = await fetch('/api/weather', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city: weatherCity.trim(), passcode }),
      });
      if (res.ok) {
        const data = await res.json();
        setWeatherCity(data.city);
        setWeatherStatus(`Set to ${data.city}`);
        setTimeout(() => setWeatherStatus(''), 2000);
      } else {
        const data = await res.json();
        setWeatherStatus(`Error: ${data.error}`);
      }
    } catch {
      setWeatherStatus('Failed');
    }
  };

  // Helper to find which corner a widget belongs to
  const getWidgetCurrentCorner = (widgetId: string): WidgetCorner => {
    for (const corner of ['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const) {
      if (widgetLayout[corner]?.includes(widgetId)) return corner;
    }
    return 'top-right';
  };

  const sortedPayouts = [...payouts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const totalPayout = payouts.reduce((sum, p) => sum + p.amount, 0);
  const percentage = payoutGoal > 0 ? Math.min((totalPayout / payoutGoal) * 100, 100) : 0;

  // @ts-ignore
  const BackgroundComponent = Backgrounds[activeBackground] || Backgrounds.Untitledblend;

  const inputClass = `w-full rounded-xl p-3 border focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors ${
    isDarkMode ? 'bg-black/30 border-white/10 text-white placeholder-white/30' : 'bg-white/50 border-black/10 text-black placeholder-black/30'
  }`;

  const smallInputClass = `rounded-lg px-3 py-2 border focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors text-sm ${
    isDarkMode ? 'bg-black/30 border-white/10 text-white placeholder-white/30' : 'bg-white/50 border-black/10 text-black placeholder-black/30'
  }`;

  return (
    <div className={`min-h-screen relative font-sans pb-24 ${isDarkMode ? 'dark text-white' : 'text-gray-900'}`}>

      {/* Background layer */}
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

        {/* ======== DESKTOP WIDGET LAYOUT MANAGER ======== */}
        <div className="liquid-glass-panel">
          <div className="liquid-glass-content p-8 space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
                <h2 className="text-2xl font-bold drop-shadow-sm">Widget Layout Manager</h2>
              </div>
              {layoutStatus && (
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 animate-pulse">
                  {layoutStatus}
                </span>
              )}
            </div>

            <p className="text-xs opacity-70 leading-relaxed">
              Drag and drop widgets into any corner of your desktop, or use the quick corner selectors below. Reorder within corners using the ▲ ▼ arrows.
            </p>

            {/* Visual 16:9 Desktop Canvas */}
            <div className={`aspect-[16/10] w-full rounded-2xl border p-3 grid grid-cols-2 grid-rows-2 gap-3 relative transition-all ${
              isDarkMode ? 'bg-black/40 border-white/15' : 'bg-white/40 border-black/10'
            }`}>
              {/* Subtle Center Note Indicator */}
              <div className="absolute inset-x-1/4 bottom-3 h-10 border border-dashed border-white/20 rounded-xl flex items-center justify-center pointer-events-none z-0">
                <span className="text-[10px] uppercase font-mono opacity-40">Center Notes Area</span>
              </div>

              {/* 4 Corner Drop Zones */}
              {CORNERS.map((corner) => {
                const cornerWidgets = widgetLayout[corner.id] || [];
                const isDragTarget = draggingWidget !== null;

                return (
                  <div
                    key={corner.id}
                    onDragOver={onDragOver}
                    onDrop={() => onDropCorner(corner.id)}
                    className={`rounded-xl border border-dashed p-2.5 flex flex-col justify-between transition-all relative z-10 min-h-[90px] ${
                      isDragTarget
                        ? (isDarkMode ? 'border-blue-400/50 bg-blue-500/10' : 'border-blue-500/50 bg-blue-500/5')
                        : (isDarkMode ? 'border-white/10 bg-white/5' : 'border-black/10 bg-white/30')
                    }`}
                  >
                    {/* Corner Header */}
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[11px] font-bold tracking-wider uppercase opacity-60">
                        {corner.icon} {corner.label}
                      </span>
                      <span className="text-[10px] font-mono opacity-40">
                        {cornerWidgets.length} item{cornerWidgets.length === 1 ? '' : 's'}
                      </span>
                    </div>

                    {/* Widgets in this corner */}
                    <div className="flex-1 flex flex-col gap-1.5 justify-start">
                      {cornerWidgets.length === 0 ? (
                        <div className="h-full flex items-center justify-center py-2">
                          <span className="text-[10px] opacity-30 italic">Drop here</span>
                        </div>
                      ) : (
                        cornerWidgets.map((wId, idx) => {
                          const info = WIDGET_INFO[wId] || { name: wId, icon: '📦', desc: '' };
                          return (
                            <div
                              key={wId}
                              draggable
                              onDragStart={(e) => onDragStart(e, wId)}
                              className={`px-2.5 py-1.5 rounded-lg border flex items-center justify-between text-xs cursor-grab active:cursor-grabbing select-none transition-all ${
                                isDarkMode
                                  ? 'bg-white/10 border-white/15 hover:bg-white/15 text-white'
                                  : 'bg-white border-black/10 hover:bg-gray-50 text-gray-900 shadow-sm'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <span>{info.icon}</span>
                                <span className="font-semibold truncate">{info.name}</span>
                              </div>

                              {/* Reorder arrows */}
                              <div className="flex items-center gap-0.5 ml-2 flex-shrink-0">
                                {idx > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => reorderInCorner(corner.id, idx, 'up')}
                                    className="p-0.5 hover:bg-white/20 rounded text-[9px] opacity-70 hover:opacity-100"
                                    title="Move up"
                                  >
                                    ▲
                                  </button>
                                )}
                                {idx < cornerWidgets.length - 1 && (
                                  <button
                                    type="button"
                                    onClick={() => reorderInCorner(corner.id, idx, 'down')}
                                    className="p-0.5 hover:bg-white/20 rounded text-[9px] opacity-70 hover:opacity-100"
                                    title="Move down"
                                  >
                                    ▼
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick-Corner Buttons / Fallback Selectors */}
            <div className="space-y-2 pt-2">
              <span className="block text-xs font-semibold opacity-70">Quick Corner Switch:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {Object.entries(WIDGET_INFO).map(([wId, info]) => {
                  const currentCorner = getWidgetCurrentCorner(wId);
                  return (
                    <div
                      key={wId}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                        isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/40 border-black/5'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-base">{info.icon}</span>
                        <div className="truncate">
                          <div className="text-xs font-semibold truncate">{info.name}</div>
                          <div className="text-[10px] opacity-50">{info.desc}</div>
                        </div>
                      </div>

                      <select
                        value={currentCorner}
                        onChange={(e) => moveWidgetToCorner(wId, e.target.value as WidgetCorner)}
                        className={`text-xs rounded-lg px-2 py-1 border focus:ring-1 focus:ring-blue-500 focus:outline-none appearance-none transition-colors ${
                          isDarkMode ? 'bg-black/40 border-white/15 text-white' : 'bg-white border-black/15 text-black'
                        }`}
                      >
                        {CORNERS.map((c) => (
                          <option key={c.id} value={c.id} className="text-black">
                            {c.icon} {c.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ======== Settings & Notes Form Panel ======== */}
        <div className="liquid-glass-panel">
          <form onSubmit={handleSaveNote} className="liquid-glass-content p-8 space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2 opacity-80">Passcode</label>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className={inputClass}
                placeholder="Enter passcode to make changes..."
                required
              />
            </div>

            <div className={`pt-6 pb-6 border-t border-b space-y-5 ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}>
              {/* Background */}
              <div>
                <label className="block text-sm font-semibold mb-2 opacity-80">Wallpaper Background</label>
                <select
                  value={activeBackground}
                  onChange={(e) => handleChangeBackground(e.target.value)}
                  className={`${inputClass} appearance-none`}
                >
                  {BACKGROUNDS.map((bg) => (
                    <option key={bg.id} value={bg.id} className="text-black">
                      {bg.name}
                    </option>
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
                    className={inputClass}
                  />
                </div>
              )}

              {/* Weather Location */}
              <div>
                <label className="block text-sm font-semibold mb-2 opacity-80">Weather Location</label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={weatherCity}
                    onChange={(e) => setWeatherCity(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSetWeatherCity())}
                    className={`${smallInputClass} flex-1`}
                    placeholder="Enter city name..."
                  />
                  <button
                    type="button"
                    onClick={handleSetWeatherCity}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isDarkMode ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-black/5 hover:bg-black/10 text-black'
                    }`}
                  >
                    Set
                  </button>
                </div>
                {weatherStatus && <p className="text-xs mt-1.5 opacity-70">{weatherStatus}</p>}
              </div>

              {/* Spotify Connection */}
              <div>
                <label className="block text-sm font-semibold mb-2 opacity-80">Spotify</label>
                <div className="flex items-center gap-3">
                  <a
                    href="/api/spotify/login"
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      spotifyConnected
                        ? (isDarkMode ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25' : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20')
                        : 'bg-[#1DB954]/90 hover:bg-[#1DB954] text-white shadow-lg hover:shadow-[#1DB954]/25 hover:-translate-y-0.5'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                    </svg>
                    {spotifyConnected ? '✓ Connected' : 'Connect Spotify'}
                  </a>
                  {spotifyConnected && (
                    <span className={`text-xs ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
                      Active scrobbling via Last.fm (StarSumit)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 opacity-80">New Note</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className={`${inputClass} resize-none`}
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

        {/* ======== Payout Tracker Panel ======== */}
        <div className="liquid-glass-panel">
          <div className="liquid-glass-content p-8">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="text-2xl font-bold drop-shadow-sm">Payout Tracker</h2>
              </div>
              {payoutStatus && <span className="text-sm font-medium opacity-80">{payoutStatus}</span>}
            </div>

            {/* Summary */}
            <div className={`p-5 rounded-2xl border mb-6 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/30 border-white/40'}`}>
              <div className="flex items-baseline justify-between mb-2">
                <div>
                  <span className="text-3xl font-bold tracking-tight">
                    ${totalPayout.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                  <span className={`text-lg font-medium ml-1 ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
                    / ${payoutGoal.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                </div>
                <span className={`text-sm font-mono ${isDarkMode ? 'text-white/50' : 'text-black/50'}`}>
                  {percentage.toFixed(1)}%
                </span>
              </div>
              <div className={`w-full h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-white/10' : 'bg-black/10'}`}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${percentage}%`,
                    background: 'linear-gradient(90deg, #34d399, #10b981, #059669)',
                    boxShadow: '0 0 12px rgba(52, 211, 153, 0.4)'
                  }}
                />
              </div>
            </div>

            {/* Goal Setting */}
            <div className={`flex items-center gap-3 mb-6 pb-6 border-b ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}>
              <label className="text-sm font-semibold opacity-80 whitespace-nowrap">Goal ($)</label>
              <input
                type="number"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                className={`${smallInputClass} flex-1`}
                placeholder="1000"
                min="1"
              />
              <button
                onClick={handleSaveGoal}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isDarkMode ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-black/5 hover:bg-black/10 text-black'
                }`}
              >
                Set
              </button>
            </div>

            {/* Add Payout */}
            <div className="flex items-end gap-3 mb-6">
              <div className="flex-1">
                <label className="block text-xs font-semibold mb-1.5 opacity-60">Date</label>
                <input
                  type="date"
                  value={newPayoutDate}
                  onChange={(e) => setNewPayoutDate(e.target.value)}
                  className={smallInputClass + ' w-full'}
                />
              </div>
              <div className="w-28">
                <label className="block text-xs font-semibold mb-1.5 opacity-60">Amount ($)</label>
                <input
                  type="number"
                  value={newPayoutAmount}
                  onChange={(e) => setNewPayoutAmount(e.target.value)}
                  className={smallInputClass + ' w-full'}
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
              </div>
              <button
                onClick={handleAddPayout}
                className="bg-emerald-600/90 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg hover:shadow-emerald-500/25 hover:-translate-y-0.5 whitespace-nowrap"
              >
                + Add
              </button>
            </div>

            {/* Payout Records */}
            <div className="space-y-2">
              {sortedPayouts.length === 0 ? (
                <p className="text-center opacity-60 py-6 text-sm font-medium">No payouts recorded yet.</p>
              ) : (
                sortedPayouts.map((payout) => (
                  <div key={payout.id} className={`p-4 rounded-xl border transition-all ${
                    isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/40 border-white/40'
                  }`}>
                    {editingPayoutId === payout.id ? (
                      <div className="flex items-center gap-3">
                        <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className={smallInputClass + ' flex-1'} />
                        <input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} className={smallInputClass + ' w-24'} min="0" step="0.01" />
                        <button onClick={() => handleEditPayout(payout.id)} className="text-xs font-semibold text-emerald-500 hover:text-emerald-400 transition-colors">Save</button>
                        <button onClick={() => setEditingPayoutId(null)} className="text-xs font-semibold opacity-60 hover:opacity-100 transition-opacity">Cancel</button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-mono opacity-60">
                            {new Date(payout.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span className="font-semibold text-emerald-400">
                            +${payout.amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button onClick={() => startEditing(payout)} className={`text-xs font-semibold transition-colors ${isDarkMode ? 'text-white/40 hover:text-white/80' : 'text-black/40 hover:text-black/80'}`}>Edit</button>
                          <button onClick={() => handleDeletePayout(payout.id)} className="text-xs text-red-500 hover:text-red-400 font-semibold opacity-80 hover:opacity-100 transition-opacity">Delete</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ======== Current Notes Panel ======== */}
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
                        <p className="text-xs font-mono opacity-60">{new Date(note.createdAt).toLocaleString()}</p>
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
