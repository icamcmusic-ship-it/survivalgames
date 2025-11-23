

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, TributeStatus, WeatherType } from './types';
import { generateTributes, simulatePhase, simulateTraining } from './services/gameLogic';
import { TributeCard } from './components/TributeCard';
import { GameLog } from './components/GameLog';
import { DeathRecap } from './components/DeathRecap';
import { StatsModal } from './components/StatsModal';
import { RelationshipGrid } from './components/RelationshipGrid';
import { MapModal } from './components/MapModal';
import { PostGameSummary } from './components/PostGameSummary';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    tributes: [],
    day: 0,
    phase: 'Setup',
    logs: [],
    history: [],
    fallenTributes: [],
    totalEvents: 0,
    gameRunning: false,
    daysSinceLastDeath: 0,
    sponsorPoints: 100,
    userBet: null,
    minDays: 5,
    maxDays: 10,
    isAutoPlaying: false,
    currentWeather: 'Clear',
    settings: {
        gameSpeed: 2000,
        fatalityRate: 1.0,
        enableWeather: true
    }
  });

  const [sponsorMode, setSponsorMode] = useState(false);
  const [showAliveOnly, setShowAliveOnly] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showRelationships, setShowRelationships] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Initialize tributes only on mount if empty
  useEffect(() => {
    if (gameState.tributes.length === 0) {
        setGameState(prev => ({ ...prev, tributes: generateTributes() }));
    }
  }, []);

  // --- Auto-Play Loop ---
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerNextPhase = () => {
      advancePhase();
  };

  useEffect(() => {
    if (gameState.isAutoPlaying && gameState.phase !== 'Winner' && gameState.phase !== 'Setup' && gameState.phase !== 'Reaping') {
        // Prevent stacking timers
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(triggerNextPhase, gameState.settings.gameSpeed);
    } else {
        if (timerRef.current) clearTimeout(timerRef.current);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [gameState.isAutoPlaying, gameState.phase, gameState.day, gameState.settings.gameSpeed]); 
  // removed `tributes` from dep array to avoid re-trigger on minor state changes mid-tick, rely on ref/cycle

  // --- Game Logic Controls ---

  const advancePhase = useCallback(() => {
    setGameState(prev => {
        const currentAlive = prev.tributes.filter(t => t.status === TributeStatus.Alive);

        if (currentAlive.length <= 1 && !['Reaping', 'Setup', 'Training'].includes(prev.phase)) {
          return { ...prev, phase: 'Winner', isAutoPlaying: false };
        }

        let nextPhase = prev.phase;
        let nextDay = prev.day;
        let showFallen = false;
        let isTrainingStep = false;

        switch (prev.phase) {
          case 'Setup':
            nextPhase = 'Reaping';
            break;
          case 'Reaping':
            nextPhase = 'Training';
            nextDay = 0;
            break;
          case 'Training':
             if (prev.day < 3) {
                 isTrainingStep = true;
                 nextDay = prev.day + 1;
             } else {
                 nextPhase = 'Bloodbath';
                 nextDay = 1;
             }
             break;
          case 'Bloodbath':
            showFallen = true;
            nextPhase = 'Day'; 
            break;
          case 'Fallen':
            const lastHistory = prev.history[prev.history.length - 1];
            const lastPhaseType = lastHistory ? lastHistory.phase : 'Bloodbath';
            if (lastPhaseType === 'Bloodbath' || lastPhaseType === 'Night') {
                 nextPhase = 'Day';
                 nextDay = prev.day + (lastPhaseType === 'Night' ? 1 : 0);
            } else {
                 nextPhase = 'Night';
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
           const newHistory = [...prev.history, { phase: prev.phase, day: prev.day, logs: prev.logs }];
           return {
               ...prev,
               history: newHistory,
               phase: 'Fallen'
           };
        }

        if (prev.phase === 'Training' && isTrainingStep) {
             const simResult = simulateTraining(prev.tributes);
             return {
                 ...prev,
                 day: nextDay,
                 tributes: simResult.updatedTributes,
                 logs: [...prev.logs, ...simResult.logs]
             };
        }

        // Determine Weather - Fixed Desync
        let nextWeather = prev.currentWeather;
        if (prev.settings.enableWeather && nextPhase === 'Day' && Math.random() < 0.3) {
            const weathers: WeatherType[] = ['Clear', 'Rain', 'Heatwave', 'Fog', 'Storm'];
            nextWeather = weathers[Math.floor(Math.random() * weathers.length)];
        } else if (nextPhase === 'Night') {
            nextWeather = 'Clear'; 
        }

        const result = simulatePhase(
            prev.tributes, 
            nextPhase as any, 
            prev.daysSinceLastDeath,
            nextDay,
            prev.minDays,
            prev.maxDays,
            nextWeather, // Pass the NEW weather
            prev.settings.fatalityRate,
            prev.settings.enableWeather
        );

        let newHistory = [...prev.history];
        if (prev.phase === 'Reaping' || (prev.phase === 'Training' && nextPhase === 'Bloodbath')) {
             newHistory.push({ phase: prev.phase, day: prev.day, logs: prev.logs });
        }

        if (nextWeather !== prev.currentWeather && nextPhase === 'Day') {
            result.logs.unshift({
                id: `weather-${crypto.randomUUID()}`,
                text: `<span class="text-blue-300 font-bold uppercase">WEATHER UPDATE:</span> The arena is shifting. ${nextWeather} conditions detected.`,
                type: 'Day' as any
            });
        }
        
        const newDaysSinceLastDeath = result.deathsInPhase > 0 
            ? Math.max(0, prev.daysSinceLastDeath - 2) 
            : prev.daysSinceLastDeath + (nextPhase === 'Day' ? 1 : 0);

        return {
          ...prev,
          tributes: result.updatedTributes,
          phase: nextPhase as any,
          day: nextDay,
          logs: nextPhase === 'Bloodbath' ? result.logs : result.logs,
          history: newHistory,
          fallenTributes: result.fallen,
          totalEvents: prev.totalEvents + result.logs.length,
          daysSinceLastDeath: newDaysSinceLastDeath,
          sponsorPoints: prev.sponsorPoints + 25,
          currentWeather: nextWeather // Update state
        };
    });
  }, []);


  const handleRestart = () => {
    setGameState(prev => ({
        tributes: generateTributes(),
        day: 0,
        phase: 'Setup',
        logs: [],
        history: [],
        fallenTributes: [],
        totalEvents: 0,
        gameRunning: false,
        daysSinceLastDeath: 0,
        sponsorPoints: 100,
        userBet: null,
        minDays: 5,
        maxDays: 10,
        isAutoPlaying: false,
        currentWeather: 'Clear', // Hard reset, but respected in next logic tick
        settings: { ...prev.settings }
    }));
    setSponsorMode(false);
  };

  const handleSponsor = (tributeId: string) => {
      if (gameState.sponsorPoints < 25) return;
      
      const items = ['Bread', 'Water', 'Bandages', 'Antidote', 'Spear'];
      const item = items[Math.floor(Math.random() * items.length)];

      setGameState(prev => {
          const target = prev.tributes.find(t => t.id === tributeId);
          if (target && target.inventory.length >= 4) return prev;

          const updatedTributes = prev.tributes.map(t => {
              if (t.id === tributeId && t.status === TributeStatus.Alive) {
                   return {
                       ...t,
                       inventory: [...t.inventory, item],
                       stats: { ...t.stats, sanity: Math.min(100, t.stats.sanity + 10), hunger: Math.max(0, t.stats.hunger - 20) }
                   };
              }
              return t;
          });
          
          // Safe log generation using valid item variable
          const newLog = {
              id: `sponsor-${crypto.randomUUID()}`,
              text: `<span class="text-blue-400 font-bold">SPONSOR:</span> A silver parachute delivers a <span class="text-white">${item}</span> to <span class="text-gold">${target?.name}</span>.`,
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

  const triggerArenaEvent = (type: string, cost: number) => {
      if (gameState.sponsorPoints < cost) return;
      let text = '';
      if (type === 'Rain') text = "The Gamemakers have triggered a torrential downpour.";
      if (type === 'Feast') text = "The Gamemakers have prepared a Feast.";
      if (type === 'Mutts') text = "Wolf Mutts have been released into the arena!";
      
      setGameState(prev => ({
          ...prev,
          sponsorPoints: prev.sponsorPoints - cost,
          logs: [...prev.logs, { id: `gm-${crypto.randomUUID()}`, text: `<span class="text-purple-500 font-bold">GAMEMAKER INTERVENTION:</span> ${text}`, type: 'Arena' as any }],
          currentWeather: type === 'Rain' ? 'Rain' : prev.currentWeather
      }));
  };

  const handleBet = (id: string) => {
      setGameState(prev => ({ ...prev, userBet: id }));
  };

  // --- View Helpers ---
  const aliveCount = gameState.tributes.filter(t => t.status === TributeStatus.Alive).length;
  const deadCount = gameState.tributes.length - aliveCount;
  const displayedTributes = showAliveOnly 
    ? gameState.tributes.filter(t => t.status === TributeStatus.Alive)
    : gameState.tributes;

  return (
    <div className="h-screen flex flex-col bg-gamemaker font-sans overflow-hidden selection:bg-gold selection:text-black">
        
        {/* Modals */}
        {showRelationships && <RelationshipGrid tributes={gameState.tributes} onClose={() => setShowRelationships(false)} />}
        {showMap && <MapModal tributes={gameState.tributes} onClose={() => setShowMap(false)} />}
        
        {showSettings && (
            <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
                 <div className="bg-panel border border-gray-600 rounded-xl w-full max-w-md p-6">
                     <h3 className="text-gold font-bold uppercase mb-4">Settings</h3>
                     <div className="space-y-4">
                         <div>
                             <label className="text-xs uppercase text-gray-500 mb-1 block">Game Speed (ms)</label>
                             <input 
                                type="range" min="100" max="3000" step="100" 
                                value={gameState.settings.gameSpeed}
                                onChange={(e) => setGameState(prev => ({...prev, settings: {...prev.settings, gameSpeed: parseInt(e.target.value)}}))}
                                className="w-full accent-gold"
                             />
                             <div className="text-right text-xs text-gray-300">{gameState.settings.gameSpeed}ms</div>
                         </div>
                     </div>
                     <button onClick={() => setShowSettings(false)} className="mt-6 w-full py-2 bg-gray-800 text-white rounded">Close</button>
                 </div>
            </div>
        )}

        {showHowToPlay && (
            <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
                <div className="bg-panel border border-gold rounded-xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
                    <h2 className="font-display text-2xl text-gold mb-4 uppercase font-bold">Training Guide</h2>
                    <div className="space-y-4 text-gray-300 text-sm font-mono">
                        <p>Welcome to the Battle Royale Simulator v3.1.</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong className="text-white">Betting:</strong> Place a bet on a tribute during the Reaping. Check their Odds!</li>
                            <li><strong className="text-white">Map System:</strong> Tributes move on a Hex grid. They must be adjacent to interact.</li>
                            <li><strong className="text-white">Bloodbath:</strong> The start is now extremely lethal. 60% of events are fatal.</li>
                            <li><strong className="text-white">Training:</strong> A 3-day pre-game phase to build stats and alliances.</li>
                            <li><strong className="text-white">Traits & Synergies:</strong> Combinations like "Coward + Friendly" create unique behaviors.</li>
                        </ul>
                        <button onClick={() => setShowHowToPlay(false)} className="mt-6 w-full py-2 bg-gray-800 hover:bg-gold hover:text-black font-bold uppercase rounded transition-colors">Close Guide</button>
                    </div>
                </div>
            </div>
        )}

        {/* Setup Phase */}
        {gameState.phase === 'Setup' && (
             <div className="fixed inset-0 z-40 bg-gamemaker flex flex-col items-center justify-center p-4">
                 <div className="max-w-7xl w-full h-full max-h-[95vh] bg-panel border border-gray-800 rounded-2xl p-6 shadow-2xl animate-fade-in flex flex-col">
                     <div className="flex justify-between items-center mb-6">
                         <div>
                            <h1 className="font-display text-4xl font-black text-white uppercase tracking-wider">The Reaping</h1>
                            <p className="text-gray-500 font-mono text-sm">Configure Simulation</p>
                         </div>
                         <div className="flex gap-4">
                             <div className="bg-gray-800 p-2 rounded border border-gray-700 text-xs flex gap-4">
                                 <label className="flex items-center gap-2">
                                     <span className="text-gray-400">Lethality</span>
                                     <input 
                                        type="range" min="0.5" max="2.0" step="0.1" 
                                        value={gameState.settings.fatalityRate}
                                        onChange={(e) => setGameState(prev => ({...prev, settings: {...prev.settings, fatalityRate: parseFloat(e.target.value)}}))}
                                        className="accent-gold w-20"
                                     />
                                 </label>
                             </div>
                             <button onClick={() => setGameState(prev => ({ ...prev, tributes: generateTributes() }))} className="px-4 py-2 border border-gold text-gold hover:bg-gold hover:text-black rounded text-xs uppercase font-bold transition-all">
                                 Regenerate Tributes
                             </button>
                         </div>
                     </div>
                     <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 mb-6 grid grid-cols-1 gap-4">
                         <div className="text-gray-400 font-mono text-center mt-20">
                            Tributes Generated. AI Odds Calculation Complete. Review in next step.
                         </div>
                     </div>
                     <button onClick={() => setGameState(prev => ({ ...prev, phase: 'Reaping' }))} className="w-full py-3 bg-gold hover:bg-yellow-400 text-black font-display font-black text-lg uppercase tracking-[0.2em] rounded-xl shadow-[0_0_20px_rgba(251,191,36,0.4)] transition-all">
                         Proceed to Betting
                     </button>
                 </div>
             </div>
        )}

        {/* Header */}
        <header className="h-16 shrink-0 bg-panel border-b border-gray-800 flex items-center justify-between px-6 shadow-md z-20 relative">
            <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center">
                     <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
                </div>
                <div>
                    <h1 className="font-display font-bold text-lg text-gray-100 tracking-wider uppercase">Battle Royale</h1>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500 uppercase">
                        <span>{gameState.phase} {gameState.phase === 'Training' ? `Day ${gameState.day + 1}` : (gameState.day > 0 ? `Day ${gameState.day}` : '')}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-8">
                 <div className="hidden lg:flex items-center gap-4">
                    <div className="text-center">
                        <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Funds</div>
                        <div className="font-display font-bold text-xl text-blue-400">{gameState.sponsorPoints}</div>
                    </div>
                    <button onClick={() => setSponsorMode(!sponsorMode)} className={`px-3 py-1 rounded border text-[10px] font-mono uppercase font-bold transition-all ${sponsorMode ? 'bg-blue-900/50 border-blue-500 text-blue-200' : 'bg-gray-900/50 border-gray-700 text-gray-500'}`}>
                        {sponsorMode ? 'Sponsor: ON' : 'Sponsor: OFF'}
                    </button>
                    <button onClick={() => setShowMap(true)} className="px-3 py-1 rounded border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 text-[10px] font-mono uppercase font-bold">
                        Map
                    </button>
                    <button onClick={() => setShowRelationships(true)} className="px-3 py-1 rounded border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 text-[10px] font-mono uppercase font-bold">
                        Intel
                    </button>
                 </div>
                 <div className="w-px h-8 bg-gray-800 hidden lg:block"></div>
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

            <div className="flex items-center gap-3">
                <button onClick={() => setShowSettings(!showSettings)} className="p-2 text-gray-400 hover:text-white">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </button>

                {!['Winner', 'Setup', 'Reaping'].includes(gameState.phase) && (
                     <button 
                        onClick={() => setGameState(prev => ({ ...prev, isAutoPlaying: !prev.isAutoPlaying }))}
                        className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-full font-mono font-bold uppercase text-xs tracking-widest transition-all border ${gameState.isAutoPlaying ? 'bg-red-900/50 border-red-500 text-red-200' : 'bg-gray-800 border-gray-600 text-gray-400'}`}
                     >
                         {gameState.isAutoPlaying ? '■ Stop' : '▶ Auto'}
                     </button>
                )}

                <button 
                    onClick={advancePhase}
                    disabled={gameState.phase === 'Winner' || gameState.phase === 'Setup'}
                    className={`hidden md:flex items-center gap-2 px-6 py-2 rounded-full font-mono font-bold uppercase text-xs tracking-widest transition-all ${gameState.phase === 'Winner' || gameState.phase === 'Setup' ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-white text-black hover:bg-gold'}`}
                >
                    {gameState.phase === 'Reaping' ? 'Start Training' : (gameState.phase === 'Training' && gameState.day >= 3 ? 'Start Bloodbath' : 'Proceed')}
                </button>
            </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex overflow-hidden relative">
            <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
            
            {gameState.phase === 'Day' && gameState.currentWeather === 'Rain' && <div className="absolute inset-0 pointer-events-none bg-blue-900/10 z-0 animate-pulse-slow"></div>}
            
            {gameState.phase === 'Winner' && (
                <div className="w-full h-full flex flex-col items-center justify-center z-20">
                    <StatsModal 
                        winner={gameState.tributes.find(t => t.status === TributeStatus.Alive) || gameState.tributes[0]} 
                        duration={gameState.day} 
                        tributes={gameState.tributes}
                        history={gameState.history}
                        onRestart={handleRestart}
                    />
                </div>
            )}

            {gameState.phase === 'Fallen' ? (
                 <div className="w-full flex-1 relative z-10">
                    <DeathRecap 
                        fallen={gameState.fallenTributes} 
                        allTributes={gameState.tributes}
                        onNext={advancePhase} 
                    />
                 </div>
            ) : (
                <div className="w-full h-full flex flex-col lg:flex-row gap-6 p-6 relative z-10">
                    {/* Tributes Grid */}
                    <div className="flex-1 lg:flex-[2] flex flex-col min-h-0">
                        <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
                             <div className="flex items-center gap-4">
                                 <h2 className="font-display text-white text-xl font-bold">
                                     {gameState.phase === 'Reaping' ? 'Place Your Bets' : 'Tributes'}
                                 </h2>
                                 {gameState.userBet && (
                                     <span className="text-xs font-mono text-gold border border-gold/30 rounded px-2 py-1">
                                         Bet Placed on: {gameState.tributes.find(t => t.id === gameState.userBet)?.name}
                                     </span>
                                 )}
                             </div>
                             <div className="flex items-center gap-2">
                                <button onClick={() => setShowAliveOnly(!showAliveOnly)} className={`text-[10px] uppercase font-bold px-2 py-1 rounded border ${showAliveOnly ? 'bg-green-900 border-green-600 text-green-100' : 'bg-transparent border-gray-700 text-gray-500'}`}>
                                    {showAliveOnly ? 'Alive Only' : 'Show All'}
                                </button>
                             </div>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3 pb-4">
                                {displayedTributes.map(t => (
                                <TributeCard 
                                    key={t.id} 
                                    tribute={t} 
                                    onSponsor={handleSponsor}
                                    onBet={handleBet}
                                    canSponsor={gameState.sponsorPoints >= 25 && t.status === TributeStatus.Alive}
                                    sponsorMode={sponsorMode}
                                    showOdds={gameState.phase === 'Reaping' || gameState.phase === 'Training'}
                                    isUserBet={gameState.userBet === t.id}
                                />
                                ))}
                            </div>
                        </div>
                        
                        {sponsorMode && (
                            <div className="mt-4 p-4 bg-gray-900/80 border border-blue-900 rounded-xl animate-fade-in">
                                <div className="text-[10px] font-mono uppercase text-blue-400 font-bold mb-2">Gamemaker Console</div>
                                <div className="flex gap-2">
                                    <button onClick={() => triggerArenaEvent('Rain', 50)} className="px-3 py-2 bg-blue-900/30 border border-blue-800 rounded text-xs text-blue-200 hover:bg-blue-800">Trigger Rain (50)</button>
                                    <button onClick={() => triggerArenaEvent('Mutts', 200)} className="px-3 py-2 bg-red-900/30 border border-red-800 rounded text-xs text-red-200 hover:bg-red-800">Release Mutts (200)</button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Logs */}
                    <div className="h-[40vh] lg:h-auto lg:flex-1 flex flex-col min-h-0">
                        <GameLog 
                            logs={gameState.logs} 
                            phase={gameState.phase} 
                            day={gameState.day}
                            history={gameState.history}
                        />
                    </div>

                    {/* Mobile FAB */}
                    <button 
                        onClick={advancePhase}
                        disabled={gameState.phase === 'Winner'}
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
