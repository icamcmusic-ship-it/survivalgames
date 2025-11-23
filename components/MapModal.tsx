import React from 'react';
import { Tribute, TributeStatus } from '../types';

interface MapModalProps {
  tributes: Tribute[];
  onClose: () => void;
}

// Hex math helpers
const HEX_SIZE = 30;
const hexToPixel = (q: number, r: number) => {
    const x = HEX_SIZE * (3/2 * q);
    const y = HEX_SIZE * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r);
    return { x, y };
};

export const MapModal: React.FC<MapModalProps> = ({ tributes, onClose }) => {
  // Generate grid
  const grid: {q: number, r: number}[] = [];
  const mapRadius = 5;
  
  for (let q = -mapRadius; q <= mapRadius; q++) {
      for (let r = -mapRadius; r <= mapRadius; r++) {
          if (Math.abs(q + r) <= mapRadius) {
              grid.push({ q, r });
          }
      }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm">
      <div className="bg-panel border border-gray-700 rounded-xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl pt-12 md:pt-0">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
            <h2 className="font-display text-xl text-gold font-bold uppercase tracking-widest">Arena Tracker</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white font-mono font-bold uppercase text-sm">Close Map</button>
        </div>
        
        <div className="flex-1 overflow-hidden flex items-center justify-center bg-black relative">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
             
             {/* SVG Map */}
             <svg width="100%" height="100%" viewBox="-300 -300 600 600" preserveAspectRatio="xMidYMid meet">
                 <g>
                    {/* Draw Hexes */}
                    {grid.map((hex, i) => {
                        const { x, y } = hexToPixel(hex.q, hex.r);
                        // Center is 0,0 (Cornucopia)
                        const isCenter = hex.q === 0 && hex.r === 0;
                        return (
                            <g key={i} transform={`translate(${x},${y})`}>
                                <polygon 
                                    points="-30,-17.32 -15,-43.3 15,-43.3 30,-17.32 15,8.66 -15,8.66"
                                    className={`${isCenter ? 'fill-gold/20 stroke-gold' : 'fill-gray-900 stroke-gray-800'} stroke-1`}
                                    transform="rotate(30)"
                                />
                                {isCenter && <text x="0" y="5" textAnchor="middle" className="fill-gold text-[8px] font-bold tracking-tighter opacity-50">CORNUCOPIA</text>}
                            </g>
                        );
                    })}

                    {/* Draw Tributes */}
                    {tributes.filter(t => t.status === TributeStatus.Alive).map(t => {
                        const { x, y } = hexToPixel(t.coordinates.q, t.coordinates.r);
                        // Add slight random offset so they don't stack perfectly
                        const seed = t.id.charCodeAt(t.id.length-1) % 10;
                        const offX = (seed - 5) * 2;
                        const offY = (seed - 5) * 2;

                        return (
                            <g key={t.id} transform={`translate(${x + offX},${y + offY})`}>
                                <circle r="8" className={`fill-gray-800 stroke ${t.stats.health < 40 ? 'stroke-red-500' : 'stroke-blue-400'} stroke-2`} />
                                <text y="3" textAnchor="middle" className="fill-white text-[6px] font-bold">{t.district}</text>
                            </g>
                        );
                    })}
                 </g>
             </svg>
        </div>
        <div className="p-4 bg-gray-900 text-center text-xs text-gray-500 font-mono">
            Blue: Healthy • Red: Critical • Center: Cornucopia
        </div>
      </div>
    </div>
  );
};