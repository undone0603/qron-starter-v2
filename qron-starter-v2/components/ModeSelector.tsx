'use client';

import React from 'react';
import { QRON_MODE_CONFIG, type QronMode } from '@/app/qronModes';

interface ModeSelectorProps {
  mode: QronMode;
  onChange: (mode: QronMode) => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({ mode, onChange }) => {
  return (
    <div className="space-y-2">
      <h2 className="text-sm font-medium text-zinc-300">Select QRON Mode</h2>

      <div className="flex flex-wrap gap-2">
        {Object.entries(QRON_MODE_CONFIG).map(([key, cfg]) => {
          const m = key as QronMode;
          const isActive = m === mode;

          return (
            <button
              key={m}
              onClick={() => onChange(m)}
              className={`px-3 py-1.5 rounded-full text-xs border transition
                ${
                  isActive
                    ? 'border-emerald-400 bg-emerald-500/10 text-emerald-200'
                    : 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500'
                }`}
            >
              {cfg.label}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-zinc-400 mt-1">
        {QRON_MODE_CONFIG[mode].description}
      </p>
    </div>
  );
};
