
import React, { useState } from 'react';
import { Tribute } from '../types';

interface DeathRecapProps {
  fallen: Tribute[];
  onNext: () => void;
}

export const DeathRecap: React.FC<DeathRecapProps> = ({ fallen, onNext }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="h-full flex flex-col items-center justify-center p-4 animate-fade-in">
        <div className="text-center space-y-4 mb-8">
            <div className="inline-block border-b-2 border-blood pb-1 mb-2">
                 <h2 className="font-display text-4xl md:text-5xl font-black text-white uppercase tracking-[0.2em]">Fallen Tributes</h2>
            </div>
            <p className="font-mono text-gray-400 text-sm tracking-wide uppercase">
                {fallen.length} cannon shot{fallen.length !== 1 && 's'} heard in the distance
            </p>
            <p className="text-xs text-gray-600">Tap a tribute for details</p>
        </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 w-full max-w-5xl overflow-y-auto max-h-[50vh] p-4 custom-scrollbar">
        {fallen.map((t, idx) => (
          <div 
            key={t.id} 
            className="flex flex-col items-center group animate-fade-in cursor-pointer relative"
            style={{ animationDelay: `${idx * 100}ms` }}
            onClick={() => setSelectedId(selectedId === t.id ? null : t.id)}
          >
             <div className="relative mb-3">
                <div className={`w-20 h-20 rounded-full grayscale brightness-50 contrast-125 border-2 ${selectedId === t.id ? 'border-gold' : 'border-gray-700 group-hover:border-blood'} bg-gray-800 flex items-center justify-center overflow-hidden transition-all`}>
                     <svg className="w-10 h-10 text-gray-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                </div>
                {/* X Mark */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-full h-0.5 bg-blood absolute rotate-45"></div>
                    <div className="w-full h-0.5 bg-blood absolute -rotate-45"></div>
                </div>
             </div>
            <span className="font-bold text-gray-400 text-sm text-center leading-tight">{t.name}</span>
            <span className="text-[10px] text-gray-600 font-mono uppercase mt-1">District {t.district}</span>
            
            {/* Detail Popup */}
            {selectedId === t.id && (
                <div className="absolute z-50 bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 border border-blood text-white text-xs p-2 rounded w-48 text-center shadow-xl">
                    <div className="font-bold text-blood uppercase mb-1">Cause of Death</div>
                    <div className="mb-1">{t.deathCause || 'Unknown'}</div>
                    {t.killerId && fallen.some(f => f.id === t.killerId) ? (
                         <div className="mt-1 text-gray-500">Killer: {fallen.find(f => f.id === t.killerId)?.name}</div>
                    ) : t.killerId ? (
                         <div className="mt-1 text-gray-500">Killer: Unknown (Alive)</div>
                    ) : null}
                </div>
            )}
          </div>
        ))}
      </div>

      <button 
        onClick={onNext}
        className="mt-12 px-10 py-3 bg-gray-800 hover:bg-gray-700 hover:text-white text-gray-300 font-mono font-bold uppercase tracking-widest rounded border border-gray-600 transition-all hover:border-gray-400 hover:shadow-lg"
      >
        Resume Simulation
      </button>
    </div>
  );
};
