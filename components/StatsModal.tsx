
import React from 'react';
import { Tribute, RoundHistory } from '../types';
import { PostGameSummary } from './PostGameSummary';

interface StatsModalProps {
  winner: Tribute;
  duration: number;
  tributes: Tribute[]; 
  history: RoundHistory[];
  onRestart: () => void;
  onClose?: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({ winner, duration, tributes, history, onRestart, onClose }) => {
  // Safety check
  if (!winner) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm">
            <div className="bg-panel border border-red-900 p-8 rounded-xl text-center">
                <h1 className="text-2xl text-white font-bold mb-4">Simulation Terminated</h1>
                <button onClick={onRestart} className="px-4 py-2 bg-gold text-black font-bold rounded">Restart</button>
            </div>
        </div>
      );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative bg-panel border border-gold/30 rounded-2xl max-w-5xl w-full p-8 shadow-[0_0_50px_rgba(251,191,36,0.1)] animate-fade-in flex flex-col gap-6">
        
        {/* Background Decoration */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-gold to-transparent"></div>

        {onClose && (
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white z-50 p-2 bg-black/50 rounded-full">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        )}
        
        {/* Winner Section */}
        <div className="text-center">
            <h2 className="text-gold font-mono text-sm tracking-[0.5em] uppercase mb-2">The Games Are Over</h2>
            <h1 className="font-display text-5xl font-bold text-white mb-4 drop-shadow-lg">Victor Crowned</h1>
            
            <div className="flex flex-col items-center">
                <div className="relative w-32 h-32 mb-4">
                    <div className="absolute inset-0 rounded-full border-4 border-gold animate-pulse-slow shadow-[0_0_30px_rgba(251,191,36,0.3)]"></div>
                    <div className="absolute inset-2 rounded-full bg-gray-900 flex items-center justify-center">
                        <span className="text-4xl">👑</span>
                    </div>
                </div>
                <h3 className="text-3xl font-bold text-white">{winner.name}</h3>
                <p className="text-gray-400 font-mono text-sm">District {winner.district} • {winner.killCount} Kills</p>
            </div>
        </div>

        {/* Tabs & Data */}
        <PostGameSummary 
            tributes={tributes} 
            winner={winner} 
            history={history} 
        />

        <button 
          onClick={onRestart}
          className="w-full bg-gold hover:bg-yellow-400 text-black font-display font-bold py-4 rounded-xl uppercase tracking-widest transition-all hover:scale-[1.02]"
        >
          Initialize Next Simulation
        </button>
      </div>
    </div>
  );
};
