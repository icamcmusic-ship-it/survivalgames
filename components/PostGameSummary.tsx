
import React, { useState } from 'react';
import { Tribute, TributeStatus, RoundHistory, LogEntry } from '../types';

interface PostGameSummaryProps {
  tributes: Tribute[];
  winner: Tribute;
  fallenTributes?: Tribute[];
  history?: RoundHistory[]; // Added history
}

export const PostGameSummary: React.FC<PostGameSummaryProps> = ({ tributes, winner, fallenTributes, history }) => {
  const [activeTab, setActiveTab] = useState<'STATS' | 'TIMELINE'>('STATS');

  // Stats Logic
  let sorted: Tribute[] = [];
  if (fallenTributes) {
      const deadReversed = [...fallenTributes].reverse();
      sorted = [winner, ...deadReversed];
  } else {
      const dead = tributes.filter(t => t.status === TributeStatus.Dead);
      sorted = [winner, ...dead.sort((a, b) => b.killCount - a.killCount)];
  }
  sorted = sorted.filter((t, index, self) => index === self.findIndex((t2) => (t2.id === t.id)));

  // Timeline Logic
  // Flatten history into a single chronological list
  const flatLogs = history ? history.flatMap(h => h.logs.map(l => ({ ...l, day: h.day, phase: h.phase }))) : [];

  return (
    <div className="mt-8 bg-gray-900/90 rounded-xl border border-gray-800 p-6 max-h-[60vh] flex flex-col">
        <div className="flex gap-4 border-b border-gray-700 pb-4 mb-4">
            <button 
                onClick={() => setActiveTab('STATS')} 
                className={`text-sm font-bold uppercase tracking-widest px-4 py-2 rounded transition-colors ${activeTab === 'STATS' ? 'bg-gold text-black' : 'text-gray-400 hover:bg-gray-800'}`}
            >
                Statistics
            </button>
            <button 
                onClick={() => setActiveTab('TIMELINE')} 
                className={`text-sm font-bold uppercase tracking-widest px-4 py-2 rounded transition-colors ${activeTab === 'TIMELINE' ? 'bg-gold text-black' : 'text-gray-400 hover:bg-gray-800'}`}
            >
                Full Timeline
            </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
            {activeTab === 'STATS' ? (
                <table className="w-full text-left text-xs font-mono">
                    <thead className="text-gray-500 uppercase border-b border-gray-700 sticky top-0 bg-gray-900 z-10">
                        <tr>
                            <th className="py-2 pl-2">Rank</th>
                            <th className="py-2">Tribute</th>
                            <th className="py-2">Dist</th>
                            <th className="py-2 text-center">Kills</th>
                            <th className="py-2">Status / Fate</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {sorted.map((t, idx) => (
                            <tr key={t.id} className={`hover:bg-white/5 transition-colors ${t.id === winner.id ? 'bg-gold/5' : ''}`}>
                                <td className="py-2 pl-2 text-gray-600">{idx + 1}</td>
                                <td className="py-2 font-bold text-gray-300 flex items-center gap-2">
                                    {t.id === winner.id && <span className="text-gold">👑</span>}
                                    {t.name}
                                </td>
                                <td className="py-2 text-gray-500">{t.district}</td>
                                <td className={`py-2 text-center font-bold ${t.killCount > 0 ? 'text-blood' : 'text-gray-600'}`}>{t.killCount}</td>
                                <td className="py-2 text-gray-400 truncate max-w-[150px] text-[10px]">
                                    {t.id === winner.id ? <span className="text-gold font-bold">VICTOR</span> : (
                                        <div>
                                            <div>{t.deathCause || 'Unknown'}</div>
                                            {t.killerName && <div className="text-blood">Killed by {t.killerName}</div>}
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <div className="space-y-6 pl-4 border-l-2 border-gray-800">
                    {history?.map((round, rIdx) => (
                        <div key={rIdx} className="relative">
                            <div className="absolute -left-[21px] top-0 w-3 h-3 rounded-full bg-gold border-2 border-gray-900"></div>
                            <h4 className="text-gold font-display font-bold uppercase text-sm mb-2 pl-2">
                                {round.phase === 'Bloodbath' ? 'The Bloodbath' : `Day ${round.day} - ${round.phase}`}
                            </h4>
                            <div className="space-y-2">
                                {round.logs.map((log, lIdx) => (
                                    <div key={log.id} className={`text-xs font-mono pl-2 py-1 border-l border-gray-800 ${log.deathNames ? 'text-red-400 bg-red-900/10' : 'text-gray-400'}`}>
                                        <span className="text-gray-600 mr-2">{(lIdx+1).toString().padStart(2, '0')}</span>
                                        <span dangerouslySetInnerHTML={{ __html: log.text }}></span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    {history?.length === 0 && <div className="text-gray-500 italic">No events recorded.</div>}
                </div>
            )}
        </div>
    </div>
  );
};
