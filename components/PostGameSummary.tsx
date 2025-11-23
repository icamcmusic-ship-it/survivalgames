
import React from 'react';
import { Tribute, TributeStatus } from '../types';

interface PostGameSummaryProps {
  tributes: Tribute[];
  winner: Tribute;
}

export const PostGameSummary: React.FC<PostGameSummaryProps> = ({ tributes, winner }) => {
  // Rank tributes: Winner first, then by death order (last dead is 2nd place)
  // We can approximate death order by checking fallen array order in main app, 
  // but here we just sort alive first, then maybe by some other metric if we don't have exact death timestamp.
  // ideally pass 'fallenTributes' ordered list. 
  // Since we only have 'tributes', we separate winner.
  
  const dead = tributes.filter(t => t.status === TributeStatus.Dead); // This list isn't ordered by time of death in 'tributes' state usually
  // NOTE: Ideally we passed 'fallenTributes' prop. But for now, let's just list them.
  
  // Better approach: Sort by Kill Count for fun if we lack time data, or just list them.
  const sorted = [winner, ...dead.sort((a, b) => b.killCount - a.killCount)];

  return (
    <div className="mt-8 bg-gray-900/50 rounded-xl border border-gray-800 p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
        <h3 className="text-gold font-display font-bold uppercase tracking-widest mb-4 text-lg">Detailed Performance Record</h3>
        <table className="w-full text-left text-xs font-mono">
            <thead className="text-gray-500 uppercase border-b border-gray-700 sticky top-0 bg-gray-900">
                <tr>
                    <th className="py-2 pl-2">Tribute</th>
                    <th className="py-2">Dist</th>
                    <th className="py-2 text-center">Kills</th>
                    <th className="py-2">Status / Fate</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
                {sorted.map((t, idx) => (
                    <tr key={t.id} className={`hover:bg-white/5 transition-colors ${t.id === winner.id ? 'bg-gold/5' : ''}`}>
                        <td className="py-2 pl-2 font-bold text-gray-300 flex items-center gap-2">
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
