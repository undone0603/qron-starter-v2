                  : 'bg-slate-800/50 border-slate-700 text-slate-300',
                isLocked && 'opacity-50 cursor-not-allowed'
              )}
            >
              {/* Tier Badge */}
              {mode.tier !== 'free' && (
                <span className={cn(
                  'absolute -top-1 -right-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium',
                  mode.tier === 'pro' ? 'bg-amber-500 text-black' : 'bg-purple-500 text-white'
                )}>
                  {mode.tier === 'pro' ? 'PRO' : 'ENT'}
                </span>
              )}
              
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{mode.name}</span>
            </button>
          );
        })}
      </div>
      
      {/* Selected Mode Description */}
      <div className="mt-4 p-3 bg-slate-900/50 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          {(() => {
            const mode = MODES.find(m => m.id === selectedMode);
            const Icon = mode ? IconMap[mode.icon as keyof typeof IconMap] : Sparkles;
            return <Icon className="w-4 h-4 text-qron-primary" />;
          })()}
          <span className="font-medium">
            {MODES.find(m => m.id === selectedMode)?.name}
          </span>
        </div>
        <p className="text-sm text-slate-400">
          {MODES.find(m => m.id === selectedMode)?.description}
        </p>
        <div className="flex flex-wrap gap-1 mt-2">
          {MODES.find(m => m.id === selectedMode)?.features.map((feature) => (
            <span key={feature} className="text-xs bg-slate-800 px-2 py-0.5 rounded-full text-slate-300">
              {feature}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
