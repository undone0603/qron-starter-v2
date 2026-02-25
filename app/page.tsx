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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiImageUrl, setApiImageUrl] = useState<string | null>(null);

  const modeConfig = QRON_MODE_CONFIG[mode];

  const handleGenerate = async () => {
    if (!url.trim()) return;
    setIsLoading(true);
    setError(null);
    setApiImageUrl(null);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `QRON ${mode} mode QR code art for URL: ${url.trim()}`,
          controlImage: url.trim(),
          rarityTier: modeConfig.rarityTier,
        }),
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ message: 'Generation failed' }));
        throw new Error(err.message ?? 'Generation failed');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.status === 'complete' && data.imageUrl) {
                  setApiImageUrl(data.imageUrl);
                }
                if (data.error) {
                  throw new Error(data.message ?? data.error);
                }
              } catch (e: any) {
                if (e.message !== 'Unexpected end of JSON input') {
                  setError(e.message);
                }
              }
            }
          }
        }
      }

      setGeneratedUrl(url.trim());
      setHasGenerated(true);
    } catch (e: any) {
      setError(e.message ?? 'Failed to generate');
    } finally {
      setIsLoading(false);
    }
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
      <ModeSelector mode={mode} onChange={setMode} />
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
      <button
        onClick={handleGenerate}
        disabled={isLoading || !url.trim()}
        className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {isLoading ? 'Generating...' : 'Generate'}
      </button>
      {hasGenerated && generatedUrl && (
        <div className="flex flex-col gap-4">
          {apiImageUrl && (
            <div>
              <p className="text-sm text-zinc-500 mb-2">AI-generated QRON art:</p>
              <img src={apiImageUrl} alt="QRON generated art" className="rounded w-64 h-64 object-cover" />
            </div>
          )}
          <div className="transition duration-300 ease-out scale-100">
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
        </div>
      )}
    </main>
  );
}
