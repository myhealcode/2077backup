
import React, { useState, useEffect, useCallback } from 'react';
import { GameState, User } from './types';
import TheDive from './components/TheDive';
import GameView from './views/GameView';

// 默认特工信息
const DEFAULT_USER: User = {
  email: "GUEST_AGENT",
  isPaid: true,
  gameProgress: 1,
  ownedModules: ["2077_BASE"]
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.THE_DIVE);
  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_USER);

  useEffect(() => {
    const savedProgress = localStorage.getItem('heal_code_progress');
    if (savedProgress) {
      const level = parseInt(savedProgress);
      setCurrentUser(prev => ({ ...prev, gameProgress: level }));
    }
  }, []);

  const handleDiveComplete = useCallback(() => {
    setGameState(GameState.PLAYING);
  }, []);

  const handleUpdateProgress = useCallback((level: number) => {
    setCurrentUser(prev => ({ ...prev, gameProgress: level }));
    localStorage.setItem('heal_code_progress', level.toString());
    console.log(`Progress saved locally: Level ${level}`);
  }, []);

  const handleExit = useCallback(() => {
    // 退出逻辑：重置进度并重新开始
    if (window.confirm("确定要格式化所有记忆（重置进度）吗？")) {
      localStorage.removeItem('heal_code_progress');
      setCurrentUser(DEFAULT_USER);
      setGameState(GameState.THE_DIVE);
    }
  }, []);

  return (
    <div className="min-h-screen w-full bg-black text-green-500 selection:bg-green-500 selection:text-black relative overflow-hidden font-mono">
      {/* 全局背景装饰 */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,0,0.2)_0%,transparent_70%)]"></div>
      </div>

      {gameState === GameState.THE_DIVE && (
        <TheDive onComplete={handleDiveComplete} />
      )}

      {gameState === GameState.PLAYING && (
        <GameView 
          currentUser={currentUser} 
          onProgress={handleUpdateProgress}
          onExit={handleExit}
        />
      )}
    </div>
  );
};

export default App;
