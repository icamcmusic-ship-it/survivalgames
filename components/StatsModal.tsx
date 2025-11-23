
import React from 'react';
import { Tribute, RoundHistory } from '../types';

interface StatsModalProps {
  winner: Tribute;
  duration: number;
  tributes: Tribute[]; // All tributes to calculate rankings
  history: RoundHistory[];
  onRestart: () => void;
  onClose?: () => void; // Added close callback
}

export const StatsModal: React.FC<StatsModalProps> = ({ winner, duration, tributes, history, onRestart, onClose }) => {
  const sortedByKills = [...tributes].sort((a, b) => b.killCount - a.killCount);
  const mostKills = sortedByKills[0];

  // Safety check if winner is somehow undefined
  if (!winner) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm">
            <div className="bg-panel border border-red-900 p-8 rounded-xl text-center">
                <h1 className="text-2xl text-white font-bold mb-4">Simulation Terminated</h1>
                <p className="text-gray-400 mb-4">All tributes have perished.</p>
                <button onClick={onRestart} className="px-4 py-2 bg-gold text-black font-bold rounded">Restart</button>
            </div>
        </div>
      );
  }

  // Extract Winner's Story
  const storyLogs = history.flatMap(h => 
      h.logs.filter(l => l.text.includes(winner.name))
            .map(l => ({ day: h.day, phase: h.phase, text: l.text }))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative bg-panel border border-gold/30 rounded-2xl max-w-4xl w-full p-8 shadow-[0_0_50px_rgba(251,191,36,0.1)] animate-fade-in flex flex-col md:flex-row gap-8">
        
        {/* Background Decoration */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-gold to-transparent"></div>
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-gold/5 rounded-full blur-3xl"></div>

        {/* Fix #13: Close Button */}
        {onClose && (
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-500 hover:text-white z-50 p-2 bg-black/50 rounded-full"
                title="Minimize Stats"
            >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        )}
        
        {/* Left Column: Winner Stats */}
        <div className="flex-1 text-center relative z-10 flex flex-col justify-center">
          <h2 className="text-gold font-mono text-sm tracking-[0.5em] uppercase mb-2">The Games Are Over</h2>
          <h1 className="font-display text-5xl md:text-6xl font-bold text-white mb-8 drop-shadow-lg">
            Victor Crowned
          </h1>
          
          {/* Winner Circle */}
          <div className="relative w-40 h-40 mx-auto mb-6 group">
            <div className="absolute inset-0 rounded-full border-2 border-gold animate-pulse-slow shadow-[0_0_20px_rgba(251,191,36,0.3)]"></div>
            <div className="absolute inset-2 rounded-full bg-gray-900 flex items-center justify-center overflow-hidden">
                 <svg className="w-20 h-20 text-gold" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            </div>
            <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-gold text-black font-bold font-display px-4 py-1 rounded text-sm shadow-lg whitespace-nowrap">
              District {winner.district}
            </div>
          </div>

          <h3 className="text-3xl font-bold text-white mb-1">{winner.name}</h3>
          <p className="text-gray-400 font-mono text-sm mb-8">Survived {duration} Days</p>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
             {/* Winner Kills */}
            <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                <div className="text-gray-500 text-xs font-mono uppercase tracking-wider mb-1">Total Executions</div>
                <div className="text-3xl font-display font-bold text-blood">{winner.killCount}</div>
            </div>
            {/* Most Dangerous */}
             <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 relative overflow-hidden">
                {mostKills.id === winner.id && (
                    <div className="absolute top-0 right-0 bg-gold text-black text-[10px] px-1 font-bold">MVP</div>
                )}
                <div className="text-gray-500 text-xs font-mono uppercase tracking-wider mb-1">Most Dangerous</div>
                <div className="flex items-end justify-center gap-2">
                    <span className="text-lg font-bold text-gray-200 truncate max-w-[100px]">{mostKills.name}</span>
                    <span className="text-sm text-blood font-bold">({mostKills.killCount})</span>
                </div>
            </div>
        </div>

        <button 
          onClick={onRestart}
          className="w-full bg-gold hover:bg-yellow-400 text-black font-display font-bold py-4 rounded-xl uppercase tracking-widest transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-gold/20"
        >
          Initialize Next Simulation
        </button>
        </div>

        {/* Right Column: Journey Timeline */}
        <div className="flex-1 border-l border-gray-800 pl-8 relative overflow-hidden">
             <h3 className="text-gray-400 font-mono text-xs uppercase tracking-widest mb-4 sticky top-0 bg-panel z-10 py-2">The Path to Victory</h3>
             <div className="space-y-4 h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                 {storyLogs.length === 0 && <p className="text-gray-600 text-sm italic">They hid in the shadows and waited...</p>}
                 {storyLogs.map((log, idx) => (
                     <div key={idx} className="relative pl-4 border-l-2 border-gray-800 text-sm">
                         <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-gray-600"></div>
                         <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">
                             Day {log.day} - {log.phase}
                         </div>
                         <div className="text-gray-300" dangerouslySetInnerHTML={{ __html: log.text }} />
                     </div>
                 ))}
             </div>
        </div>
      </div>
    </div>
  );
};
