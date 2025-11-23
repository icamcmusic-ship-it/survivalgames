
import React, { useState, useEffect, useCallback } from 'react';
import { GameState, TributeStatus } from './types';
import { generateTributes, simulatePhase } from './services/gameLogic';
import { TributeCard } from './components/TributeCard';
import { GameLog } from './components/GameLog';
import { DeathRecap } from './components/DeathRecap';
import { StatsModal } from './components/StatsModal';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    tributes: [],
    day: 0,
    phase: 'Reaping',
    logs: [],
    history: [],
    fallenTributes: [],
    totalEvents: 0,
    gameRunning: false,
    daysSinceLastDeath: 0,
    sponsorPoints: 100, // Initial points
    minDays: 5,
    maxDays: 10,
    isAutoPlaying: false
  });

  const [sponsorMode, setSponsorMode] = useState(false);

  // Initialize game
  useEffect(() => {
    setGameState(prev => ({
      ...prev,
      tributes: generateTributes(),
      logs: [{
        id: 'init', 
        text: "The Reaping has concluded. 24 tributes stand ready on their podiums. The Games are about to begin.", 
        type: 'Bloodbath' as any
      }],
      history: []
    }));
  }, []);

  // --- Game Logic Controls ---

  const advancePhase = useCallback(() => {
    const currentAlive = gameState.tributes.filter(t => t.status === TributeStatus.Alive);

    if (currentAlive.length === 1) {
      setGameState(prev => ({ ...prev, phase: 'Winner', isAutoPlaying: false }));
      return;
    }
    
    if (currentAlive.length === 0) {
        setGameState(prev => ({ ...prev, phase: 'Winner', isAutoPlaying: false }));
        return;
    }

    let nextPhase = gameState.phase;
    let nextDay = gameState.day;
    let showFallen = false;

    switch (gameState.phase) {
      case 'Reaping':
        nextPhase = 'Bloodbath';
        nextDay = 1;
        break;
      case 'Bloodbath':
        showFallen = true;
        nextPhase = 'Day'; 
        break;
      case 'Fallen':
        // Check what the previous actual phase was
        const lastHistory = gameState.history[gameState.history.length - 1];
        const lastPhaseType = lastHistory ? lastHistory.phase : 'Bloodbath';

        if (lastPhaseType === 'Bloodbath') {
             nextPhase = 'Day';
             nextDay = 1;
        } else if (lastPhaseType === 'Day') {
             nextPhase = 'Night';
             nextDay = gameState.day;
        } else if (lastPhaseType === 'Night') {
             nextPhase = 'Day';
             nextDay = gameState.day + 1;
        } else {
             nextPhase = 'Day';
             nextDay = gameState.day + 1;
        }
        break;
      case 'Day':
        showFallen = true;
        break;
      case 'Night':
        showFallen = true;
        break;
    }

    if (showFallen) {
        setGameState(prev => ({
           ...prev,
           history: [...prev.history, { phase: prev.phase, day: prev.day, logs: prev.logs }],
           phase: 'Fallen'
       }));
       return;
    }

    const result = simulatePhase(
        gameState.tributes, 
        nextPhase as 'Bloodbath' | 'Day' | 'Night', 
        gameState.daysSinceLastDeath,
        nextDay,
        gameState.minDays,
        gameState.maxDays
    );

    let newHistory = [...gameState.history];
    if (gameState.phase === 'Reaping') {
        newHistory.push({ phase: 'Reaping', day: 0, logs: gameState.logs });
    }

    setGameState(prev => ({
      ...prev,
      tributes: result.updatedTributes,
      phase: nextPhase as any,
      day: nextDay,
      logs: result.logs,
      history: newHistory,
      fallenTributes: result.fallen,
      totalEvents: prev.totalEvents + result.logs.length,
      daysSinceLastDeath: result.deathsInPhase > 0 ? 0 : prev.daysSinceLastDeath + (nextPhase === 'Day' ? 1 : 0),
      sponsorPoints: prev.sponsorPoints + 25 // Passive income per round
    }));

  }, [gameState]);

  // Auto-Play Effect
  useEffect(() => {
      if (gameState.isAutoPlaying && gameState.phase !== 'Winner') {
          const interval = setInterval(() => {
              advancePhase();
          }, 2000);
          return () => clearInterval(interval);
      }
  }, [gameState.isAutoPlaying, gameState.phase, advancePhase]);


  const handleRestart = () => {
    setGameState({
        tributes: generateTributes(),
        day: 0,
        phase: 'Reaping',
        logs: [{
            id: 'restart', 
            text: "The Reaping has concluded. 24 tributes stand ready.", 
            type: 'Bloodbath' as any
        }],
        history: [],
        fallenTributes: [],
        totalEvents: 0,
        gameRunning: false,
        daysSinceLastDeath: 0,
        sponsorPoints: 100,
        minDays: 5,
        maxDays: 10,
        isAutoPlaying: false
    });
    setSponsorMode(false);
  };

  const handleSponsor = (tributeId: string) => {
      if (gameState.sponsorPoints < 25) return;

      setGameState(prev => {
          const updatedTributes = prev.tributes.map(t => {
              if (t.id === tributeId && t.status === TributeStatus.Alive) {
                   // Give random item
                   const items = ['Bread', 'Water', 'Bandages', 'Antidote'];
                   const item = items[Math.floor(Math.random() * items.length)];
                   return {
                       ...t,
                       inventory: [...t.inventory, item],
                       stats: { ...t.stats, sanity: Math.min(100, t.stats.sanity + 10), hunger: Math.max(0, t.stats.hunger - 20) }
                   };
              }
              return t;
          });
          
          // Add log
          const targetName = updatedTributes.find(t => t.id === tributeId)?.name;
          const newLog = {
              id: `sponsor-${Date.now()}`,
              text: `<span class="text-blue-400 font-bold">SPONSOR:</span> A silver parachute delivers a gift to <span class="text-gold">${targetName}</span>.`,
              type: prev.phase === 'Bloodbath' ? 'Bloodbath' : (prev.phase === 'Night' ? 'Night' : 'Day') as any
          };

          return {
              ...prev,
              tributes: updatedTributes,
              sponsorPoints: prev.sponsorPoints - 25,
              logs: [...prev.logs, newLog] 
          };
      });
  };

  // --- Helpers ---
  const aliveCount = gameState.tributes.filter(t => t.status === TributeStatus.Alive).length;
  const deadCount = gameState.tributes.length - aliveCount;

  return (
    <div className="h-screen flex flex-col bg-gamemaker font-sans overflow-hidden selection:bg-gold selection:text-black">
        
        {/* Header / Status Bar */}
        <header className="h-16 shrink-0 bg-panel border-b border-gray-800 flex items-center justify-between px-6 shadow-md z-20 relative">
            <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center">
                     <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
                </div>
                <div>
                    <h1 className="font-display font-bold text-lg text-gray-100 tracking-wider uppercase">Battle Royale</h1>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500 uppercase">
                        <span>Sim v2.4</span>
                        <span className="text-gray-700">•</span>
                        <span>{gameState.phase}</span>
                    </div>
                </div>
            </div>

            {/* Stats Counters */}
            <div className="flex items-center gap-8">
                 <div className="hidden md:flex items-center gap-4">
                    <div className="text-center group relative cursor-help">
                        <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Funds</div>
                        <div className="font-display font-bold text-xl text-blue-400">{gameState.sponsorPoints}</div>
                    </div>
                    {/* Sponsor Mode Toggle */}
                    <button 
                        onClick={() => setSponsorMode(!sponsorMode)}
                        className={`
                            flex items-center gap-2 px-3 py-1 rounded border text-[10px] font-mono uppercase font-bold transition-all
                            ${sponsorMode 
                                ? 'bg-blue-900/50 border-blue-500 text-blue-200 shadow-[0_0_10px_rgba(59,130,246,0.3)]' 
                                : 'bg-gray-900/50 border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300'
                            }
                        `}
                    >
                        <span className={`w-2 h-2 rounded-full ${sponsorMode ? 'bg-blue-400 animate-pulse' : 'bg-gray-600'}`}></span>
                        {sponsorMode ? 'Sponsor Mode: ON' : 'Sponsor Mode: OFF'}
                    </button>
                 </div>

                 <div className="w-px h-8 bg-gray-800 hidden md:block"></div>
                 <div className="text-center">
                    <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Day</div>
                    <div className="font-display font-bold text-xl text-white">{gameState.day}</div>
                 </div>
                 <div className="w-px h-8 bg-gray-800"></div>
                 <div className="text-center">
                    <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Alive</div>
                    <div className="font-display font-bold text-xl text-green-500">{aliveCount}</div>
                 </div>
                 <div className="w-px h-8 bg-gray-800"></div>
                 <div className="text-center">
                    <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Fallen</div>
                    <div className="font-display font-bold text-xl text-blood">{deadCount}</div>
                 </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
                {/* Auto Play */}
                {gameState.phase !== 'Winner' && gameState.phase !== 'Reaping' && (
                     <button 
                        onClick={() => setGameState(prev => ({ ...prev, isAutoPlaying: !prev.isAutoPlaying }))}
                        className={`
                             hidden md:flex items-center gap-2 px-4 py-2 rounded-full font-mono font-bold uppercase text-xs tracking-widest transition-all border
                             ${gameState.isAutoPlaying 
                                 ? 'bg-red-900/50 border-red-500 text-red-200' 
                                 : 'bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700'
                             }
                        `}
                     >
                         {gameState.isAutoPlaying ? '■ Stop' : '▶ Auto'}
                     </button>
                )}

                {/* Proceed Button */}
                <button 
                    onClick={advancePhase}
                    disabled={gameState.phase === 'Winner'}
                    className={`
                        hidden md:flex items-center gap-2 px-6 py-2 rounded-full font-mono font-bold uppercase text-xs tracking-widest transition-all
                        ${gameState.phase === 'Winner' 
                            ? 'bg-gray-800 text-gray-600 cursor-not-allowed' 
                            : 'bg-white text-black hover:bg-gold hover:shadow-[0_0_15px_rgba(251,191,36,0.5)] active:scale-95'
                        }
                    `}
                >
                <span>{gameState.phase === 'Reaping' ? 'Start Games' : 'Proceed'}</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </button>
            </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 flex overflow-hidden relative">
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

            {gameState.phase === 'Winner' && (
                <StatsModal 
                    winner={gameState.tributes.find(t => t.status === TributeStatus.Alive) || gameState.tributes[0]} 
                    duration={gameState.day} 
                    tributes={gameState.tributes}
                    history={gameState.history}
                    onRestart={handleRestart}
                />
            )}

            {gameState.phase === 'Fallen' ? (
                 <div className="w-full flex-1 relative z-10">
                    <DeathRecap 
                        fallen={gameState.fallenTributes} 
                        onNext={() => {
                            advancePhase();
                        }} 
                    />
                 </div>
            ) : (
                <div className="w-full h-full flex flex-col lg:flex-row gap-6 p-6 relative z-10">
                    {/* Left: Arena Grid */}
                    <div className="flex-1 lg:flex-[2] flex flex-col min-h-0">
                        <div className="flex items-center justify-between mb-4">
                             <div className="flex items-center gap-4">
                                 <h2 className="font-display text-white text-xl font-bold">Tributes</h2>
                                 <span className="text-xs font-mono text-gray-500 uppercase">24 Subjects</span>
                             </div>
                             <div className="md:hidden text-xs font-mono text-blue-400">
                                 Funds: {gameState.sponsorPoints}
                             </div>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3 pb-4">
                                {gameState.tributes.map(t => (
                                <TributeCard 
                                    key={t.id} 
                                    tribute={t} 
                                    onSponsor={handleSponsor}
                                    canSponsor={gameState.sponsorPoints >= 25 && t.status === TributeStatus.Alive}
                                    sponsorMode={sponsorMode}
                                />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right: Logs */}
                    <div className="h-[40vh] lg:h-auto lg:flex-1 flex flex-col min-h-0">
                        <GameLog 
                            logs={gameState.logs} 
                            phase={gameState.phase} 
                            day={gameState.day}
                            history={gameState.history}
                        />
                    </div>

                    {/* Mobile Floating Button */}
                    <button 
                        onClick={advancePhase}
                        className="md:hidden absolute bottom-6 right-6 w-14 h-14 bg-gold rounded-full shadow-lg shadow-gold/40 flex items-center justify-center text-black z-50 active:scale-90 transition-transform"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                    </button>
                </div>
            )}
        </main>
    </div>
  );
};

export default App;
