// app/page.tsx
'use client';

import React, { useState } from 'react';
import QRONCode from '@/components/QRONCode';
import { QRON_MODE_CONFIG, type QronMode } from './qronModes';

const DEFAULT_JOURNEY = { scans: 1, cities: 1, daysAlive: 1 };
const DEFAULT_TRAITS = { firstScan: true, achievementLevel: 1 };

export default function HomePage() {
  const [url, setUrl] = useState('');
  const [mode, setMode] = useState<QronMode>('static');
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  const modeConfig = QRON_MODE_CONFIG[mode];

  const handleGenerate = () => {
    if (!url.trim()) return;
    setGeneratedUrl(url.trim());
    setHasGenerated(true);
  };

  const isReady = !!url.trim();

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center px-4 py-10">
      <section className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-[2fr,3fr] gap-10">
        {/* Left: Controls */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-semibold mb-2">Living QR Codes</h1>
            <p className="text-sm text-zinc-400">
              Create AI-generated QR codes that captivate. Art meets utility. Scannable portals that evolve.
            </p>
          </div>

          {/* Mode selector */}
          <div>
            <h2 className="text-sm font-medium mb-2 text-zinc-300">Select QRON Mode</h2>
            <div className="flex flex-wrap gap-2">
              {Object.entries(QRON_MODE_CONFIG).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => setMode(key as QronMode)}
                  className={`px-3 py-1.5 rounded-full text-xs border transition
                    ${
                      mode === key
                        ? 'border-emerald-400 bg-emerald-500/10 text-emerald-200'
                        : 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500'
                    }`}
                >
                  {cfg.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-zinc-400">{modeConfig.description}</p>
          </div>

          {/* URL + Generate */}
          <div className="space-y-3">
            <label className="block text-xs font-medium text-zinc-300">
              Destination URL
            </label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/your-experience"
              className="w-full rounded-md bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400"
            />
            <button
              onClick={handleGenerate}
              disabled={!isReady}
              className={`w-full py-2.5 rounded-md text-sm font-medium transition
                ${
                  isReady
                    ? 'bg-emerald-500 text-black hover:bg-emerald-400'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                }`}
            >
              {hasGenerated ? 'Regenerate QRON' : 'Generate QRON'}
            </button>
            {isReady && !hasGenerated && (
              <p className="text-[11px] text-emerald-300 mt-1">
                Ready. Click Generate to bring your QRON to life.
              </p>
            )}
          </div>
        </div>

        {/* Right: Preview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-zinc-300">Your QRON Preview</h2>
            <span className="text-[11px] text-zinc-500">
              Mode: <span className="text-emerald-300">{modeConfig.label}</span>
            </span>
          </div>

          <div className="relative rounded-xl border border-zinc-800 bg-zinc-950/80 p-6 flex items-center justify-center min-h-[260px]">
            {!generatedUrl ? (
              <p className="text-xs text-zinc-500 text-center max-w-xs">
                Enter a URL and click <span className="text-emerald-300">Generate</span> to create your AI-powered QR code.
              </p>
            ) : (
              <div className="transition duration-300 ease-out scale-100 animate-[pulse_2s_ease-out_infinite]">
                <QRONCode
                  codeId={generatedUrl}
                  payload={generatedUrl}
                  verificationState={modeConfig.verificationState}
                  rarityTier={modeConfig.rarityTier}
                  journeyStats={DEFAULT_JOURNEY}
                  userTraits={DEFAULT_TRAITS}
                  size={256}
                />
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}