import React from 'react';
import { Tribute, TributeStatus } from '../types';

interface RelationshipGridProps {
  tributes: Tribute[];
  onClose: () => void;
}

export const RelationshipGrid: React.FC<RelationshipGridProps> = ({ tributes, onClose }) => {
  // Fix: Numeric sort for district, then ID
  const sortedTributes = [...tributes].sort((a, b) => (a.district - b.district) || a.id.localeCompare(b.id));

  const getColor = (val: number) => {
      if (val === 0) return 'bg-gray-800';
      if (val > 50) return 'bg-green-500';
      if (val > 20) return 'bg-green-800';
      if (val > 0) return 'bg-green-900';
      if (val < -50) return 'bg-red-600';
      if (val < -20) return 'bg-red-800';
      return 'bg-red-900';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm">
      <div className="bg-panel border border-gray-700 rounded-xl max-w-6xl w-full p-6 shadow-2xl flex flex-col h-[90vh]">
        <div className="flex justify-between items-center mb-4">
             <h2 className="font-display text-2xl text-gold font-bold uppercase">Relationship Matrix</h2>
             <button onClick={onClose} className="text-gray-400 hover:text-white uppercase font-mono font-bold">Close</button>
        </div>
        
        <div className="flex-1 overflow-auto custom-scrollbar">
            <div className="grid" style={{ gridTemplateColumns: `auto repeat(${sortedTributes.length}, minmax(20px, 1fr))` }}>
                {/* Header Row */}
                <div className="sticky top-0 left-0 z-20 bg-panel p-2"></div>
                {sortedTributes.map(t => (
                    <div key={t.id} className="sticky top-0 z-10 bg-panel p-1 text-[9px] font-mono text-gray-400 rotate-180 [writing-mode:vertical-lr] border-b border-gray-800 h-24 text-right">
                        {t.name}
                    </div>
                ))}

                {/* Rows */}
                {sortedTributes.map(rowT => (
                    <React.Fragment key={rowT.id}>
                        <div className="sticky left-0 z-10 bg-panel p-1 text-[10px] font-mono text-gray-300 border-r border-gray-800 whitespace-nowrap flex items-center">
                            {rowT.name}
                        </div>
                        {sortedTributes.map(colT => {
                            if (rowT.id === colT.id) return <div key={colT.id} className="bg-gray-900 border border-black/20"></div>;
                            const val = rowT.relationships[colT.id] || 0;
                            return (
                                <div 
                                    key={colT.id} 
                                    className={`relative group border border-black/20 ${getColor(val)} transition-colors`}
                                >
                                    <div className="absolute opacity-0 group-hover:opacity-100 bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black text-white text-xs p-2 rounded whitespace-nowrap z-30 pointer-events-none">
                                        {rowT.name} → {colT.name}: <span className={val > 0 ? 'text-green-400' : 'text-red-400'}>{val}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </React.Fragment>
                ))}
            </div>
        </div>
        <div className="mt-4 flex items-center justify-center gap-4 text-xs font-mono text-gray-500">
             <div className="flex items-center gap-2"><span className="w-3 h-3 bg-green-500"></span> Love/Ally (>50)</div>
             <div className="flex items-center gap-2"><span className="w-3 h-3 bg-green-900"></span> Friendly</div>
             <div className="flex items-center gap-2"><span className="w-3 h-3 bg-gray-800"></span> Neutral</div>
             <div className="flex items-center gap-2"><span className="w-3 h-3 bg-red-800"></span> Dislike</div>
             <div className="flex items-center gap-2"><span className="w-3 h-3 bg-red-600"></span> Hate/Rival (&lt;-50)</div>
        </div>
      </div>
    </div>
  );
};