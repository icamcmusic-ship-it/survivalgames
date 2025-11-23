
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, TributeStatus, WeatherType } from './types';
import { generateTributes, simulatePhase, simulateTraining } from './services/gameLogic';
import { TributeCard } from './components/TributeCard';
import { GameLog } from './components/GameLog';
import { DeathRecap } from './components/DeathRecap';
import { StatsModal } from './components/StatsModal';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    tributes: [],
    day: 0,
    phase: 'Setup', // Changed initial phase
    logs: [],
    history: [],
    fallenTributes: [],
    totalEvents: 0,
    gameRunning: false,
    daysSinceLastDeath: 0,
    sponsorPoints: 100,
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

  // Initialize tributes only on mount if empty
  useEffect(() => {
    if (gameState.tributes.length === 0) {
        setGameState(prev => ({ ...prev, tributes: generateTributes() }));
    }
  }, []);

  // --- Auto-Play Loop (Fixed Jitter & Dependencies) ---
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerNextPhase = () => {
      // Wrapper to call the advance function
      advancePhase();
  };

  useEffect(() => {
    if (gameState.isAutoPlaying && gameState.phase !== 'Winner' && gameState.phase !== 'Setup') {
        timerRef.current = setTimeout(triggerNextPhase, gameState.settings.gameSpeed);
    } else {
        if (timerRef.current) clearTimeout(timerRef.current);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [gameState.isAutoPlaying, gameState.phase, gameState.tributes, gameState.day]); // Depends on phase change to re-trigger next step

  // --- Game Logic Controls ---

  const advancePhase = useCallback(() => {
    setGameState(prev => {
        const currentAlive = prev.tributes.filter(t => t.status === TributeStatus.Alive);

        if (currentAlive.length <= 1 && prev.phase !== 'Reaping' && prev.phase !== 'Setup') {
          return { ...prev, phase: 'Winner', isAutoPlaying: false };
        }

        let nextPhase = prev.phase;
        let nextDay = prev.day;
        let showFallen = false;

        switch (prev.phase) {
          case 'Setup':
            nextPhase = 'Reaping';
            break;
          case 'Reaping':
            nextPhase = 'Bloodbath';
            nextDay = 1;
            break;
          case 'Bloodbath':
            showFallen = true;
            nextPhase = 'Day'; 
            break;
          case 'Fallen':
            // Check previous phase from history to determine next
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
           // Fix: Prune history to prevent memory bloat (Keep last 50)
           const newHistory = [...prev.history, { phase: prev.phase, day: prev.day, logs: prev.logs }].slice(-50);
           return {
               ...prev,
               history: newHistory,
               phase: 'Fallen'
           };
        }

        // Determine Weather for the round
        let nextWeather = prev.currentWeather;
        if (prev.settings.enableWeather && nextPhase === 'Day' && Math.random() < 0.3) {
            const weathers: WeatherType[] = ['Clear', 'Rain', 'Heatwave', 'Fog', 'Storm'];
            nextWeather = weathers[Math.floor(Math.random() * weathers.length)];
        } else if (nextPhase === 'Night') {
            nextWeather = 'Clear'; // Nights usually clear unless storm persists
        }

        const result = simulatePhase(
            prev.tributes, 
            nextPhase as any, 
            prev.daysSinceLastDeath,
            nextDay,
            prev.minDays,
            prev.maxDays,
            nextWeather,
            prev.settings.fatalityRate
        );

        let newHistory = [...prev.history];
        if (prev.phase === 'Reaping') {
            newHistory.push({ phase: 'Reaping', day: 0, logs: prev.logs });
        }

        // Add weather log if changed
        if (nextWeather !== prev.currentWeather && nextPhase === 'Day') {
            result.logs.unshift({
                id: `weather-${Date.now()}`,
                text: `<span class="text-blue-300 font-bold uppercase">WEATHER UPDATE:</span> The arena is shifting. ${nextWeather} conditions detected.`,
                type: 'Day' as any
            });
        }

        return {
          ...prev,
          tributes: result.updatedTributes,
          phase: nextPhase as any,
          day: nextDay,
          logs: result.logs,
          history: newHistory,
          fallenTributes: result.fallen,
          totalEvents: prev.totalEvents + result.logs.length,
          daysSinceLastDeath: result.deathsInPhase > 0 ? 0 : prev.daysSinceLastDeath + (nextPhase === 'Day' ? 1 : 0),
          sponsorPoints: prev.sponsorPoints + 25,
          currentWeather: nextWeather
        };
    });
  }, []);


  const handleRestart = () => {
    setGameState({
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
        minDays: 5,
        maxDays: 10,
        isAutoPlaying: false,
        currentWeather: 'Clear',
        settings: { ...gameState.settings }
    });
    setSponsorMode(false);
  };

  // --- Actions ---

  const handleSimulateTraining = () => {
      const logs = simulateTraining(gameState.tributes);
      setGameState(prev => ({
          ...prev,
          logs: [...prev.logs, ...logs]
      }));
  };

  const handleSponsor = (tributeId: string) => {
      if (gameState.sponsorPoints < 25) return;

      setGameState(prev => {
          const updatedTributes = prev.tributes.map(t => {
              if (t.id === tributeId && t.status === TributeStatus.Alive) {
                   const items = ['Bread', 'Water', 'Bandages', 'Antidote', 'Spear'];
                   const item = items[Math.floor(Math.random() * items.length)];
                   return {
                       ...t,
                       inventory: [...t.inventory, item],
                       stats: { ...t.stats, sanity: Math.min(100, t.stats.sanity + 10), hunger: Math.max(0, t.stats.hunger - 20) }
                   };
              }
              return t;
          });
          
          const targetName = updatedTributes.find(t => t.id === tributeId)?.name;
          const newLog = {
              id: `sponsor-${Date.now()}`,
              text: `<span class="text-blue-400 font-bold">SPONSOR:</span> A silver parachute delivers a <span class="text-white">${updatedTributes.find(t => t.id === tributeId)?.inventory.slice(-1)[0]}</span> to <span class="text-gold">${targetName}</span>.`,
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
          logs: [...prev.logs, { id: `gm-${Date.now()}`, text: `<span class="text-purple-500 font-bold">GAMEMAKER INTERVENTION:</span> ${text}`, type: 'Arena' as any }],
          currentWeather: type === 'Rain' ? 'Rain' : prev.currentWeather
      }));
  };

  // --- View Helpers ---
  const aliveCount = gameState.tributes.filter(t => t.status === TributeStatus.Alive).length;
  const deadCount = gameState.tributes.length - aliveCount;
  const displayedTributes = showAliveOnly 
    ? gameState.tributes.filter(t => t.status === TributeStatus.Alive)
    : gameState.tributes;

  return (
    <div className="h-screen flex flex-col bg-gamemaker font-sans overflow-hidden selection:bg-gold selection:text-black">
        
        {/* How To Play Modal */}
        {showHowToPlay && (
            <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
                <div className="bg-panel border border-gold rounded-xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
                    <h2 className="font-display text-2xl text-gold mb-4 uppercase font-bold">Training Guide</h2>
                    <div className="space-y-4 text-gray-300 text-sm font-mono">
                        <p>Welcome to the Battle Royale Simulator. You act as the Gamemaker, observing 24 tributes fight to the death.</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong className="text-white">Traits:</strong> Tributes have personality traits. <span className="text-red-400">Ruthless</span> tributes kill more, <span className="text-blue-400">Survivalists</span> find food. Some traits have synergies (e.g., Coward + Friendly).</li>
                            <li><strong className="text-white">Stats:</strong> Health, Hunger, Sanity, and Exhaustion drive behavior. Starving tributes take desperate risks. Low sanity causes hallucinations.</li>
                            <li><strong className="text-white">Sponsoring:</strong> Enable "Sponsor Mode" to send items. Use your points wisely.</li>
                            <li><strong className="text-white">Gamemaker Console:</strong> Spend points to alter the weather or trigger arena events.</li>
                        </ul>
                        <p className="mt-4">Click "Proceed" to advance time, or "Auto" to watch the chaos unfold.</p>
                    </div>
                    <button onClick={() => setShowHowToPlay(false)} className="mt-6 w-full py-2 bg-gray-800 hover:bg-gold hover:text-black font-bold uppercase rounded transition-colors">Close Guide</button>
                </div>
            </div>
        )}

        {/* Setup Phase Screen */}
        {gameState.phase === 'Setup' && (
             <div className="fixed inset-0 z-40 bg-gamemaker flex flex-col items-center justify-center p-4">
                 <div className="max-w-4xl w-full bg-panel border border-gray-800 rounded-2xl p-8 shadow-2xl animate-fade-in">
                     <h1 className="font-display text-5xl font-black text-white text-center mb-2 uppercase tracking-wider">The Reaping</h1>
                     <p className="text-center text-gray-500 font-mono mb-8">District Selection & Training Center</p>
                     
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                         <div className="col-span-2 grid grid-cols-4 gap-2 max-h-64 overflow-y-auto custom-scrollbar p-2 bg-black/20 rounded">
                             {gameState.tributes.map(t => (
                                 <div key={t.id} className={`text-xs p-2 rounded border ${t.gender === 'M' ? 'border-blue-900 bg-blue-900/10' : 'border-pink-900 bg-pink-900/10'} text-center`}>
                                     <div className="font-bold text-gray-300">{t.name}</div>
                                     <div className="text-[9px] text-gray-500">{t.traits.join(', ')}</div>
                                 </div>
                             ))}
                         </div>
                         <div className="space-y-4">
                             <div className="bg-gray-800 p-4 rounded border border-gray-700">
                                 <h3 className="font-bold text-gold text-xs uppercase mb-2">Simulation Config</h3>
                                 <div className="space-y-2 text-xs">
                                     <label className="flex items-center justify-between">
                                         <span className="text-gray-400">Fatality Rate</span>
                                         <input 
                                            type="range" min="0.5" max="2.0" step="0.1" 
                                            value={gameState.settings.fatalityRate}
                                            onChange={(e) => setGameState(prev => ({...prev, settings: {...prev.settings, fatalityRate: parseFloat(e.target.value)}}))}
                                            className="accent-gold"
                                         />
                                     </label>
                                     <label className="flex items-center justify-between">
                                         <span className="text-gray-400">Game Speed</span>
                                         <select 
                                            value={gameState.settings.gameSpeed}
                                            onChange={(e) => setGameState(prev => ({...prev, settings: {...prev.settings, gameSpeed: parseInt(e.target.value)}}))}
                                            className="bg-gray-900 border border-gray-700 rounded px-1"
                                         >
                                             <option value="3000">Slow</option>
                                             <option value="2000">Normal</option>
                                             <option value="500">Fast</option>
                                         </select>
                                     </label>
                                 </div>
                             </div>
                             <button onClick={() => setGameState(prev => ({ ...prev, tributes: generateTributes() }))} className="w-full py-2 border border-gray-600 rounded text-gray-400 hover:border-white hover:text-white text-xs uppercase font-bold">
                                 Regenerate Tributes
                             </button>
                             <button onClick={handleSimulateTraining} className="w-full py-2 border border-blue-900 text-blue-500 bg-blue-900/10 hover:bg-blue-900/30 rounded text-xs uppercase font-bold">
                                 Simulate Training (Relationships)
                             </button>
                         </div>
                     </div>
                     
                     <button onClick={() => setGameState(prev => ({ ...prev, phase: 'Reaping', logs: [{ id: 'init', text: "The Tributes rise on their podiums...", type: 'Bloodbath' as any }] }))} className="w-full py-4 bg-gold hover:bg-yellow-400 text-black font-display font-black text-xl uppercase tracking-[0.2em] rounded shadow-[0_0_20px_rgba(251,191,36,0.4)] transition-all transform hover:scale-[1.01]">
                         Begin Simulation
                     </button>
                 </div>
             </div>
        )}
        
        {/* Header / Status Bar */}
        <header className="h-16 shrink-0 bg-panel border-b border-gray-800 flex items-center justify-between px-6 shadow-md z-20 relative">
            <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center">
                     <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
                </div>
                <div>
                    <h1 className="font-display font-bold text-lg text-gray-100 tracking-wider uppercase">Battle Royale</h1>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500 uppercase">
                        <span>Sim v3.0</span>
                        <span className="text-gray-700">•</span>
                        <span>{gameState.phase}</span>
                    </div>
                </div>
            </div>

            {/* Stats Counters */}
            <div className="flex items-center gap-8">
                 <div className="hidden lg:flex items-center gap-4">
                    <div className="text-center group relative cursor-help">
                        <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Funds</div>
                        <div className="font-display font-bold text-xl text-blue-400">{gameState.sponsorPoints}</div>
                    </div>
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
                        {sponsorMode ? 'Sponsor: ON' : 'Sponsor: OFF'}
                    </button>
                    <button onClick={() => setShowHowToPlay(true)} className="text-gray-500 hover:text-white"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></button>
                 </div>

                 <div className="w-px h-8 bg-gray-800 hidden lg:block"></div>
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
                {gameState.phase !== 'Winner' && gameState.phase !== 'Setup' && gameState.phase !== 'Reaping' && (
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

                <button 
                    onClick={advancePhase}
                    disabled={gameState.phase === 'Winner' || gameState.phase === 'Setup'}
                    className={`
                        hidden md:flex items-center gap-2 px-6 py-2 rounded-full font-mono font-bold uppercase text-xs tracking-widest transition-all
                        ${gameState.phase === 'Winner' || gameState.phase === 'Setup'
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

            {/* Weather Overlay */}
            {gameState.phase === 'Day' && gameState.currentWeather === 'Rain' && (
                <div className="absolute inset-0 pointer-events-none bg-blue-900/10 z-0 animate-pulse-slow"></div>
            )}
            {gameState.phase === 'Day' && gameState.currentWeather === 'Heatwave' && (
                <div className="absolute inset-0 pointer-events-none bg-orange-500/10 z-0 mix-blend-overlay"></div>
            )}

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
                        <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
                             <div className="flex items-center gap-4">
                                 <h2 className="font-display text-white text-xl font-bold">Tributes</h2>
                                 <span className="text-xs font-mono text-gray-500 uppercase">{aliveCount} Alive / 24</span>
                             </div>
                             
                             <div className="flex items-center gap-2">
                                {/* Alive Filter */}
                                <button 
                                    onClick={() => setShowAliveOnly(!showAliveOnly)}
                                    className={`text-[10px] uppercase font-bold px-2 py-1 rounded border ${showAliveOnly ? 'bg-green-900 border-green-600 text-green-100' : 'bg-transparent border-gray-700 text-gray-500'}`}
                                >
                                    {showAliveOnly ? 'Showing Alive Only' : 'Show All'}
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
                                    canSponsor={gameState.sponsorPoints >= 25 && t.status === TributeStatus.Alive}
                                    sponsorMode={sponsorMode}
                                />
                                ))}
                            </div>
                        </div>
                        
                        {/* Gamemaker Console (Bottom Left) */}
                        {sponsorMode && (
                            <div className="mt-4 p-4 bg-gray-900/80 border border-blue-900 rounded-xl animate-fade-in">
                                <div className="text-[10px] font-mono uppercase text-blue-400 font-bold mb-2">Gamemaker Console</div>
                                <div className="flex gap-2">
                                    <button onClick={() => triggerArenaEvent('Rain', 50)} className="px-3 py-2 bg-blue-900/30 border border-blue-800 rounded text-xs text-blue-200 hover:bg-blue-800">Trigger Rain (50)</button>
                                    <button onClick={() => triggerArenaEvent('Mutts', 200)} className="px-3 py-2 bg-red-900/30 border border-red-800 rounded text-xs text-red-200 hover:bg-red-800">Release Mutts (200)</button>
                                    <button onClick={() => triggerArenaEvent('Feast', 300)} className="px-3 py-2 bg-orange-900/30 border border-orange-800 rounded text-xs text-orange-200 hover:bg-orange-800">Prepare Feast (300)</button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Logs */}
                    <div className="h-[40vh] lg:h-auto lg:flex-1 flex flex-col min-h-0">
                        <div className="mb-2 flex items-center justify-between text-xs font-mono text-gray-500 uppercase">
                             <span>Current Conditions</span>
                             <span className={`${gameState.currentWeather === 'Clear' ? 'text-gray-400' : 'text-blue-400'}`}>{gameState.currentWeather}</span>
                        </div>
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
