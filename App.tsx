

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, TributeStatus, Tribute, EventType } from './types';
import { generateTributes, simulatePhase, simulateTraining, recalculateAllOdds, advanceWeather } from './services/gameLogic';
import { TributeCard } from './components/TributeCard';
import { GameLog } from './components/GameLog';
import { DeathRecap } from './components/DeathRecap';
import { StatsModal } from './components/StatsModal';
import { RelationshipGrid } from './components/RelationshipGrid';
import { MapModal } from './components/MapModal';

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
    weatherDuration: 0,
    settings: {
        gameSpeed: 1500, 
        fatalityRate: 1.0,
        enableWeather: true
    }
  });

  const [sponsorMode, setSponsorMode] = useState(false);
  const [sponsorItem, setSponsorItem] = useState<string>('Food');
  const [showAliveOnly, setShowAliveOnly] = useState(false);
  const [showRelationships, setShowRelationships] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [selectedTributeId, setSelectedTributeId] = useState<string | null>(null);
  const [roundDeaths, setRoundDeaths] = useState<Tribute[]>([]);
  const [pendingPhase, setPendingPhase] = useState<GameState['phase'] | null>(null);
  
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (gameState.tributes.length === 0) {
        setGameState(prev => ({ ...prev, tributes: generateTributes() }));
    }
  }, []);

  const runGameStep = useCallback(() => {
    setGameState(prev => {
      // Game Over Check
      const aliveCount = prev.tributes.filter(t => t.status === TributeStatus.Alive).length;
      if (aliveCount <= 1 && prev.phase !== 'Setup' && prev.phase !== 'Reaping' && prev.phase !== 'Training') {
         return { ...prev, phase: 'Winner', gameRunning: false };
      }

      // Reaping to Training
      if (prev.phase === 'Reaping') {
          const newLog = { id: 'reaping', text: 'The Tributes have been reaped. Let the training begin!', type: EventType.Reaping, day: 0, phase: 'Reaping' };
          return { 
            ...prev, 
            phase: 'Training', 
            logs: [...prev.logs, newLog],
            // Capture Reaping logs into history so they aren't lost
            history: [...prev.history, { phase: 'Reaping', day: 0, logs: [...prev.logs, newLog] }]
          };
      }

      // Training to Bloodbath
      if (prev.phase === 'Training') {
          const { updatedTributes, logs } = simulateTraining(prev.tributes);
          const withOdds = recalculateAllOdds(updatedTributes);
          
          // Archive Training logs
          const trainingHistory = { phase: 'Training', day: 0, logs: logs };

          return {
             ...prev,
             tributes: withOdds,
             phase: 'Bloodbath',
             day: 1,
             logs: [...prev.logs, ...logs],
             history: [...prev.history, trainingHistory],
             daysSinceLastDeath: 0
          };
      }

      // Main Simulation Phases
      let nextPhase = prev.phase;
      let nextDay = prev.day;
      let nextWeather = prev.currentWeather;
      let nextWeatherDuration = prev.weatherDuration;
      
      // Weather Logic
      if (prev.settings.enableWeather) {
          if (nextWeatherDuration <= 0) {
              nextWeather = advanceWeather(prev.currentWeather);
              nextWeatherDuration = Math.floor(Math.random() * 3) + 2; // Lasts 2-4 phases
          } else {
              nextWeatherDuration--;
          }
      }

      if (prev.phase === 'Bloodbath') {
          nextPhase = 'Day';
      } else if (prev.phase === 'Day') {
          nextPhase = 'Night';
      } else if (prev.phase === 'Night') {
          nextPhase = 'Day';
          nextDay += 1;
      }

      const res = simulatePhase(
          prev.tributes, 
          prev.phase as 'Bloodbath' | 'Day' | 'Night',
          prev.daysSinceLastDeath,
          prev.day,
          prev.minDays,
          prev.maxDays,
          nextWeather,
          prev.settings.fatalityRate,
          prev.settings.enableWeather
      );

      const newState = { ...prev };
      newState.tributes = res.updatedTributes;
      newState.logs = [...prev.logs, ...res.logs]; 
      newState.currentWeather = nextWeather;
      newState.weatherDuration = nextWeatherDuration;
      
      // Save to History immediately so Timeline has it
      newState.history = [...prev.history, { phase: prev.phase, day: prev.day, logs: res.logs }];
      
      if (res.deathsInPhase > 0) {
          newState.daysSinceLastDeath = 0;
          newState.fallenTributes = [...prev.fallenTributes, ...res.fallen];
          
          // Interrupt
          setRoundDeaths(res.fallen);
          setPendingPhase(nextPhase);
          newState.phase = 'Fallen';
          newState.gameRunning = false;
          if (nextPhase === 'Day' && prev.phase === 'Night') newState.day = nextDay;
          
          return newState;
      } else {
          newState.daysSinceLastDeath += 1;
          newState.phase = nextPhase;
          newState.day = nextDay;
      }
      
      newState.totalEvents += res.logs.length;
      return newState;
    });
  }, []);

  useEffect(() => {
    if (gameState.gameRunning && gameState.phase !== 'Setup' && gameState.phase !== 'Winner' && gameState.phase !== 'Fallen') {
        timerRef.current = setTimeout(runGameStep, gameState.settings.gameSpeed);
    }
    return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [gameState.gameRunning, gameState.phase, runGameStep, gameState.settings.gameSpeed]);

  const handleResume = () => {
      if (gameState.phase === 'Fallen' && pendingPhase) {
          const nextPhase = pendingPhase;
          setGameState(prev => ({ ...prev, phase: nextPhase, gameRunning: true }));
          setRoundDeaths([]);
          setPendingPhase(null);
      } else {
          setGameState(prev => ({ ...prev, gameRunning: true }));
      }
  };

  const handleSponsor = (id: string) => {
      const cost = 25;
      if (gameState.sponsorPoints >= cost) {
          setGameState(prev => {
              const target = prev.tributes.find(t => t.id === id);
              if (!target || target.status === TributeStatus.Dead) return prev;

              const updated = prev.tributes.map(t => {
                  if (t.id === id) {
                      return { ...t, inventory: [...t.inventory, sponsorItem] };
                  }
                  return t;
              });
              return { 
                  ...prev, 
                  tributes: updated, 
                  sponsorPoints: prev.sponsorPoints - cost,
                  logs: [...prev.logs, { id: crypto.randomUUID(), text: `A silver parachute brings a <b>${sponsorItem}</b> to the arena.`, type: EventType.Day, day: prev.day, phase: prev.phase }]
               };
          });
      }
  };

  const activeTributes = showAliveOnly 
      ? gameState.tributes.filter(t => t.status === TributeStatus.Alive)
      : gameState.tributes;

  const getBackgroundClass = () => {
      switch(gameState.phase) {
          case 'Bloodbath': return 'bg-red-950/20';
          case 'Night': return 'bg-indigo-950/30';
          default: return 'bg-gray-900';
      }
  };

  return (
    <div className={`min-h-screen ${getBackgroundClass()} transition-colors duration-1000 text-gray-200 font-sans selection:bg-gold selection:text-black`}>
        {/* Setup Screen */}
        {gameState.phase === 'Setup' && (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-6">
                <h1 className="font-display text-6xl text-gold font-bold mb-8 tracking-widest uppercase">Battle Royale</h1>
                <div className="flex gap-4">
                    <button onClick={() => setGameState(p => ({...p, phase: 'Reaping', gameRunning: true}))} className="bg-gold text-black px-8 py-3 rounded font-bold uppercase hover:scale-105 transition-transform">Start Simulation</button>
                    <button onClick={() => setGameState(p => ({...p, tributes: generateTributes()}))} className="border border-gray-600 px-8 py-3 rounded font-bold uppercase hover:bg-gray-800">Reroll Tributes</button>
                </div>
            </div>
        )}

        {/* Modals */}
        {gameState.phase === 'Fallen' && (
            <div className="fixed inset-0 z-40 bg-black/90">
                <DeathRecap fallen={roundDeaths} allTributes={gameState.tributes} onNext={handleResume} />
            </div>
        )}

        {gameState.phase === 'Winner' && (
             <StatsModal 
                winner={gameState.tributes.find(t => t.status === TributeStatus.Alive) || gameState.fallenTributes[gameState.fallenTributes.length - 1]} 
                duration={gameState.day}
                tributes={gameState.tributes}
                history={gameState.history}
                onRestart={() => window.location.reload()} 
             />
        )}
        
        {showRelationships && <RelationshipGrid tributes={gameState.tributes} onClose={() => setShowRelationships(false)} />}
        {showMap && <MapModal tributes={gameState.tributes} onClose={() => setShowMap(false)} />}

        {/* Header */}
        <header className="fixed top-0 left-0 right-0 h-16 bg-panel border-b border-gray-800 flex items-center justify-between px-6 z-30 shadow-lg">
             <div className="flex items-center gap-4">
                 <h1 className="font-display text-xl text-white font-bold tracking-widest">HG SIM</h1>
                 <div className="h-6 w-px bg-gray-700"></div>
                 <div className="flex items-center gap-2 text-xs font-mono">
                     <span className={gameState.gameRunning ? "text-green-500 animate-pulse" : "text-red-500"}>● {gameState.gameRunning ? "RUNNING" : "PAUSED"}</span>
                     <span className="text-gray-500">Day {gameState.day} - {gameState.phase}</span>
                     <span className="text-gray-500">Alive: {gameState.tributes.filter(t => t.status === TributeStatus.Alive).length}</span>
                     {gameState.settings.enableWeather && <span className="text-blue-400">[{gameState.currentWeather}]</span>}
                 </div>
             </div>

             <div className="flex items-center gap-3">
                 <button onClick={() => setGameState(p => ({...p, gameRunning: !p.gameRunning}))} className="bg-gray-800 p-2 rounded hover:bg-gray-700 text-gold">
                    {gameState.gameRunning ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    ) : (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                    )}
                 </button>
                 <button onClick={() => setShowMap(true)} className="p-2 text-gray-400 hover:text-white" title="Map">
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                 </button>
                 <button onClick={() => setShowRelationships(true)} className="p-2 text-gray-400 hover:text-white" title="Relationships">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                 </button>
                 <div className="h-6 w-px bg-gray-700"></div>
                 <div className="flex items-center gap-1 bg-gray-800 px-3 py-1 rounded-full border border-gold/30">
                     <span className="text-gold font-bold text-sm">{gameState.sponsorPoints}</span>
                     <span className="text-[10px] text-gray-500 uppercase">CP</span>
                 </div>
                 
                 {sponsorMode ? (
                     <div className="flex items-center gap-1 bg-gray-800 rounded p-1">
                        <select 
                            value={sponsorItem} 
                            onChange={(e) => setSponsorItem(e.target.value)}
                            className="bg-gray-900 text-xs text-white border border-gray-700 rounded px-1 py-1 outline-none"
                        >
                            <option value="Food">Food</option>
                            <option value="Water">Water</option>
                            <option value="Medicine">Medicine</option>
                            <option value="Bandages">Bandages</option>
                            <option value="Knife">Knife</option>
                            <option value="Spear">Spear</option>
                        </select>
                        <button onClick={() => setSponsorMode(false)} className="text-red-400 px-2 text-xs font-bold">X</button>
                     </div>
                 ) : (
                    <button onClick={() => setSponsorMode(true)} className="p-2 text-gray-400 hover:text-white text-xs font-bold border border-gray-700 rounded hover:bg-gray-800">
                        Gift
                    </button>
                 )}
             </div>
        </header>

        {/* Main Content */}
        <div className="pt-20 pb-4 px-4 h-screen flex gap-4">
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex gap-2">
                        <button onClick={() => setShowAliveOnly(false)} className={`px-3 py-1 text-xs font-bold rounded ${!showAliveOnly ? 'bg-gray-700 text-white' : 'text-gray-500'}`}>ALL</button>
                        <button onClick={() => setShowAliveOnly(true)} className={`px-3 py-1 text-xs font-bold rounded ${showAliveOnly ? 'bg-gray-700 text-white' : 'text-gray-500'}`}>ALIVE</button>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {activeTributes.map(t => (
                        <TributeCard 
                            key={t.id} 
                            tribute={t} 
                            sponsorMode={sponsorMode}
                            canSponsor={gameState.sponsorPoints >= 25}
                            onSponsor={handleSponsor}
                            isUserBet={gameState.userBet === t.id}
                            onSelect={setSelectedTributeId}
                            isSelected={selectedTributeId === t.id}
                            showOdds={true}
                            onBet={(id) => setGameState(p => ({...p, userBet: id}))}
                        />
                    ))}
                </div>
            </div>

            <div className="w-96 hidden md:flex flex-col gap-4">
                <GameLog 
                    logs={gameState.logs} 
                    phase={gameState.phase} 
                    day={gameState.day} 
                    history={gameState.history}
                    selectedTributeId={selectedTributeId}
                />
            </div>
        </div>
    </div>
  );
};

export default App;