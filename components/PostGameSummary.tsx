

import React from 'react';
import { Tribute, TributeStatus } from '../types';

interface PostGameSummaryProps {
  tributes: Tribute[];
  winner: Tribute;
  fallenTributes?: Tribute[]; // Add optional prop for ordered death list
}

export const PostGameSummary: React.FC<PostGameSummaryProps> = ({ tributes, winner, fallenTributes }) => {
  // If fallenTributes is provided, use it to show death order (reverse order usually implies first died is first in list? 
  // Usually fallen list is appended as they die, so index 0 is first death).
  // We want Winner first, then 2nd place (last dead), etc.
  
  let sorted: Tribute[] = [];

  if (fallenTributes) {
      // fallenTributes[0] is first death (last place). fallenTributes[last] is runner up.
      // We want descending rank.
      const deadReversed = [...fallenTributes].reverse();
      sorted = [winner, ...deadReversed];
  } else {
      // Fallback if prop not passed yet (old usage)
      const dead = tributes.filter(t => t.status === TributeStatus.Dead);
      sorted = [winner, ...dead.sort((a, b) => b.killCount - a.killCount)];
  }

  // Filter out potential duplicates if winner is accidentally in fallen list (rare edge case)
  sorted = sorted.filter((t, index, self) => 
    index === self.findIndex((t2) => (t2.id === t.id))
  );

  return (
    <div className="mt-8 bg-gray-900/50 rounded-xl border border-gray-800 p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
        <h3 className="text-gold font-display font-bold uppercase tracking-widest mb-4 text-lg">Detailed Performance Record</h3>
        <table className="w-full text-left text-xs font-mono">
            <thead className="text-gray-500 uppercase border-b border-gray-700 sticky top-0 bg-gray-900">
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
                        <td className="py-2 text-gray-400 truncate max-w-[150px]">
                            {t.id === winner.id 
                                ? <span className="text-gold font-bold">VICTOR</span> 
                                : t.deathCause || 'Unknown'
                            }
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
  );
};
