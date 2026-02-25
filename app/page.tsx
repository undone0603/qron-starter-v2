'use client';

import React, { useState } from 'react';
import QRONCode from '@/components/QRONCode';
import { ModeSelector } from '@/app/ModeSelector';
import { QRON_MODE_CONFIG, type QronMode } from '@/app/qronModes';

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

  return (
    <main className="flex flex-col gap-8 p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold">QRON Studio</h1>

      <input
        type="text"
        placeholder="Enter a URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="border p-3 rounded w-full"
      />

      <ModeSelector mode={mode} setMode={setMode} />

      <button
        onClick={handleGenerate}
        className="bg-black text-white px-4 py-2 rounded"
      >
        Generate
      </button>

      {hasGenerated && generatedUrl && (
        <div className="transition duration-300 ease-out scale-100 animate-pulse">
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
    </main>
  );
}
