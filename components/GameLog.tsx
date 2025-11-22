
import React, { useEffect, useRef, useState } from 'react';
import { LogEntry, RoundHistory } from '../types';

interface GameLogProps {
  logs: LogEntry[];
  phase: string;
  day: number;
  history: RoundHistory[];
}

export const GameLog: React.FC<GameLogProps> = ({ logs, phase, day, history }) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  // -1 means "current", 0+ is index in history array
  const [viewIndex, setViewIndex] = useState<number>(-1);

  // Reset to current view when new logs come in (new phase)
  useEffect(() => {
    setViewIndex(-1);
  }, [logs]);

  // Scroll to bottom when content changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, viewIndex]);

  const isCurrent = viewIndex === -1;
  
  // Determine data to show
  let displayLogs = logs;
  let displayPhase = phase;
  let displayDay = day;

  if (!isCurrent && history[viewIndex]) {
      displayLogs = history[viewIndex].logs;
      displayPhase = history[viewIndex].phase;
      displayDay = history[viewIndex].day;
  }

  const isDayPhase = displayPhase === 'Day' || displayPhase === 'Bloodbath' || displayPhase === 'Reaping';
  const isNightPhase = displayPhase === 'Night';

  const handlePrev = () => {
      if (viewIndex === -1) {
          if (history.length > 0) setViewIndex(history.length - 1);
      } else if (viewIndex > 0) {
          setViewIndex(viewIndex - 1);
      }
  };

  const handleNext = () => {
      if (viewIndex === -1) return;
      if (viewIndex < history.length - 1) {
          setViewIndex(viewIndex + 1);
      } else {
          setViewIndex(-1); // Back to current
      }
  };

  return (
    <div className="flex flex-col h-full bg-panel rounded-2xl border border-gray-800 shadow-2xl overflow-hidden">
      {/* Log Header */}
      <div className={`p-4 border-b border-gray-800 flex items-center justify-between ${isNightPhase ? 'bg-indigo-950/30' : 'bg-gray-900/50'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-2 h-8 rounded ${isNightPhase ? 'bg-indigo-500' : (displayPhase === 'Bloodbath' ? 'bg-blood' : 'bg-gold')}`}></div>
          <div>
            <h2 className="font-display text-xl font-bold text-white tracking-widest uppercase">
              {displayPhase === 'Bloodbath' ? 'The Bloodbath' : 
               displayPhase === 'Reaping' ? 'The Reaping' : 
               `${displayPhase} ${displayDay}`}
            </h2>
            <p className="text-xs text-gray-500 font-mono uppercase">
              {!isCurrent ? 'Viewing History' : 'Live Feed'} • {displayLogs.length} Events
            </p>
          </div>
        </div>
        
        {/* Navigation & Live Indicator */}
        <div className="flex items-center gap-2">
            <button 
                onClick={handlePrev}
                disabled={history.length === 0 && viewIndex === -1 || viewIndex === 0}
                className="p-1 rounded hover:bg-gray-700 text-gray-400 disabled:opacity-30 transition-colors"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            
            <div className={`flex items-center justify-center w-16 text-xs font-mono font-bold ${isCurrent ? 'text-red-500' : 'text-gray-500'}`}>
                {isCurrent ? 'LIVE' : `${viewIndex + 1}/${history.length}`}
            </div>

            <button 
                onClick={handleNext}
                disabled={isCurrent}
                className="p-1 rounded hover:bg-gray-700 text-gray-400 disabled:opacity-30 transition-colors"
            >
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
        </div>
      </div>

      {/* Log Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        {displayLogs.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-50">
                <svg className="w-12 h-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                <p className="font-mono text-sm">Waiting for simulation data...</p>
            </div>
        )}
        
        {displayLogs.map((log, idx) => {
          const isDeath = !!log.deathNames;
          return (
            <div 
              key={log.id} 
              className={`
                relative pl-4 pr-3 py-3 rounded-r-lg border-l-2 font-mono text-sm leading-relaxed animate-fade-in
                ${isDeath 
                  ? 'bg-blood/5 border-blood text-gray-200' 
                  : 'bg-gray-800/30 border-gray-700 text-gray-400'
                }
              `}
              style={{ animationDelay: `${idx * 20}ms` }}
            >
              {/* Timestamp/ID pseudo-element */}
              <span className="absolute top-3 left-[-1px] w-2 h-full bg-inherit opacity-50"></span>
              
              <div className="flex gap-3">
                <span className="text-[10px] text-gray-600 pt-1 select-none">
                   {(idx + 1).toString().padStart(3, '0')}
                </span>
                <div className="flex-1">
                  <p dangerouslySetInnerHTML={{ __html: log.text }} />
                  
                  {isDeath && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {log.deathNames!.map(name => (
                        <span key={name} className="inline-flex items-center px-2 py-0.5 rounded bg-blood text-white text-[10px] font-bold uppercase tracking-wider">
                          💀 {name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
