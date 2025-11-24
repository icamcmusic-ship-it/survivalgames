

import React, { useState } from 'react';
import { Tribute, TributeStatus } from '../types';

interface TributeCardProps {
  tribute: Tribute;
  onSponsor?: (id: string) => void;
  onBet?: (id: string) => void;
  onModifyAttributes?: (id: string, attr: 'health' | 'weaponSkill', amount: number) => void;
  canSponsor?: boolean;
  sponsorMode: boolean;
  showOdds?: boolean;
  isUserBet?: boolean;
  isSetupPhase?: boolean;
  onSelect?: (id: string) => void;
  isSelected?: boolean;
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

const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }
  return color;
}

const getMoodBadge = (tribute: Tribute) => {
    if (tribute.status === TributeStatus.Dead) return null;
    
    // Fix #12: Consistent Critical Threshold with GameLogic (60)
    if (tribute.stats.health < 60) {
        return <span className="absolute top-0 right-0 transform translate-x-1 -translate-y-1 bg-red-800 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm animate-pulse z-20">CRITICAL</span>;
    }
    if (tribute.stats.hunger > 85) {
        return <span className="absolute top-0 right-0 transform translate-x-1 -translate-y-1 bg-orange-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm z-20">STARVING</span>;
    }
    if (tribute.stats.sanity < 30) {
        return <span className="absolute top-0 right-0 transform translate-x-1 -translate-y-1 bg-purple-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm z-20">DELIRIOUS</span>;
    }
    return null;
};

export const TributeCard: React.FC<TributeCardProps> = ({ tribute, onSponsor, onBet, canSponsor, sponsorMode, showOdds, isUserBet, isSetupPhase, onModifyAttributes, onSelect, isSelected }) => {
  const [isShaking, setIsShaking] = useState(false);
  const isDead = tribute.status === TributeStatus.Dead;
  const districtColor = DISTRICT_COLORS[tribute.district] || 'border-gray-500';

  const hungerPercent = Math.min(100, tribute.stats.hunger);
  const sanityPercent = Math.min(100, tribute.stats.sanity);
  const healthPercent = Math.min(100, tribute.stats.health);

  const allianceColor = tribute.allianceId && !isDead ? stringToColor(tribute.allianceId) : null;

  const handleSponsorClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (tribute.inventory.length >= 4) {
          setIsShaking(true);
          setTimeout(() => setIsShaking(false), 500);
      } else {
          onSponsor?.(tribute.id);
      }
  };

  const handleCardClick = () => {
      if (onSelect) onSelect(tribute.id);
  };

  return (
    <div 
        onClick={handleCardClick}
        className={`
      relative group flex flex-col p-3 rounded-xl border transition-all duration-300 ease-in-out cursor-pointer
      ${isDead 
        ? 'bg-black/80 border-gray-800 opacity-60 grayscale' 
        : (sponsorMode ? 'bg-panel border-blue-500/50 shadow-lg shadow-blue-500/10' : 'bg-panel border-gray-800 hover:border-gray-500 hover:shadow-lg hover:shadow-gold/5 hover:-translate-y-1')
      }
      ${isUserBet ? 'ring-2 ring-gold shadow-[0_0_15px_rgba(251,191,36,0.4)]' : ''}
      ${isSelected ? 'ring-2 ring-blue-400 bg-blue-900/10' : ''}
      ${isShaking ? 'translate-x-[-5px] ring-2 ring-red-500' : ''}
    `}
    style={isShaking ? { animation: 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both' } : {}}
    >
      <style>
          {`
            @keyframes shake {
                10%, 90% { transform: translate3d(-1px, 0, 0); }
                20%, 80% { transform: translate3d(2px, 0, 0); }
                30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
                40%, 60% { transform: translate3d(4px, 0, 0); }
            }
          `}
      </style>

      {allianceColor && (
          <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-1/2 rounded-r-md" style={{ backgroundColor: allianceColor }} title="In Alliance"></div>
      )}

      {!isDead && getMoodBadge(tribute)}
      
      <div className={`absolute top-3 right-3 w-2 h-2 rounded-full z-10 ${isDead ? 'bg-gray-700' : 'bg-green-500 animate-pulse'}`}></div>

      {isUserBet && (
          <div className="absolute -top-2 -left-1 bg-gold text-black text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg z-30">
              YOUR BET
          </div>
      )}

      {/* Desktop Interaction Overlay */}
      {!isDead && !isSetupPhase && (
          <div className={`hidden md:flex absolute inset-0 z-20 items-center justify-center backdrop-blur-[1px] transition-opacity duration-200 ${sponsorMode || (showOdds && !isUserBet) ? 'opacity-100 bg-black/40' : 'opacity-0 pointer-events-none'}`}>
             {sponsorMode && canSponsor && (
                 <button 
                    onClick={handleSponsorClick}
                    className="bg-gold text-black font-bold font-display px-4 py-2 rounded-full shadow-lg flex items-center gap-2 transform hover:scale-110 transition-transform"
                 >
                    SPONSOR
                 </button>
             )}
             {showOdds && !isUserBet && onBet && (
                 <button 
                    onClick={(e) => { e.stopPropagation(); onBet(tribute.id); }}
                    className="bg-purple-600 text-white font-bold font-mono text-xs px-4 py-2 rounded-full shadow-lg hover:bg-purple-500 transition-colors"
                 >
                    BET ({tribute.odds})
                 </button>
             )}
          </div>
      )}

      <div className="flex items-center gap-3 mb-2 pl-1">
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
          {isDead && (
             <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
               <svg className="w-8 h-8 text-red-900" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
             </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Dist {tribute.district}</span>
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
          <div className="flex justify-between items-center mt-0.5">
            <span className="text-[9px] text-gray-500 font-mono">{tribute.age} Years</span>
            {showOdds && !isDead && <span className="text-[9px] text-gold font-mono font-bold">{tribute.odds}</span>}
          </div>
        </div>
      </div>

      {/* God Mode Controls */}
      {isSetupPhase && !isDead && (
          <div className="mb-2 p-1 bg-gray-900 rounded border border-gray-700 z-30 relative">
              <div className="flex items-center justify-between text-[9px] text-gray-400 mb-1">
                  <span>HP: {tribute.stats.health}</span>
                  <div className="flex gap-1">
                      <button onClick={(e) => {e.stopPropagation(); onModifyAttributes?.(tribute.id, 'health', -10)}} className="px-1.5 bg-red-900 text-red-200 rounded hover:bg-red-700">-</button>
                      <button onClick={(e) => {e.stopPropagation(); onModifyAttributes?.(tribute.id, 'health', 10)}} className="px-1.5 bg-green-900 text-green-200 rounded hover:bg-green-700">+</button>
                  </div>
              </div>
               <div className="flex items-center justify-between text-[9px] text-gray-400">
                  <span>Skill: {tribute.stats.weaponSkill}</span>
                  <div className="flex gap-1">
                      <button onClick={(e) => {e.stopPropagation(); onModifyAttributes?.(tribute.id, 'weaponSkill', -5)}} className="px-1.5 bg-gray-700 rounded hover:bg-gray-600">-</button>
                      <button onClick={(e) => {e.stopPropagation(); onModifyAttributes?.(tribute.id, 'weaponSkill', 5)}} className="px-1.5 bg-gray-700 rounded hover:bg-gray-600">+</button>
                  </div>
              </div>
          </div>
      )}

      {!isDead && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1">
            {tribute.traits.map(trait => (
              <span key={trait} className="px-1.5 py-0.5 rounded text-[9px] uppercase font-bold bg-gray-800 text-gray-400 border border-gray-700">
                {trait}
              </span>
            ))}
          </div>
          
          <div className="space-y-1">
             <div>
                <div className="flex justify-between text-[9px] text-gray-500 mb-0.5 uppercase">
                   <span>Health</span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${tribute.stats.health < 40 ? 'bg-red-600 animate-pulse' : 'bg-green-600'}`} 
                    style={{ width: `${healthPercent}%` }}
                  ></div>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <div className="h-1 bg-gray-800 rounded-full overflow-hidden mt-1">
                    <div className={`h-full rounded-full ${tribute.stats.sanity < 30 ? 'bg-purple-500' : 'bg-blue-500'}`} style={{ width: `${sanityPercent}%` }}></div>
                    </div>
                </div>
                <div>
                    <div className="h-1 bg-gray-800 rounded-full overflow-hidden mt-1">
                    <div className={`h-full rounded-full ${tribute.stats.hunger > 80 ? 'bg-red-500' : 'bg-amber-500'}`} style={{ width: `${hungerPercent}%` }}></div>
                    </div>
                </div>
            </div>
          </div>

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

          {/* Mobile Actions (Bottom of Card) - Always visible on mobile if active */}
          <div className="md:hidden flex gap-2 mt-2 pt-2 border-t border-gray-80