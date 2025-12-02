import { useEffect, useState } from 'react';

import { Check, Plus, TrendingDown, TrendingUp, X } from 'lucide-react';

type PlayerData = { name: string; contributed: number; withdrawn: number };
type GameState = {
  players: PlayerData[];
  dealerIndex: number;
  currentTurn: number;
  pot: number;
  round: number;
  started: boolean;
};

const defaultState: GameState = {
  players: [],
  dealerIndex: 0,
  currentTurn: 0,
  pot: 0,
  round: 1,
  started: false,
};

export default function App() {
  const [state, setState] = useState<GameState>(() => {
    try {
      const saved = localStorage.getItem('potGameState');
      return saved ? JSON.parse(saved) : defaultState;
    } catch (err) {
      console.error('Failed to load game state:', err);
      return defaultState;
    }
  });
  const [newPlayer, setNewPlayer] = useState('');
  const [bet, setBet] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem('potGameState', JSON.stringify(state));
    } catch (err) {
      console.error('Failed to save game state:', err);
    }
  }, [state]);

  const updateState = (updates: Partial<GameState>) =>
    setState((prev) => ({ ...prev, ...updates }));

  const updatePlayers = (fn: (players: PlayerData[]) => PlayerData[]) =>
    setState((prev) => ({ ...prev, players: fn(prev.players) }));

  const addPlayer = () => {
    if (!newPlayer.trim()) return;
    updatePlayers((p) => [...p, { name: newPlayer.trim(), contributed: 0, withdrawn: 0 }]);
    setNewPlayer('');
  };

  const removePlayer = (index: number) => updatePlayers((p) => p.filter((_, i) => i !== index));

  const startGame = () => {
    if (state.players.length < 2) {
      alert('You need at least 2 players to start.');
      return;
    }
    updateState({
      started: true,
      pot: state.players.length,
      players: state.players.map((p) => ({ ...p, contributed: 1 })),
    });
  };

  const startNewRound = () => {
    const nextTurn = (state.currentTurn + 1) % state.players.length;
    updateState({
      pot: state.pot + state.players.length,
      round: state.round + 1,
      currentTurn: nextTurn,
      players: state.players.map((p) => ({ ...p, contributed: p.contributed + 1 })),
    });
    setBet('');
  };

  const playerWins = () => {
    const betAmount = Number(bet);
    if (!betAmount || betAmount <= 0) {
      alert('Enter a bet amount to win');
      return;
    }
    const nextDealer = (state.dealerIndex + 1) % state.players.length;
    const winnings = betAmount * 2;
    updateState({
      dealerIndex: nextDealer,
      pot: state.pot - betAmount,
      players: state.players.map((p, i) => ({
        ...p,
        contributed: i === state.currentTurn ? p.contributed + betAmount : p.contributed,
        withdrawn: i === state.currentTurn ? p.withdrawn + winnings : p.withdrawn,
      })),
    });
    setBet('');
  };

  const playerLoses = () => {
    const betAmount = Number(bet);
    if (!betAmount || betAmount <= 0 || betAmount > state.pot) return;
    const nextTurn = (state.currentTurn + 1) % state.players.length;
    updateState({
      pot: state.pot + betAmount + state.players.length,
      currentTurn: nextTurn,
      players: state.players.map((p, i) => ({
        ...p,
        contributed: i === state.currentTurn ? p.contributed + 1 + betAmount : p.contributed + 1,
      })),
    });
    setBet('');
  };

  const resetGame = () => {
    if (confirm('Reset the game? All progress will be lost.')) {
      setState(defaultState);
      localStorage.removeItem('potGameState');
    }
  };

  const currentPlayer = state.players[state.currentTurn]?.name ?? '—';
  const dealer = state.players[state.dealerIndex]?.name ?? '—';
  const getBalance = (p: PlayerData) => p.withdrawn - p.contributed;

  if (!state.started) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-3">Pot Game</h1>
            <p className="text-slate-400">Track your winnings with friends</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-6 space-y-6 shadow-2xl">
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-3">Add Players</label>
              <div className="flex gap-2">
                <input
                  value={newPlayer}
                  onChange={(e) => setNewPlayer(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
                  placeholder="Enter player name..."
                  className="flex-1 h-11 rounded-xl border border-slate-600 bg-slate-900/50 px-4 text-base text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <button
                  onClick={addPlayer}
                  className="h-11 px-5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-900/30"
                >
                  Add
                </button>
              </div>
            </div>

            {state.players.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-3">
                  Players ({state.players.length})
                </label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {state.players.map((p, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center p-3 bg-slate-900/50 border border-slate-700/50 rounded-xl hover:bg-slate-700/30 transition-all group"
                    >
                      <span className="text-slate-100 font-medium">{p.name}</span>
                      <button
                        onClick={() => removePlayer(i)}
                        className="text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                onClick={startGame}
                disabled={state.players.length < 2}
                className={`w-full h-12 rounded-xl text-sm font-bold transition-all shadow-lg ${state.players.length < 2
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 active:scale-98 shadow-blue-900/30'
                  }`}
              >
                Start Game
              </button>
              {state.players.length < 2 && (
                <p className="text-center text-xs text-slate-500 mt-3">
                  Add at least 2 players to begin
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur border-b border-slate-700/50 px-4 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-white">Pot Game</h1>
            <p className="text-xs text-slate-400 mt-0.5">Round {state.round}</p>
          </div>
          <button
            onClick={resetGame}
            className="px-4 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 text-sm font-medium border border-slate-600 transition-all"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="px-4 py-4 border-b border-slate-700/50">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-gradient-to-br from-blue-600/20 to-blue-700/10 border border-blue-500/30 rounded-xl p-4">
            <p className="text-xs font-semibold text-blue-300 uppercase tracking-wide mb-1">
              Current Turn
            </p>
            <p className="text-2xl font-bold text-white truncate">{currentPlayer}</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-600/20 to-emerald-700/10 border border-emerald-500/30 rounded-xl p-4">
            <p className="text-xs font-semibold text-emerald-300 uppercase tracking-wide mb-1">
              Pot
            </p>
            <p className="text-2xl font-bold text-white">£{state.pot}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-600/20 to-purple-700/10 border border-purple-500/30 rounded-xl p-4">
            <p className="text-xs font-semibold text-purple-300 uppercase tracking-wide mb-1">
              Dealer
            </p>
            <p className="text-2xl font-bold text-white truncate">{dealer}</p>
          </div>

          <div className="bg-gradient-to-br from-amber-600/20 to-amber-700/10 border border-amber-500/30 rounded-xl p-4">
            <p className="text-xs font-semibold text-amber-300 uppercase tracking-wide mb-1">
              Max Bet
            </p>
            <p className="text-2xl font-bold text-white">£{state.pot}</p>
          </div>
        </div>
      </div>

      {/* Players List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
        <div className="space-y-3 pb-4">
          {state.players.map((p, i) => {
            const balance = getBalance(p);
            const isCurrentPlayer = i === state.currentTurn;
            const isDealer = i === state.dealerIndex;

            return (
              <div
                key={p.name}
                className={`rounded-xl border transition-all ${isCurrentPlayer
                    ? 'bg-gradient-to-r from-blue-600/20 to-blue-700/10 border-blue-500/50 shadow-lg shadow-blue-900/20'
                    : 'bg-slate-800/30 border-slate-700/50 hover:border-slate-600/50'
                  }`}
              >
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-bold text-white">{p.name}</span>
                      {isDealer && (
                        <span className="text-xs bg-purple-600/80 text-white px-2.5 py-0.5 rounded-full font-bold">
                          DEALER
                        </span>
                      )}
                      {isCurrentPlayer && (
                        <span className="text-xs bg-blue-600 text-white px-2.5 py-0.5 rounded-full font-bold animate-pulse">
                          YOUR TURN
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {balance !== 0 &&
                        (balance > 0 ? (
                          <TrendingUp size={18} className="text-emerald-400" />
                        ) : (
                          <TrendingDown size={18} className="text-red-400" />
                        ))}
                      <p
                        className={`text-xl font-bold ${balance > 0
                            ? 'text-emerald-400'
                            : balance < 0
                              ? 'text-red-400'
                              : 'text-slate-400'
                          }`}
                      >
                        {balance > 0 ? '+' : ''}£{Math.abs(balance)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 text-xs">
                    {p.contributed > 0 && (
                      <span className="text-slate-400">
                        <span className="text-slate-500">In:</span>{' '}
                        <span className="text-red-400 font-semibold">£{p.contributed}</span>
                      </span>
                    )}
                    {p.withdrawn > 0 && (
                      <span className="text-slate-400">
                        <span className="text-slate-500">Out:</span>{' '}
                        <span className="text-emerald-400 font-semibold">£{p.withdrawn}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Panel */}
      <div className="bg-slate-800/80 backdrop-blur border-t border-slate-700/50 px-4 py-4 space-y-3">
        <button
          onClick={startNewRound}
          className="w-full h-12 rounded-xl bg-gradient-to-r from-slate-700 to-slate-600 text-white text-sm font-bold hover:from-slate-600 hover:to-slate-500 active:scale-98 transition-all shadow-lg flex items-center justify-center gap-2"
        >
          <Plus size={18} /> New Round
        </button>

        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Enter bet amount..."
            value={bet}
            onChange={(e) => {
              const num = Number(e.target.value);
              if (!e.target.value || num <= state.pot) setBet(e.target.value);
            }}
            max={state.pot}
            className="flex-1 h-12 rounded-xl border border-slate-600 bg-slate-900/50 px-4 text-base text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          <button
            onClick={() => setBet(state.pot.toString())}
            className="h-12 px-5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-bold border border-slate-600 transition-all"
          >
            Max
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={playerLoses}
            disabled={!bet || Number(bet) <= 0 || Number(bet) > state.pot}
            className="h-12 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-bold hover:from-red-700 hover:to-red-800 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 active:scale-98 transition-all shadow-lg shadow-red-900/30 disabled:shadow-none flex items-center justify-center gap-2"
          >
            <X size={18} /> Lose
          </button>
          <button
            onClick={playerWins}
            disabled={!bet || Number(bet) <= 0}
            className="h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-sm font-bold hover:from-emerald-700 hover:to-emerald-800 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 active:scale-98 transition-all shadow-lg shadow-emerald-900/30 disabled:shadow-none flex items-center justify-center gap-2"
          >
            <Check size={18} /> Win
          </button>
        </div>
      </div>
    </div>
  );
}
