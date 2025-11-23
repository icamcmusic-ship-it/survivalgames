
import React, { useEffect, useRef, useState } from 'react';
import { LogEntry, RoundHistory } from '../types';

interface GameLogProps {
  logs: LogEntry[];
  phase: string;
  day: number;
  history: RoundHistory[];
  selectedTributeId?: string | null;
}

type FilterType = 'ALL' | 'DEATHS' | 'MAJOR';

export const GameLog: React.FC<GameLogProps> = ({ logs, phase, day, history, selectedTributeId }) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [viewIndex, setViewIndex] = useState<number>(-1);
  const [filter, setFilter] = useState<FilterType>('ALL');
  // CHANGED: Default autoScroll to false per user request
  const [autoScroll, setAutoScroll] = useState(false);

  useEffect(() => {
    setViewIndex(-1);
  }, [logs]);

  useEffect(() => {
    if (autoScroll && viewIndex === -1) {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll, viewIndex, selectedTributeId]);

  // Detect manual scroll to stop auto-scroll
  const handleScroll = () => {
      if (!scrollContainerRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      // Increased Tolerance to 150px
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 150;
      
      if (!isAtBottom && autoScroll) {
          setAutoScroll(false);
      } else if (isAtBottom && !autoScroll) {
          setAutoScroll(true);
      }
  };

  const isCurrent = viewIndex === -1;
  
  let displayLogs = logs;
  let displayPhase = phase;
  let displayDay = day;

  if (!isCurrent && history[viewIndex]) {
      displayLogs = history[viewIndex].logs;
      displayPhase = history[viewIndex].phase;
      displayDay = history[viewIndex].day;
  }

  const isNightPhase = displayPhase === 'Night';

  // Apply Filters
  const filteredLogs = displayLogs.filter(log => {
      // Tribute Filter (Fix #5)
      if (selectedTributeId) {
         if (!log.relatedTributeIds || !log.relatedTributeIds.includes(selectedTributeId)) {
             return false;
         }
      }
      
      if (filter === 'DEATHS') return !!log.deathNames;
      if (filter === 'MAJOR') return !!log.deathNames || log.type === 'Arena' || log.type === 'Bloodbath';
      return true;
  });

  const handlePrev = () => {
      if (viewIndex === -1) {
          if (history.length > 0) setViewIndex(history.length - 1);
      } else if (viewIndex > 0) {
          setViewIndex(viewIndex - 1);
      }
      setAutoScroll(false);
  };

  const handleNext = () => {
      if (viewIndex === -1) return;
      if (viewIndex < history.length - 1) {
          setViewIndex(viewIndex + 1);
      } else {
          setViewIndex(-1); 
          setAutoScroll(true);
      }
  };

  return (
    <div className="flex flex-col h-full bg-panel rounded-2xl border border-gray-800 shadow-2xl overflow-hidden relative">
      <style>
        {`
          @keyframes glitch-anim {
            0% { transform: translate(0) }
            20% { transform: translate(-2px, 2px) }
            40% { transform: translate(-2px, -2px) }
            60% { transform: translate(2px, 2px) }
            80% { transform: translate(2px, -2px) }
            100% { transform: translate(0) }
          }
          .glitch-text {
            animation: glitch-anim 0.3s infinite;
            color: #d8b4fe;
            text-shadow: 1px 0 red, -1px 0 blue;
          }
        `}
      </style>
      
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
        
        {/* Nav */}
        <div className="flex items-center gap-2">
            <button onClick={handlePrev} disabled={history.length === 0 && viewIndex === -1 || viewIndex === 0} className="p-1 rounded hover:bg-gray-700 text-gray-400 disabled:opacity-30">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className={`flex items-center justify-center w-16 text-xs font-mono font-bold ${isCurrent ? 'text-red-500' : 'text-gray-500'}`}>
                {isCurrent ? 'LIVE' : `${viewIndex + 1}/${history.length}`}
            </div>
            <button onClick={handleNext} disabled={isCurrent} className="p-1 rounded hover:bg-gray-700 text-gray-400 disabled:opacity-30">
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex border-b border-gray-800 bg-black/20 justify-between items-center pr-2">
          <div className="flex flex-1">
            {(['ALL', 'DEATHS', 'MAJOR'] as FilterType[]).map(f => (
                <button 
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex-1 py-2 text-[10px] font-mono font-bold uppercase tracking-wider hover:bg-white/5 transition-colors ${filter === f ? 'text-gold border-b-2 border-gold' : 'text-gray-500'}`}
                >
                    {f}
                </button>
            ))}
          </div>
          <button 
             onClick={() => { setAutoScroll(!autoScroll); if(!autoScroll) setViewIndex(-1); }}
             className={`ml-2 text-[10px] font-mono uppercase px-2 py-1 rounded border ${autoScroll ? 'text-green-400 border-green-900 bg-green-900/20' : 'text-gray-500 border-gray-700'}`}
          >
              {autoScroll ? 'Auto: ON' : 'Auto: OFF'}
          </button>
      </div>

      {/* Log Content */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
        ref={scrollContainerRef}
        onScroll={handleScroll}
      >
        {displayLogs.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-50">
                <p className="font-mono text-sm">Waiting for simulation data...</p>
            </div>
        )}
        
        {filteredLogs.map((log, idx) => {
          const isDeath = !!log.deathNames;
          const isArena = log.type === 'Arena';
          const isInsanity = log.text.includes('Insanity');
          
          // Divider check needs to use original index or reference previous filtered item.
          // Simplification: just check type change against previous rendered item.
          const prevLog = filteredLogs[idx - 1];
          const showDivider = prevLog && prevLog.type !== log.type && log.type !== 'Day';
          
          return (
            <React.Fragment key={log.id}>
                {showDivider && (
                    <div className="flex items-center gap-2 my-4 opacity-50">
                        <div className="h-px bg-gray-700 flex-1"></div>
                        <span className="text-[10px] font-mono uppercase text-gray-500">{log.type} Phase</span>
                        <div className="h-px bg-gray-700 flex-1"></div>
                    </div>
                )}
                <div 
                className={`
                    relative pl-4 pr-3 py-3 rounded-r-lg border-l-2 font-mono text-sm leading-relaxed animate-fade-in
                    ${isDeath 
                    ? 'bg-blood/5 border-blood text-gray-200' 
                    : (isArena ? 'bg-yellow-900/20 border-yellow-600 text-yellow-100' : 'bg-gray-800/30 border-gray-700 text-gray-400')
                    }
                `}
                style={{ animationDelay: `${Math.min(idx * 20, 500)}ms` }}
                >
                <span className="absolute top-3 left-[-1px] w-2 h-full bg-inherit opacity-50"></span>
                
                <div className="flex gap-3">
                    <span className="text-[10px] text-gray-600 pt-1 select-none">
                    {(idx + 1).toString().padStart(3, '0')}
                    </span>
                    <div className="flex-1">
                    <p 
                        dangerouslySetInnerHTML={{ __html: log.text }} 
                        className={isInsanity ? 'glitch-text' : ''}
                    />
                    
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
            </React.Fragment>
          );
        })}
        <div className="pb-20 md:pb-0" ref={bottomRef} />
      </div>
      
      {!autoScroll && (
          <button 
             onClick={() => { setAutoScroll(true); setViewIndex(-1); }}
             className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gold text-black px-4 py-1 rounded-full text-xs font-bold shadow-lg animate-bounce"
          >
              Jump to Latest
          </button>
      )}
    </div>
  );
};
