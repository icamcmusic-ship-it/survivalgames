
import React from 'react';
import { Tribute, TributeStatus } from '../types';

interface TributeCardProps {
  tribute: Tribute;
  onSponsor?: (id: string) => void;
  canSponsor?: boolean;
  sponsorMode: boolean;
}

const DISTRICT_COLORS: Record<number, string> = {
  1: 'border-pink-500',
  2: 'border-red-600',
  3: 'border-yellow-400',
  4: 'border-blue-400',
  5: 'border-orange-400',
  6: 'border-purple-500',
  7: 'border-green-600',
  8: 'border-fuchsia-400',
  9: 'border-lime-500',
  10: 'border-rose-400',
  11: 'border-emerald-500',
  12: 'border-slate-400',
};

// Helper to get primary mood
const getMoodBadge = (tribute: Tribute) => {
    if (tribute.status === TributeStatus.Dead) return null;
    
    if (tribute.stats.health < 40) {
        return <span className="absolute top-0 right-0 transform translate-x-1 -translate-y-1 bg-red-800 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm animate-pulse">CRITICAL</span>;
    }
    if (tribute.stats.hunger > 85) {
        return <span className="absolute top-0 right-0 transform translate-x-1 -translate-y-1 bg-orange-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">STARVING</span>;
    }
    if (tribute.stats.sanity < 30) {
        return <span className="absolute top-0 right-0 transform translate-x-1 -translate-y-1 bg-purple-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">DELIRIOUS</span>;
    }
    return null;
};

export const TributeCard: React.FC<TributeCardProps> = ({ tribute, onSponsor, canSponsor, sponsorMode }) => {
  const isDead = tribute.status === TributeStatus.Dead;
  const districtColor = DISTRICT_COLORS[tribute.district] || 'border-gray-500';

  // Calculate status bars
  const hungerPercent = Math.min(100, tribute.stats.hunger);
  const sanityPercent = Math.min(100, tribute.stats.sanity);
  const healthPercent = Math.min(100, tribute.stats.health);

  return (
    <div className={`
      relative group flex flex-col p-3 rounded-xl border transition-all duration-300 ease-in-out
      ${isDead 
        ? 'bg-black/80 border-gray-800 opacity-60 grayscale' 
        : (sponsorMode ? 'bg-panel border-blue-500/50 shadow-lg shadow-blue-500/10' : 'bg-panel border-gray-800 hover:border-gray-500 hover:shadow-lg hover:shadow-gold/5 hover:-translate-y-1')
      }
    `}>
      {/* Status Indicator Dot (Corner) */}
      <div className={`absolute top-3 right-3 w-2 h-2 rounded-full ${isDead ? 'bg-gray-700' : 'bg-green-500 animate-pulse'}`}></div>
      
      {/* Mood Badge */}
      {!isDead && getMoodBadge(tribute)}

      {/* Sponsor Overlay Button */}
      {!isDead && canSponsor && (
          <button 
            onClick={(e) => { e.stopPropagation(); onSponsor?.(tribute.id); }}
            className={`
                absolute inset-0 z-20 flex items-center justify-center backdrop-blur-[1px] transition-all duration-300
                ${sponsorMode 
                    ? 'opacity-100 bg-blue-900/20' 
                    : 'bg-black/60 opacity-0 group-hover:opacity-100'
                }
            `}
          >
             <div className={`
                 bg-gold text-black font-bold font-display px-4 py-2 rounded-full shadow-lg flex items-center gap-2 transition-transform
                 ${sponsorMode ? 'scale-100 hover:scale-110' : 'transform scale-90 group-hover:scale-100'}
             `}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>
                SPONSOR
             </div>
          </button>
      )}

      <div className="flex items-center gap-3 mb-2">
        {/* Avatar */}
        <div className={`
          relative w-12 h-12 shrink-0 rounded-lg border-2 flex items-center justify-center bg-gray-900 overflow-hidden
          ${isDead ? 'border-gray-700' : districtColor}
        `}>
          {tribute.gender === 'M' ? (
             <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
             </svg>
          ) : (
             <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
             </svg>
          )}
          
          {/* Dead Overlay on Avatar */}
          {isDead && (
             <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
               <svg className="w-8 h-8 text-red-900" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
             </div>
          )}
        </div>

        {/* Text Info */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Dist {tribute.district}</span>
            
            {/* Kill Count Badge */}
            {tribute.killCount > 0 && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-blood bg-blood/10 px-1.5 py-0.5 rounded border border-blood/20">
                 <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 00-1 1v1a1 1 0 002 0V3a1 1 0 00-1-1zM4 4h3a3 3 0 006 0h3a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm2.5 7a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm2.45 4a2.5 2.5 0 10-4.9 0h4.9zM12 9a1 1 0 100 2h3a1 1 0 100-2h-3zm-1 4a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                 {tribute.killCount}
              </span>
            )}
          </div>
          <h3 className={`text-sm font-medium leading-tight break-words ${isDead ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
            {tribute.name}
          </h3>
        </div>
      </div>

      {/* New Stats & Traits Section */}
      {!isDead && (
        <div className="space-y-2">
          {/* Traits */}
          <div className="flex flex-wrap gap-1">
            {tribute.traits.map(trait => (
              <span key={trait} className="px-1.5 py-0.5 rounded text-[9px] uppercase font-bold bg-gray-800 text-gray-400 border border-gray-700">
                {trait}
              </span>
            ))}
          </div>
          
          {/* Need Bars */}
          <div className="space-y-1">
            {/* Health Bar */}
             <div>
                <div className="flex justify-between text-[9px] text-gray-500 mb-0.5 uppercase">
                   <span>Health</span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${tribute.stats.health < 30 ? 'bg-red-600 animate-pulse' : 'bg-green-600'}`} 
                    style={{ width: `${healthPercent}%` }}
                  ></div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <div>
                    <div className="flex justify-between text-[9px] text-gray-500 mb-0.5 uppercase">
                    <span>Sanity</span>
                    </div>
                    <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                        className={`h-full rounded-full ${tribute.stats.sanity < 30 ? 'bg-purple-500' : 'bg-blue-500'}`} 
                        style={{ width: `${sanityPercent}%` }}
                    ></div>
                    </div>
                </div>
                <div>
                    <div className="flex justify-between text-[9px] text-gray-500 mb-0.5 uppercase">
                    <span>Hunger</span>
                    </div>
                    <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                        className={`h-full rounded-full ${tribute.stats.hunger > 80 ? 'bg-red-500' : 'bg-amber-500'}`} 
                        style={{ width: `${hungerPercent}%` }}
                    ></div>
                    </div>
                </div>
            </div>
          </div>

          {/* Inventory */}
          {tribute.inventory.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-800">
                <div className="flex flex-wrap gap-1">
                    {tribute.inventory.map((item, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 rounded-sm text-[9px] bg-indigo-900/30 text-indigo-300 border border-indigo-800/50">
                            {item}
                        </span>
                    ))}
                </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};