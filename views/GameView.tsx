
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User } from '../types';
import { GoogleGenAI } from "@google/genai";

interface GameViewProps {
  currentUser: User;
  onProgress: (level: number) => void;
  onExit: () => void;
}

const DigitRoller: React.FC<{ value: number; onChange: (val: number) => void; playClick: () => void }> = ({ value, onChange, playClick }) => {
  const digitHeight = 100;

  const handleScroll = (dir: 'up' | 'down') => {
    playClick();
    const next = dir === 'up' ? (value + 1) % 10 : (value + 9) % 10;
    onChange(next);
  };

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-6">
      <button 
        onClick={() => handleScroll('up')}
        className="w-16 h-10 sm:w-20 sm:h-12 flex items-center justify-center border-b-4 border-black bg-gradient-to-b from-[#444] to-[#222] hover:from-[#555] active:translate-y-1 active:border-b-0 transition-all rounded-t-md text-xl text-white/40 hover:text-white shadow-lg"
      >
        ▲
      </button>

      <div 
        className="w-24 sm:w-32 bg-[#050505] border-x-4 border-y-2 border-white/10 rounded-sm shadow-[0_0_50px_rgba(0,0,0,1),inset_0_0_30px_rgba(255,255,255,0.05)] flex items-center justify-center overflow-hidden relative"
        style={{ height: `${digitHeight}px` }}
      >
        <div 
          className="absolute top-0 flex flex-col items-center w-full z-10"
          style={{ 
            transform: `translateY(${-value * digitHeight}px)`, 
            height: `${digitHeight * 10}px`,
            transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' 
          }}
        >
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <div 
              key={n} 
              className="w-full flex items-center justify-center text-6xl sm:text-8xl font-black text-white font-mono leading-none tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]"
              style={{ height: `${digitHeight}px` }}
            >
              {n}
            </div>
          ))}
        </div>
        <div className="absolute inset-0 z-20 pointer-events-none shadow-[inset_0_15px_30px_rgba(0,0,0,0.9),inset_0_-15px_30px_rgba(0,0,0,0.9)]"></div>
        <div className="absolute inset-0 z-30 pointer-events-none bg-gradient-to-tr from-white/5 via-transparent to-transparent opacity-30"></div>
      </div>

      <button 
        onClick={() => handleScroll('down')}
        className="w-16 h-10 sm:w-20 sm:h-12 flex items-center justify-center border-t-4 border-black bg-gradient-t from-[#444] to-[#222] hover:from-[#555] active:-translate-y-1 active:border-t-0 transition-all rounded-b-md text-xl text-white/40 hover:text-white shadow-lg"
      >
        ▼
      </button>
    </div>
  );
};

const TriLayerLock: React.FC<{ onSuccess: () => void; playClick: () => void; onError: () => void }> = ({ onSuccess, playClick, onError }) => {
  const [currentLayer, setCurrentLayer] = useState(0); 
  const [rotation, setRotation] = useState(0);
  const [unlockedLayers, setUnlockedLayers] = useState([false, false, false]);
  const [isDragging, setIsDragging] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  
  const startAngleRef = useRef(0);
  const lastTickRef = useRef(0);
  const lockRef = useRef<HTMLDivElement>(null);

  const targets = [1, 5, 14];

  const currentTickValue = useMemo(() => {
    const normalized = ((rotation % 360) + 360) % 360;
    return Math.round(normalized / 18) % 20;
  }, [rotation]);

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (e.cancelable) e.preventDefault();
    setIsDragging(true);
    setHasMoved(false);
    
    const clientX = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
    
    if (lockRef.current) {
      const rect = lockRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const angle = Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
      startAngleRef.current = angle - rotation;
    }
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !lockRef.current) return;
    if (e.cancelable) e.preventDefault();
    
    const clientX = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
    
    const rect = lockRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const angle = Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
    const newRotation = angle - startAngleRef.current;
    
    if (Math.abs(newRotation - rotation) > 1) {
      setHasMoved(true);
    }

    const tickStep = 18; 
    const currentTick = Math.round(newRotation / tickStep);
    
    if (currentTick !== lastTickRef.current) {
      playClick();
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
      lastTickRef.current = currentTick;
    }

    setRotation(newRotation);
  };

  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (!hasMoved) {
      setRotation(0);
      return;
    }

    if (currentTickValue === targets[currentLayer]) {
      const newUnlocked = [...unlockedLayers];
      newUnlocked[currentLayer] = true;
      setUnlockedLayers(newUnlocked);
      
      if (currentLayer < 2) {
        setCurrentLayer(prev => prev + 1);
        playClick();
        if ('vibrate' in navigator) navigator.vibrate([30, 50, 30]);
      } else {
        onSuccess();
        if ('vibrate' in navigator) navigator.vibrate(200);
      }
    } else {
      onError();
      if ('vibrate' in navigator) navigator.vibrate(100);
    }
    setRotation(0);
    lastTickRef.current = 0;
  };

  return (
    <div className="flex flex-col items-center gap-10 sm:gap-16 select-none scale-90 sm:scale-100 touch-none" style={{ touchAction: 'none' }}>
      <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center">
        {[0, 1, 2].map(i => (
          <div 
            key={i}
            className={`absolute rounded-full border-2 sm:border-4 transition-all duration-700 ${
              unlockedLayers[i] ? 'border-green-500 shadow-[0_0_40px_rgba(34,197,94,0.6)]' : 
              currentLayer === i ? 'border-white/30 animate-pulse scale-105' : 'border-white/10'
            }`}
            style={{ 
              width: `${(i + 1) * 85}px`, 
              height: `${(i + 1) * 85}px`,
              opacity: currentLayer >= i ? 1 : 0.2
            }}
          >
             {currentLayer === i && !unlockedLayers[i] && (
               <div className="absolute inset-0 opacity-20">
                  {[...Array(20)].map((_, idx) => (
                    <div 
                      key={idx} 
                      className="absolute w-1 h-1 bg-white rounded-full"
                      style={{ 
                        top: '50%', left: '50%', 
                        transform: `rotate(${idx * 18}deg) translateY(-${(i + 1) * 42.5}px)` 
                      }}
                    />
                  ))}
               </div>
             )}
          </div>
        ))}

        <div 
          ref={lockRef}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
          className="w-44 h-44 sm:w-52 sm:h-52 bg-gradient-to-br from-[#2a2a2a] to-[#0a0a0a] rounded-full shadow-[0_20px_60px_rgba(0,0,0,0.8)] border-4 border-white/10 cursor-pointer flex items-center justify-center relative z-50 group active:scale-95 transition-transform overflow-hidden"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          <div className="w-1.5 h-8 sm:w-2 sm:h-10 bg-white/60 absolute top-1 rounded-full group-hover:bg-white transition-colors shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
          
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border border-white/5 flex flex-col items-center justify-center bg-black/50 pointer-events-none backdrop-blur-md">
             <div className="text-3xl sm:text-4xl text-white font-mono font-black tracking-tighter drop-shadow-lg">
               {currentTickValue}
             </div>
             <div className="text-[8px] text-white/20 uppercase font-bold tracking-widest mt-1">
               {isDragging ? 'ROTATING' : 'READY'}
             </div>
          </div>

          <div className="absolute inset-0 pointer-events-none opacity-20 bg-[conic-gradient(from_0deg,transparent,rgba(255,255,255,0.1),transparent)]"></div>
        </div>
      </div>

      <div className="text-center space-y-4">
        <h4 className={`font-mono text-sm tracking-widest uppercase italic transition-colors duration-300 ${isDragging ? 'text-white' : 'text-white/40'}`}>
          目标层级: <span className="text-white font-bold">{['头部 (HEAD)', '身体 (BODY)', '下半身 (LOWER BODY)'][currentLayer]}</span>
        </h4>
        <div className="flex gap-3 justify-center">
           {[0, 1, 2].map(i => (
             <div 
               key={i} 
               className={`w-3 h-3 rounded-full transition-all duration-500 ${
                 unlockedLayers[i] ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,1)] scale-110' : 
                 currentLayer === i ? 'bg-white/40 animate-pulse' : 'bg-white/10'
               }`}
             ></div>
           ))}
        </div>
        <p className="text-[10px] text-white/20 font-mono uppercase tracking-[0.2em]">手指滑动中心转盘以对齐参数</p>
      </div>
    </div>
  );
};

const HeartDefibrillator: React.FC<{ onSuccess: () => void; playClick: () => void; onError: () => void }> = ({ onSuccess, playClick, onError }) => {
  const [leftValue, setLeftValue] = useState(0);
  const [rightValue, setRightValue] = useState(0);
  const [isShockReady, setIsShockReady] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);

  const targets = { left: 8, right: 20 };

  useEffect(() => {
    if (leftValue === targets.left && rightValue === targets.right) {
      setIsShockReady(true);
    } else {
      setIsShockReady(false);
    }
  }, [leftValue, rightValue, targets.left, targets.right]);

  const handleShock = () => {
    if (!isShockReady) {
      onError();
      return;
    }
    playClick();
    setIsFlashing(true);
    setTimeout(() => {
      onSuccess();
    }, 1500);
  };

  const Knob: React.FC<{ label: string; value: number; max: number; onChange: (v: number) => void }> = ({ label, value, max, onChange }) => {
    const handleScroll = (dir: 'up' | 'down') => {
      playClick();
      const next = dir === 'up' ? (value + 1) % (max + 1) : (value - 1 + (max + 1)) % (max + 1);
      onChange(next);
      if ('vibrate' in navigator) navigator.vibrate(5);
    };

    return (
      <div className="flex flex-col items-center gap-4 sm:gap-6">
        <div className="text-[9px] sm:text-[10px] font-mono font-bold tracking-[0.2em] sm:tracking-[0.3em] text-white/40 uppercase mb-1">{label}</div>
        <button onClick={() => handleScroll('up')} className="w-12 h-8 sm:w-16 sm:h-10 border border-white/10 hover:bg-white/5 transition-colors">▲</button>
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[#0a0a0a] border-4 border-white/10 rounded-full flex items-center justify-center relative shadow-inner overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
           <div 
             className="w-1 h-6 sm:h-8 bg-blue-500 absolute top-2 rounded-full transition-transform duration-300 origin-bottom"
             style={{ transform: `rotate(${(value / max) * 360}deg) translateY(-15px)` }}
           ></div>
           <span className="text-2xl sm:text-3xl font-black text-white font-mono">{value}</span>
        </div>
        <button onClick={() => handleScroll('down')} className="w-12 h-8 sm:w-16 sm:h-10 border border-white/10 hover:bg-white/5 transition-colors">▼</button>
      </div>
    );
  };

  return (
    <div className="relative flex flex-col items-center gap-10 sm:gap-16 p-6 sm:p-12 bg-black/40 border-2 border-white/5 backdrop-blur-3xl rounded-lg shadow-2xl w-full">
      {isFlashing && <div className="fixed inset-0 z-[5000] bg-white animate-pulse"></div>}
      
      <div className="flex flex-col sm:flex-row gap-8 sm:gap-20 items-center">
        <Knob label="Input (线路)" value={leftValue} max={12} onChange={setLeftValue} />
        
        <div className="flex flex-col items-center gap-6 sm:gap-8">
           <div className="text-[10px] font-mono font-bold tracking-[0.2em] text-white/40 uppercase">状态: {isShockReady ? '已同步' : '待机'}</div>
           <button 
             onClick={handleShock}
             className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full border-8 transition-all duration-300 flex items-center justify-center ${isShockReady ? 'border-red-600 bg-red-600/20 animate-pulse shadow-[0_0_50px_rgba(220,38,38,0.5)] cursor-pointer' : 'border-white/10 bg-white/5 opacity-30 cursor-pointer'}`}
           >
             <span className={`text-lg sm:text-xl font-black italic uppercase tracking-widest ${isShockReady ? 'text-red-500' : 'text-white/20'}`}>电击</span>
           </button>
           <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 transition-all duration-1000" style={{ width: isShockReady ? '100%' : '20%' }}></div>
           </div>
        </div>

        <Knob label="Frequency (频率)" value={rightValue} max={40} onChange={setRightValue} />
      </div>

      <div className="w-full border-t border-white/5 pt-6 sm:pt-8 grid grid-cols-3 gap-2 sm:gap-4 text-center">
         <div>
            <p className="text-[8px] sm:text-[9px] text-white/20 uppercase font-mono mb-1">电压</p>
            <p className="text-lg sm:text-xl font-mono text-white/60">{leftValue * 120}V</p>
         </div>
         <div>
            <p className="text-[8px] sm:text-[9px] text-white/20 uppercase font-mono mb-1">节奏</p>
            <p className="text-lg sm:text-xl font-mono text-white/60">{rightValue} BPM</p>
         </div>
         <div>
            <p className="text-[8px] sm:text-[9px] text-white/20 uppercase font-mono mb-1">能量</p>
            <p className="text-lg sm:text-xl font-mono text-white/60">{isShockReady ? '最大值' : '充电中'}</p>
         </div>
      </div>
    </div>
  );
};

// --- NEW LEVEL 9 COMPONENTS ---

interface FloatingLetterProps {
  char: string;
  onDropIn: (char: string) => void;
  containerRect: DOMRect | null;
  targetRect: DOMRect | null;
}

const FloatingLetter: React.FC<FloatingLetterProps> = ({ char, onDropIn, containerRect, targetRect }) => {
  const [pos, setPos] = useState({ 
    x: Math.random() * 80 + 10, 
    y: Math.random() * 80 + 10 
  });
  const [vel] = useState({ 
    x: (Math.random() - 0.5) * 0.2, 
    y: (Math.random() - 0.5) * 0.2 
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (isDragging) return;
    const interval = setInterval(() => {
      setPos(prev => {
        let nextX = prev.x + vel.x;
        let nextY = prev.y + vel.y;
        if (nextX < 0 || nextX > 90) vel.x *= -1;
        if (nextY < 0 || nextY > 90) vel.y *= -1;
        return { x: nextX, y: nextY };
      });
    }, 16);
    return () => clearInterval(interval);
  }, [isDragging, vel]);

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    if (containerRect) {
      const currentAbsX = (pos.x / 100) * containerRect.width;
      const currentAbsY = (pos.y / 100) * containerRect.height;
      dragOffset.current = {
        x: clientX - containerRect.left - currentAbsX,
        y: clientY - containerRect.top - currentAbsY
      };
    }
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !containerRect) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const newX = ((clientX - containerRect.left - dragOffset.current.x) / containerRect.width) * 100;
    const newY = ((clientY - containerRect.top - dragOffset.current.y) / containerRect.height) * 100;
    setPos({ x: newX, y: newY });
  };

  const handleEnd = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    setIsDragging(false);

    if (containerRect && targetRect) {
      const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
      const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : e.clientY;
      
      if (
        clientX >= targetRect.left && clientX <= targetRect.right &&
        clientY >= targetRect.top && clientY <= targetRect.bottom
      ) {
        onDropIn(char);
      }
    }
  };

  return (
    <div 
      className={`absolute w-12 h-12 flex items-center justify-center text-xl font-bold rounded-sm cursor-grab active:cursor-grabbing transition-shadow select-none z-[2100] ${isDragging ? 'scale-125 z-[2200] text-white shadow-[0_0_20px_rgba(255,255,255,0.8)]' : 'text-white/40'}`}
      style={{ left: `${pos.x}%`, top: `${pos.y}%`, touchAction: 'none' }}
      onMouseDown={handleStart}
      onMouseMove={handleMove}
      onMouseUp={handleEnd}
      onTouchStart={handleStart}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
    >
      {char}
    </div>
  );
};

const DataIntegration: React.FC<{ onComplete: () => void; playClick: () => void }> = ({ onComplete, playClick }) => {
  const [restored, setRestored] = useState<string[]>([]);
  const [floatingChars, setFloatingChars] = useState<string[]>(
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').filter(c => !['E', 'G', 'O', 'M'].includes(c)).concat(['E', 'G', 'O', 'M'])
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<HTMLDivElement>(null);
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const updateRects = () => {
      if (containerRef.current) setContainerRect(containerRef.current.getBoundingClientRect());
      if (coreRef.current) setTargetRect(coreRef.current.getBoundingClientRect());
    };
    updateRects();
    window.addEventListener('resize', updateRects);
    return () => window.removeEventListener('resize', updateRects);
  }, []);

  const handleDropIn = (char: string) => {
    if (['E', 'G', 'O', 'M'].includes(char) && !restored.includes(char)) {
      playClick();
      if ('vibrate' in navigator) navigator.vibrate(50);
      const newRestored = [...restored, char];
      setRestored(newRestored);
      setFloatingChars(prev => prev.filter(c => c !== char));
      if (newRestored.length === 4) {
        setTimeout(onComplete, 2000);
      }
    }
  };

  return (
    <div ref={containerRef} className="relative w-full h-[60vh] sm:h-[70vh] bg-black/40 border border-white/10 rounded overflow-hidden">
      {/* Fragments */}
      {floatingChars.map(c => (
        <FloatingLetter 
          key={c} 
          char={c} 
          onDropIn={handleDropIn} 
          containerRect={containerRect} 
          targetRect={targetRect} 
        />
      ))}

      {/* Central Core */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div 
          ref={coreRef}
          className={`w-32 h-32 sm:w-48 sm:h-48 border-2 border-white/20 transition-all duration-1000 flex items-center justify-center relative ${restored.length === 4 ? 'bg-white shadow-[0_0_100px_rgba(255,255,255,1)] scale-125' : 'bg-black/80'}`}
        >
          {restored.length < 4 ? (
            <div className="text-white/20 font-mono text-[8px] sm:text-[10px] uppercase tracking-widest text-center px-2">
              CORE_STATUS: SHATTERED<br/>
              RESTORATION: {restored.length * 25}%
            </div>
          ) : (
             <div className="text-black font-black text-xs sm:text-sm tracking-tighter uppercase italic animate-pulse">SYSTEM RESTORED</div>
          )}
          
          {/* Visual Pieces for restored letters */}
          <div className="absolute inset-0 flex flex-wrap">
            {['E', 'G', 'O', 'M'].map(l => (
              <div key={l} className={`w-1/2 h-1/2 border border-white/5 flex items-center justify-center transition-all duration-700 ${restored.includes(l) ? 'opacity-100 bg-white/10' : 'opacity-0'}`}>
                {restored.includes(l) && <span className="text-white font-black text-2xl sm:text-4xl">{l}</span>}
              </div>
            ))}
          </div>

          {/* Glitch circles */}
          <div className={`absolute -inset-10 border border-white/5 rounded-full animate-spin-slow ${restored.length >= 1 ? 'opacity-20' : 'opacity-0'}`}></div>
          <div className={`absolute -inset-20 border border-white/5 rounded-full animate-spin-reverse-slow ${restored.length >= 3 ? 'opacity-10' : 'opacity-0'}`}></div>
        </div>
      </div>
    </div>
  );
};

// --- NEW LEVEL 10 COMPONENTS ---

const MechanicalJoystick: React.FC<{ onInput: (dir: 'U' | 'L' | 'R' | 'D') => void; playClick: () => void }> = ({ onInput, playClick }) => {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleStart = () => setIsDragging(true);

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const maxDist = 60;
    
    if (dist > maxDist) {
      dx *= maxDist / dist;
      dy *= maxDist / dist;
    }
    setPos({ x: dx, y: dy });
  };

  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    // Detect direction
    const threshold = 30;
    let dir: 'U' | 'L' | 'R' | 'D' | null = null;
    if (pos.y < -threshold && Math.abs(pos.x) < threshold) dir = 'U';
    else if (pos.x < -threshold && Math.abs(pos.y) < threshold) dir = 'L';
    else if (pos.x > threshold && Math.abs(pos.y) < threshold) dir = 'R';
    else if (pos.y > threshold && Math.abs(pos.x) < threshold) dir = 'D';

    if (dir) onInput(dir);
    
    setPos({ x: 0, y: 0 });
    playClick(); // Sound of snap-back
  };

  return (
    <div 
      ref={containerRef}
      className="w-48 h-48 sm:w-64 sm:h-64 rounded-full bg-gradient-to-br from-[#1a1a1a] to-[#050505] shadow-[inset_0_5px_15px_rgba(255,255,255,0.1),0_10px_40px_rgba(0,0,0,0.8)] border-4 border-white/5 flex items-center justify-center relative touch-none"
      onMouseMove={handleMove}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
    >
      <div 
        className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-[#111] shadow-[0_15px_30px_rgba(0,0,0,0.9)] border-2 border-white/10 flex items-center justify-center cursor-grab active:cursor-grabbing transition-transform"
        style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
        onMouseDown={handleStart}
        onTouchStart={handleStart}
      >
        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-black to-[#222] border border-white/20 flex items-center justify-center">
          <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.5)]"></div>
        </div>
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none opacity-50"></div>
      </div>
      {/* Visual Directions */}
      <div className="absolute top-4 text-white/10 font-black text-xs tracking-widest uppercase">UP ^</div>
      <div className="absolute bottom-4 text-white/10 font-black text-xs tracking-widest uppercase">DOWN v</div>
      <div className="absolute left-4 text-white/10 font-black text-xs tracking-widest uppercase">&lt; LEFT</div>
      <div className="absolute right-4 text-white/10 font-black text-xs tracking-widest uppercase">RIGHT &gt;</div>
    </div>
  );
};

// --- GAMEVIEW MAIN ---

const GameView: React.FC<GameViewProps> = ({ currentUser, onProgress, onExit }) => {
  const [level, setLevel] = useState(currentUser.gameProgress || 1);
  const [screen, setScreen] = useState(1);
  const [tokenPart1, setTokenPart1] = useState('');
  const [tokenPart2, setTokenPart2] = useState('');
  const [rollValue, setRollValue] = useState(0);
  const [feedback, setFeedback] = useState<{ text: string; sub: string; color: string } | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [errorFlash, setErrorFlash] = useState(false);
  const [showHintModal, setShowHintModal] = useState(false);
  const [hintsVisible, setHintsVisible] = useState(false);

  const [l3Code, setL3Code] = useState('');
  const [l4Inputs, setL4Inputs] = useState({ panda: '', bird: '', apple: '', pot: '' });

  const [l7Perspective, setL7Perspective] = useState<'A' | 'B'>('A');
  const [l7BInput, setL7BInput] = useState('');
  const [l7AnomaliesCleared, setL7AnomaliesCleared] = useState<number[]>([]);
  const [l7Markers, setL7Markers] = useState<{ x: number; y: number }[]>([]);
  const l7RequiredAnomalies = [0, 1, 2, 3, 4, 5]; 

  const [l1s2Phase, setL1s2Phase] = useState<'typing' | 'alert' | 'ready'>('typing');
  const [l8Input, setL8Input] = useState('');
  
  const [l9Code, setL9Code] = useState('');
  const [showFinalLog, setShowFinalLog] = useState(false);
  
  // New Level 10 States
  const [l10Perspective, setL10Perspective] = useState<'A' | 'B'>('A');
  const [l10Phase, setL10Phase] = useState(0);
  const [l10Ignited, setL10Ignited] = useState(false);
  const [l10InputBuffer, setL10InputBuffer] = useState<string[]>([]);
  const [l10PhasesCompleted, setL10PhasesCompleted] = useState([false, false, false, false, false]);

  const audioCtxRef = useRef<AudioContext | null>(null);

  // Sequences updated according to the prompt instructions
  const l10Sequences = useMemo(() => [
    ['U', 'L', 'R', 'L'], // Phase 1: UP, LEFT, RIGHT, LEFT
    ['L', 'L', 'L', 'R', 'L', 'L'], // Phase 2: LLLRLL
    ['L', 'R', 'L', 'R'], // Phase 3: LRLR
    ['L', 'L', 'L'], // Phase 4-1: LLL
    ['L', 'D'] // Phase 4-2: L, DOWN
  ], []);

  useEffect(() => {
    if (level === 1 && screen === 2) {
      setL1s2Phase('typing');
      const t1 = setTimeout(() => setL1s2Phase('alert'), 5500); 
      const t2 = setTimeout(() => setL1s2Phase('ready'), 7000);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [level, screen]);

  useEffect(() => {
    setHintsVisible(false);
  }, [level, l7Perspective, l10Perspective]);

  const playClick = () => {
    if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtxRef.current.createOscillator();
    const gain = audioCtxRef.current.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, audioCtxRef.current.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, audioCtxRef.current.currentTime + 0.04);
    gain.gain.setValueAtTime(0.1, audioCtxRef.current.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + 0.04);
    osc.connect(gain);
    gain.connect(audioCtxRef.current.destination);
    osc.start();
    osc.stop(audioCtxRef.current.currentTime + 0.04);
  };

  const playError = () => {
    if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtxRef.current.createOscillator();
    const gain = audioCtxRef.current.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, audioCtxRef.current.currentTime);
    osc.frequency.linearRampToValueAtTime(40, audioCtxRef.current.currentTime + 0.3);
    gain.gain.setValueAtTime(0.3, audioCtxRef.current.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(audioCtxRef.current.destination);
    osc.start();
    osc.stop(audioCtxRef.current.currentTime + 0.3);
  };

  const triggerError = () => {
    playError();
    setIsShaking(true);
    setErrorFlash(true);
    setTimeout(() => {
      setIsShaking(false);
      setErrorFlash(false);
    }, 600);
  };

  const nextLevel = () => {
    const nextL = level + 1;
    setFeedback(null);
    setLevel(nextL);
    setScreen(1);
    setTokenPart1('');
    setTokenPart2('');
    setRollValue(0);
    setHintsVisible(false);
    onProgress(nextL);
  };

  const handleBack = () => {
    if (screen > 1) setScreen(screen - 1);
  };

  const checkLevel1 = () => {
    const fullToken = (tokenPart1 + tokenPart2).toUpperCase().replace(/\s/g, '');
    if (fullToken === '20NWVSM') {
      setFeedback({ text: '#20 Node Warning: Violin Storage Memory', sub: '节点警告：小提琴存储记忆', color: 'text-green-500' });
      setTimeout(nextLevel, 3000);
    } else if (fullToken === '20NWVVT') {
      setFeedback({ text: '#20 Node Warning: Virtual Visual Trap', sub: '节点警告：虚拟视觉陷阱', color: 'text-red-400' });
      setTimeout(nextLevel, 3000);
    } else triggerError();
  };

  const checkLevel2 = () => {
    if (rollValue === 7) {
      setFeedback({ text: '✔ 版本匹配', sub: '系统重构成功。检测到管理员权限。', color: 'text-blue-400' });
      setTimeout(nextLevel, 2500);
    } else triggerError();
  };

  const checkLevel3Code = () => {
    if (l3Code === '67662') setScreen(6);
    else triggerError();
  };

  const checkLevel4 = () => {
    if (l4Inputs.panda === '5' && l4Inputs.bird === '3' && l4Inputs.apple === '4' && l4Inputs.pot === '1') {
      setFeedback({ text: '✔ 身份验证成功', sub: '格式转换完成。数据已上传至中央节点。', color: 'text-green-400' });
      setTimeout(nextLevel, 3000);
    } else triggerError();
  };

  const handleL7ImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (l7AnomaliesCleared.length === l7RequiredAnomalies.length) return;
    if (l7Markers.length >= 6) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    playClick();
    setL7Markers(prev => [...prev, { x, y }]);
  };

  const handleExecutePurge = () => {
    const positions = [
      { top: 29, left: 36, width: 10, height: 12 },
      { top: 45, left: 41, width: 8, height: 11 },
      { top: 67, left: 4, width: 9, height: 12 },
      { top: 65, left: 50, width: 10, height: 15 },
      { top: 59, left: 75, width: 9, height: 12 },
      { top: 34, left: 81, width: 9, height: 13 }
    ];
    const zonesHit = new Set<number>();
    l7Markers.forEach(marker => {
      positions.forEach((pos, idx) => {
        if (marker.x >= pos.left && marker.x <= pos.left + pos.width &&
            marker.y >= pos.top && marker.y <= pos.top + pos.height) {
          zonesHit.add(idx);
        }
      });
    });
    if (zonesHit.size === 6) {
      playClick();
      setL7AnomaliesCleared(Array.from(zonesHit));
      setFeedback({ text: '✔ 源码完整性已恢复', sub: '所有视觉异常已清除。防火墙稳定性 100%。', color: 'text-green-500' });
      setTimeout(() => setFeedback(null), 3000);
    } else {
      setFeedback({ text: '目标不匹配', sub: '异常定位错误。清除失败。', color: 'text-red-500' });
      triggerError();
      setL7Markers([]);
      setTimeout(() => setFeedback(null), 1500);
    }
  };

  const checkLevel7B = () => {
    if (l7BInput === '29') {
      if (l7AnomaliesCleared.length < l7RequiredAnomalies.length) {
        setFeedback({ text: '访问被拒绝', sub: '检测到未清除的视觉异常。请协调玩家 A。', color: 'text-red-500' });
        setTimeout(() => setFeedback(null), 2500);
        return;
      }
      playClick();
      setFeedback({ text: '✔ 权限授予', sub: '访问通过。Level 8 已解锁。', color: 'text-green-400' });
      setTimeout(nextLevel, 3000);
    } else triggerError();
  };

  const checkLevel8 = () => {
    const val = l8Input.trim().toLowerCase();
    if (['fenrir greyback', 'fenrir', '芬里尔', '芬里尔·狼人', '芬里尔狼人'].includes(val)) {
      setFeedback({ text: '✔ 目标确认', sub: '病毒已隔离。系统威胁解除。', color: 'text-red-500' });
      setTimeout(nextLevel, 3000);
    } else triggerError();
  };

  const checkLevel9Code = () => {
    if (l9Code.trim().toUpperCase() === 'EGOM') {
      setScreen(3);
    } else triggerError();
  };
  
  const handleLevel10JoystickInput = (dir: 'U' | 'L' | 'R' | 'D') => {
    if (!l10Ignited) {
      if (dir === 'U') {
        setL10Ignited(true);
        playClick();
        // UP is the first move of Phase 1
        const currentTargetSeq = l10Sequences[0];
        if (currentTargetSeq[0] === 'U') {
           setL10InputBuffer(['U']);
        }
      } else {
        triggerError();
      }
      return;
    }

    const currentTargetSeq = l10Sequences[l10Phase];
    const newBuffer = [...l10InputBuffer, dir];
    
    // Check if the partial buffer matches the target sequence
    const matches = newBuffer.every((val, idx) => val === currentTargetSeq[idx]);

    if (!matches) {
      setL10InputBuffer([]);
      triggerError();
      return;
    }

    setL10InputBuffer(newBuffer);

    if (newBuffer.length === currentTargetSeq.length) {
      // Phase Complete!
      const newPhasesCompleted = [...l10PhasesCompleted];
      newPhasesCompleted[l10Phase] = true;
      setL10PhasesCompleted(newPhasesCompleted);
      setL10InputBuffer([]);
      
      if (l10Phase < l10Sequences.length - 1) {
        setL10Phase(l10Phase + 1);
        playClick();
      } else {
        // Ultimate Completion
        setScreen(3);
      }
    }
  };

  const handleHintClick = () => {
    if (!hintsVisible) setShowHintModal(true);
  };

  const confirmHint = () => {
    setHintsVisible(true);
    setShowHintModal(false);
  };

  const renderLevel = () => {
    switch (level) {
      case 1:
        return (
          <div className="max-w-4xl mx-auto px-4 py-20 sm:py-24 space-y-12 sm:space-y-16">
            {screen === 1 && (
              <div
                onClick={() => setScreen(2)}
                className="cursor-pointer space-y-6 sm:space-y-8 p-6 sm:p-12 bg-black/60 border border-white/10 backdrop-blur-xl rounded-sm shadow-2xl animate-fade-in relative group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                <p className="text-sm sm:text-base md:text-xl leading-relaxed sm:leading-8 text-white/70 font-light tracking-[0.05em]">
                  我们眼前的繁华，不过是一串岌岌可危的代码。现在的这个商场，其实并不是真实的物理世界，而是一个名为“HEAL CODE”的超级服务器备份。你是一名“记忆修复师”。
                </p>
                <p className="text-sm sm:text-base md:text-xl leading-relaxed sm:leading-8 text-white/70 font-light tracking-[0.05em]">
                  系统刚才发出了警报，因为病毒入侵，导致商场里的一些数据发生了“篡改”。你的任务是找出这些违和的数据，防止服务器崩溃。
                </p>
                <p className="text-center animate-pulse text-[10px] mt-8 sm:mt-12 opacity-30 tracking-[0.4em] font-mono">
                  点击初始化链接 (CLICK TO INITIATE LINK)
                </p>
              </div>
            )}
            {screen === 2 && (
              <div className="fixed inset-0 bg-black z-[500] flex flex-col items-center justify-center p-6 sm:p-8 transition-all duration-1000">
                <div className="max-w-3xl w-full space-y-8 sm:space-y-12 font-mono text-lg sm:text-2xl text-green-500/90 text-center">
                  {(l1s2Phase === 'typing' || l1s2Phase === 'alert') && (
                    <div className={`space-y-6 sm:space-y-8 transition-all duration-1000 ${l1s2Phase === 'alert' ? '-translate-y-20 opacity-30' : ''}`}>
                      <p className="animate-typing-1 overflow-hidden whitespace-nowrap inline-block">“唤醒程序启动……听着，特工。</p>
                      <br/>
                      <p className="animate-typing-2 overflow-hidden whitespace-nowrap opacity-0 inline-block">你周围的人都是NPC，只有你是清醒的。</p>
                      <br/>
                      <p className="animate-typing-3 overflow-hidden whitespace-nowrap opacity-0 inline-block">现在，抬起头，寻找第一个Bug。”</p>
                    </div>
                  )}
                  {(l1s2Phase === 'alert' || l1s2Phase === 'ready') && (
                    <div className="flex flex-col items-center animate-fade-in px-4">
                      <div className="p-8 sm:p-12 border-2 sm:border-4 border-red-600 bg-red-600/10 text-red-600 font-black text-xl sm:text-3xl mb-8 sm:mb-12 uppercase tracking-widest shadow-[0_0_50px_rgba(220,38,38,0.3)] animate-pulse leading-tight">
                        系统警报 (SYSTEM ALERT): 访问受限。防火墙已激活。
                      </div>
                      {l1s2Phase === 'ready' && (
                        <button 
                          onClick={() => setScreen(3)}
                          className="mt-6 sm:mt-8 px-10 sm:px-16 py-4 sm:py-6 border-2 border-white/20 text-white font-black text-lg sm:text-xl hover:bg-white hover:text-black transition-all tracking-[0.2em] sm:tracking-[0.4em] uppercase animate-slide-up"
                        >
                          点击初始化
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
            {screen === 3 && (
              <div className="animate-fade-in space-y-8 sm:space-y-12">
                <div className="w-full aspect-video rounded-sm overflow-hidden shadow-2xl border border-white/10 relative">
                  <img src="https://images.unsplash.com/photo-1541613143105-081048821955?q=80&w=2000" alt="Violinist" className="w-full h-full object-cover brightness-[0.5] contrast-125" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                </div>
                <div className="bg-black/80 backdrop-blur-2xl border-2 border-white/10 p-6 sm:p-10 shadow-2xl animate-slide-up space-y-6 sm:space-y-8">
                  <p className="text-white/90 text-lg sm:text-xl font-light leading-relaxed italic">
                    之前的系统架构师把“管理员密钥”藏在了门口的那个<span className="text-white font-bold underline decoration-white/30">“音频守护者”</span>身上。<br/>
                    他把密钥拆成了两部分，貌似跟音乐的乐符 + 破译字母的组合有关….
                  </p>
                  <div className={`flex flex-col items-center gap-6 sm:gap-8 ${isShaking ? 'animate-shake' : ''}`}>
                    <div className="flex items-center gap-2 sm:gap-4 w-full justify-center">
                      <input className="w-16 h-16 sm:w-24 sm:h-24 bg-black border-2 border-white/20 text-3xl sm:text-5xl font-black text-center outline-none focus:border-green-500 transition-all" maxLength={2} placeholder="00" value={tokenPart1} onChange={(e) => setTokenPart1(e.target.value)} />
                      <div className="text-2xl sm:text-4xl text-white/20">+</div>
                      <input className="flex-1 max-w-[200px] sm:max-w-none sm:w-64 h-16 sm:h-24 bg-black border-2 border-white/20 text-2xl sm:text-5xl font-black text-center uppercase tracking-widest outline-none focus:border-green-500 transition-all" maxLength={5} placeholder="ABCDE" value={tokenPart2} onChange={(e) => setTokenPart2(e.target.value.toUpperCase())} />
                    </div>
                    <button onClick={checkLevel1} className="w-full sm:w-auto px-16 h-16 sm:h-24 bg-white text-black font-black text-xl sm:text-2xl hover:bg-green-500 uppercase transition-all shadow-xl active:scale-95">验证</button>
                  </div>
                  <button onClick={handleHintClick} className="text-[10px] text-white/20 underline font-mono tracking-widest uppercase">>>> 获取提示</button>
                  {hintsVisible && <p className="text-yellow-500/80 text-sm font-mono italic animate-fade-in border-l-2 border-yellow-500/20 pl-4 py-2 mt-4">>>> 关键音符数据被冻结在底座的黑色环形带上。系统检测到一段隐藏的节奏藏在乐谱里。短音符是点，长音符是线……</p>}
                </div>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="relative min-h-screen py-24 sm:py-32">
            <div className="fixed inset-0 -z-10 bg-[#050505] bg-[radial-gradient(circle_at_center,rgba(30,30,30,1)_0%,rgba(5,5,5,1)_100%)]">
              <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 1px, #fff 1px, #fff 2px)', backgroundSize: '100% 4px' }}></div>
            </div>
            {screen === 1 ? (
              <div onClick={() => setScreen(2)} className="h-[70vh] flex items-center justify-center cursor-pointer animate-fade-in p-4">
                <div className="max-w-2xl w-full p-10 sm:p-20 bg-black/40 backdrop-blur-3xl border border-white/5 shadow-2xl text-center space-y-8 sm:space-y-12 font-mono relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-white/5 animate-pulse"></div>
                  <div className="space-y-4">
                    <p className="text-white/40 animate-typing-1 overflow-hidden whitespace-nowrap inline-block text-sm sm:text-base">世界同步中 (SYNCING WORLD)...</p>
                    <p className="text-white/40 animate-typing-2-fast overflow-hidden whitespace-nowrap opacity-0 fill-mode-forwards block text-xs sm:text-sm">环境参数：100% 稳定</p>
                  </div>
                  <h2 className="text-white font-black text-4xl sm:text-6xl mt-8 sm:mt-12 animate-slide-up-delayed opacity-0 fill-mode-forwards tracking-tighter drop-shadow-2xl italic">欢迎来到第二层。</h2>
                  <p className="text-[10px] sm:text-[11px] text-white/20 animate-pulse tracking-[0.4em] sm:tracking-[0.6em] uppercase mt-16 sm:mt-24">【点击屏幕深入系统】</p>
                </div>
              </div>
            ) : (
              <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-48 sm:pb-64 space-y-32 sm:space-y-48">
                <div className="space-y-16 sm:space-y-24 text-white/90 font-light leading-relaxed text-2xl sm:text-4xl max-w-3xl">
                  <p className="animate-slide-up bg-black/30 p-6 sm:p-10 backdrop-blur-xl border-l-2 border-white/10 italic shadow-2xl text-lg sm:text-2xl">这里的瀑布是循环播放的代码，鲜花永不凋谢，草莓永不腐烂，连海水都是循环的像素点。</p>
                  <p className="animate-slide-up-delayed-1 bg-black/30 p-6 sm:p-10 backdrop-blur-xl border-r-2 border-white/10 text-right opacity-0 fill-mode-forwards italic shadow-2xl text-lg sm:text-2xl">你会发现，多莉（Dory）和尼莫（Nemo）的家并不是连贯的。这片虚拟的海洋被黑色的线条无情地切割了。</p>
                  <p className="animate-slide-up-delayed-2 bg-black/30 p-6 sm:p-10 backdrop-blur-xl border-l-2 border-red-500/30 opacity-0 fill-mode-forwards italic shadow-2xl text-red-100/90 text-lg sm:text-2xl">当这些这些自然景观消失，你应该就能闻到这背后资本运作的腐朽味道了。</p>
                  <div className="flex flex-col items-center gap-6 sm:gap-8 animate-fade-in-long opacity-0 fill-mode-forwards">
                    <div className="w-px h-24 sm:h-32 bg-gradient-to-b from-white/20 to-transparent"></div>
                    <p className="text-[10px] font-mono text-white/30 tracking-[0.3em] sm:tracking-[0.5em] animate-bounce uppercase">向下滚动解开真相 (Scroll Down)</p>
                  </div>
                </div>
                <div className="bg-[#0a0a0a] border border-white/10 p-8 sm:p-16 md:p-24 rounded shadow-[0_50px_100px_rgba(0,0,0,0.8)] space-y-12 sm:space-y-20 relative overflow-hidden backdrop-blur-3xl">
                  <div className="absolute top-0 right-0 w-64 h-64 sm:w-80 sm:h-80 bg-white/5 blur-[100px] sm:blur-[120px] rounded-full translate-x-32 -translate-y-32"></div>
                  <div className="space-y-6"><p className="font-mono text-xl sm:text-3xl border-l-4 border-white/50 pl-6 sm:pl-12 text-white/90 italic tracking-tight leading-tight">我们的世界是由矩阵组成的。要把目光聚焦在那些物理边框上。</p></div>
                  <div className={`flex flex-col lg:flex-row items-center justify-around gap-12 sm:gap-16 py-8 sm:py-12 ${isShaking ? 'animate-shake' : ''}`}>
                    <div className="text-center space-y-6 sm:space-y-12">
                      <h3 className="font-mono text-white/40 tracking-[0.3em] sm:tracking-[0.4em] uppercase text-xs sm:text-sm font-bold italic">>>> 输入:</h3>
                      <p className="text-white font-black text-4xl sm:text-5xl tracking-tighter drop-shadow-2xl">创世记 (GENESIS-X)</p>
                    </div>
                    <div className="flex flex-col items-center gap-8 sm:gap-12 w-full max-w-[200px]">
                      <DigitRoller value={rollValue} onChange={setRollValue} playClick={playClick} />
                      <div className="flex flex-col gap-4 sm:gap-6 w-full">
                        <button onClick={checkLevel2} className="h-24 sm:h-44 w-full bg-white text-black font-black text-4xl sm:text-6xl tracking-tighter hover:bg-blue-500 transition-all shadow-2xl active:scale-95 group relative overflow-hidden italic">
                          <span className="relative z-10 uppercase">发送</span>
                        </button>
                        <p className="text-[9px] sm:text-[11px] text-center text-white/20 font-mono italic tracking-widest uppercase">X = 矩阵模块数量</p>
                      </div>
                    </div>
                  </div>
                  <div className="pt-8 sm:pt-12 border-t border-white/5 text-center">
                    <button onClick={handleHintClick} className="text-[10px] sm:text-[11px] text-white/10 hover:text-white underline font-mono tracking-widest uppercase">>>> 获取提示</button>
                    {hintsVisible && <p className="mt-6 sm:mt-8 text-yellow-500/80 font-mono text-xs sm:text-sm italic animate-fade-in leading-relaxed max-w-2xl mx-auto">>>> X是构成这个“世界“的矩阵物理模块数量。</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="relative min-h-screen py-24 sm:py-32 px-4 selection:bg-red-500 selection:text-white">
            <div className="max-w-4xl mx-auto">
              {screen === 1 && (
                <div onClick={() => setScreen(2)} className="h-[60vh] sm:h-[70vh] flex flex-col items-center justify-center cursor-pointer animate-fade-in space-y-8 sm:space-y-12 bg-red-900/5 border border-red-500/20 p-6 sm:p-12 rounded backdrop-blur-md shadow-2xl relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse"></div>
                   <div className="space-y-4 sm:space-y-6 font-mono text-red-500 text-center">
                     <p className="animate-typing-1 overflow-hidden whitespace-nowrap text-2xl sm:text-4xl font-black italic tracking-tighter">⚠️ 系统警报 (SYSTEM ALERT):</p>
                     <p className="animate-typing-2-fast overflow-hidden whitespace-nowrap opacity-0 fill-mode-forwards text-lg sm:text-xl font-bold">已触发区域防火墙！你的IP位置已暴露。</p>
                   </div>
                   <p className="text-[10px] text-white/20 animate-pulse tracking-[0.4em] sm:tracking-[0.6em] uppercase mt-16 sm:mt-24">【点击屏幕继续】</p>
                </div>
              )}
              {screen === 2 && (
                <div className="space-y-12 sm:space-y-20 animate-fade-in py-8 sm:py-12">
                   <div className="space-y-6 sm:space-y-10 font-mono text-white/80 text-lg sm:text-2xl leading-relaxed max-w-3xl border-l-4 border-red-500/40 pl-6 sm:pl-12 py-6 sm:py-8 bg-red-500/5 shadow-2xl rounded">
                     <div className="space-y-4 sm:space-y-6">
                        <p className="animate-typing-1 overflow-hidden whitespace-nowrap font-bold text-red-500">赝品世界管理员正在追踪你，快跑！</p>
                        <p className="animate-typing-2 opacity-0 italic text-white/60">去更高的地方，找到那个<span className="text-white font-bold underline decoration-white/30 text-sm sm:text-lg">亲手摘下了自己的脸，变成守护者的守卫。</span></p>
                     </div>
                   </div>
                   <button onClick={() => setScreen(3)} className="flex items-center gap-4 sm:gap-6 px-8 sm:px-16 py-6 sm:py-8 border-2 border-green-500/30 text-green-500 hover:bg-green-500 hover:text-black transition-all font-black text-xl sm:text-3xl animate-slide-up opacity-0 fill-mode-forwards shadow-[0_0_30px_rgba(34,197,94,0.1)] active:scale-95 leading-tight">🔘 目标已锁定 (I Found Him)</button>
                </div>
              )}
              {screen === 3 && (
                <div onClick={() => setScreen(4)} className="space-y-8 sm:space-y-12 animate-fade-in py-8 sm:py-12 bg-black/80 border border-white/10 p-8 sm:p-16 rounded cursor-pointer shadow-2xl relative">
                   <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-green-500/5 blur-[60px] sm:blur-[80px]"></div>
                   <h2 className="text-2xl sm:text-4xl font-black text-green-500 flex items-center gap-4 sm:gap-6 italic tracking-tight"><span className="w-4 h-4 sm:w-5 sm:h-5 bg-green-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(34,197,94,1)]"></span>🟢 物理校准</h2>
                   <div className="space-y-6 sm:space-y-10 font-mono text-base sm:text-xl leading-relaxed">
                      <p className="text-red-500 font-bold animate-pulse text-lg sm:text-2xl tracking-tighter italic">&gt; 🔒 错误: 身份验证失败</p>
                      <p className="text-white/60">&gt; 日志: 这位守护者（Guardian）的头部数据发生了物理脱离。</p>
                      <p className="text-green-400 font-bold bg-green-500/10 px-4 sm:px-6 py-3 sm:py-4 rounded-sm border border-green-500/20 shadow-inner">&gt; 任务: 启动“物理校准”程序</p>
                   </div>
                   <p className="text-[10px] text-white/20 animate-pulse tracking-[0.4em] sm:tracking-[0.6em] uppercase text-center mt-12 sm:mt-20">【点击屏幕继续】</p>
                </div>
              )}
              {screen === 4 && (
                <div className="space-y-10 sm:space-y-16 animate-fade-in py-8 sm:py-12 bg-[#0a0a0a] border-2 border-white/10 p-8 sm:p-16 rounded shadow-2xl relative overflow-hidden">
                   <div className="absolute bottom-0 left-0 w-full h-1 bg-green-500/20"></div>
                   <div className="space-y-8 sm:space-y-12 font-mono text-base sm:text-xl leading-relaxed">
                      <h3 className="text-white/40 uppercase tracking-widest text-xs sm:text-sm font-bold border-b border-white/10 pb-2 sm:pb-4 w-fit italic">&gt; 操作指南：</h3>
                      <ul className="space-y-4 sm:space-y-8 text-white/80 list-disc pl-6 sm:pl-10 decoration-green-500/50 text-sm sm:text-lg">
                        <li>不需要触碰雕像。寻找那个唯一的完美视角。</li>
                        <li>当<span className="text-red-500 font-bold">【虚假面具】</span>与脸部<span className="text-green-500 font-bold">【真实空缺】</span>重合时接通。</li>
                        <li>保持站位不动，扫描那个终端店铺。</li>
                      </ul>
                   </div>
                   <div className="space-y-6 sm:space-y-10 pt-8 sm:pt-16 border-t border-white/5">
                      <p className="text-base sm:text-xl text-white/40 italic font-mono uppercase tracking-widest">&gt; 为了确保你的目标正确，请选择店铺的标志颜色：</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
                        {['黄色', '红色', '橙色', '绿色', '蓝色', '黑色'].map(c => (
                          <button 
                            key={c}
                            onClick={() => { if (c === '橙色') setScreen(5); else triggerError(); }}
                            className={`py-6 sm:py-8 border-2 border-white/10 font-black text-xl sm:text-2xl hover:bg-white hover:text-black transition-all active:scale-95 shadow-lg group relative overflow-hidden ${isShaking && c !== '橙色' ? 'animate-shake' : ''}`}
                          >
                            <span className="relative z-10">{c}</span>
                            <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                          </button>
                        ))}
                      </div>
                   </div>
                </div>
              )}
              {screen === 5 && (
                <div className="space-y-10 sm:space-y-16 animate-fade-in py-8 sm:py-12 flex flex-col">
                   <div className="space-y-6 sm:space-y-10 font-mono text-base sm:text-xl text-white/80 max-w-3xl bg-orange-500/5 p-6 sm:p-10 border-l-4 border-orange-500 rounded-r shadow-xl">
                      <p className="text-orange-500 font-black text-2xl sm:text-3xl italic tracking-tighter">&gt; 雕塑视觉校准已完成，橙色终端已定位。</p>
                      <p className="text-white/40 italic leading-relaxed text-sm sm:text-lg">真正的加密数据包，藏在它的右侧。</p>
                   </div>
                   <div className={`bg-[#050505] border-2 border-white/10 p-6 sm:p-16 rounded shadow-[0_50px_150px_rgba(0,0,0,1)] space-y-10 sm:space-y-16 relative overflow-hidden ${isShaking ? 'animate-shake' : ''}`}>
                      <div className="absolute top-0 left-0 w-full h-1 bg-red-600/30 animate-pulse"></div>
                      <div className="text-center space-y-2 sm:space-y-4">
                        <p className="font-mono text-red-500 animate-pulse tracking-[0.3em] sm:tracking-[0.5em] uppercase text-lg sm:text-xl font-black italic">信号截取中... (SIGNAL INTERCEPTION)</p>
                        <p className="font-mono text-white/30 text-[10px] sm:text-xs tracking-widest uppercase">正在连接 TGV 局域网...</p>
                      </div>
                      <div className="flex justify-between items-center py-8 md:py-12 px-2 md:px-6 border-y border-white/5 bg-white/5 shadow-inner rounded-sm overflow-x-auto no-scrollbar">
                        {[
                          { node: 1, sym: '★', col: 'text-yellow-500', glow: 'rgba(234,179,8,0.5)' },
                          { node: 2, sym: '■', col: 'text-blue-500', glow: 'rgba(59,130,246,0.5)' },
                          { node: 3, sym: '★', col: 'text-yellow-500', glow: 'rgba(234,179,8,0.5)' },
                          { node: 4, sym: '★', col: 'text-yellow-500', glow: 'rgba(234,179,8,0.5)' },
                          { node: 5, sym: '■', col: 'text-blue-500', glow: 'rgba(59,130,246,0.5)' }
                        ].map((n, i) => (
                          <React.Fragment key={n.node}>
                            <div className="flex flex-col items-center gap-2 sm:gap-4 transition-transform hover:scale-110 shrink-0">
                              <span className={`text-4xl md:text-6xl ${n.col} drop-shadow-[0_0_15px_${n.glow}] cursor-default select-none`}>{n.sym}</span>
                              <span className="text-[8px] md:text-[10px] text-white/20 font-mono font-bold tracking-widest uppercase">节点 {n.node}</span>
                            </div>
                            {i < 4 && <div className="h-px bg-white/10 flex-grow min-w-[20px] md:min-w-[30px] mx-2 md:mx-4 shadow-[0_0_10px_rgba(255,255,255,0.05)]"></div>}
                          </React.Fragment>
                        ))}
                      </div>
                      <div className="space-y-8 sm:space-y-12">
                         <p className="text-white/60 font-mono text-base sm:text-xl leading-relaxed italic border-l-2 border-white/20 pl-4 sm:pl-8">这里的每一组<span className="text-white font-black underline decoration-white/40">发光</span>体，都是加密信号源。<br/>获取访问权限前，依次<span className="text-white font-bold">“下载”</span>这 5 组数据。</p>
                         <div className={`space-y-6 sm:space-y-8 p-6 sm:p-10 bg-white/5 rounded border border-white/10 shadow-2xl`}>
                            <label className="block text-[10px] sm:text-sm text-white/40 font-mono tracking-[0.2em] sm:tracking-[0.4em] uppercase font-bold">&gt; 请输入完整的 5 位信号码 (SIGNAL_KEY):</label>
                            <div className="flex flex-col gap-4 sm:gap-8 items-center">
                              <input 
                                className="w-full h-16 sm:h-24 bg-black border-2 border-white/20 text-3xl sm:text-6xl font-black text-center text-white tracking-[0.3em] sm:tracking-[0.6em] outline-none focus:border-green-500 focus:shadow-[0_0_20px_rgba(0,255,0,0.1)] transition-all rounded-sm shadow-inner"
                                maxLength={5} placeholder="00000" value={l3Code}
                                onChange={(e) => setL3Code(e.target.value.replace(/\D/g, ''))}
                                onKeyDown={(e) => e.key === 'Enter' && checkLevel3Code()}
                              />
                              <button onClick={checkLevel3Code} className="w-full px-8 sm:px-16 h-16 sm:h-24 bg-white text-black font-black text-xl sm:text-2xl hover:bg-green-500 transition-all active:scale-95 shadow-2xl uppercase tracking-widest italic">连接</button>
                            </div>
                         </div>
                         <div className="flex flex-col gap-4 border-l-2 border-white/10 pl-4 sm:pl-8">
                            <button onClick={handleHintClick} className="text-[10px] text-white/20 underline w-fit font-mono tracking-[0.4em] uppercase italic font-bold">>>> 获取提示</button>
                            {hintsVisible && (
                              <div className="space-y-2 animate-fade-in mt-2 p-4 sm:p-6 bg-yellow-500/5 border border-yellow-500/20 rounded shadow-inner">
                                 <p className="text-xs sm:text-sm text-yellow-500/90 font-mono font-medium leading-relaxed italic">>>> 观察发亮的星和方块。按照顺序点数，那些正方形...形态可能不一，注意看。</p>
                              </div>
                            )}
                         </div>
                      </div>
                   </div>
                </div>
              )}
              {screen === 6 && (
                <div onClick={nextLevel} className="h-[70vh] sm:h-[80vh] flex flex-col items-center justify-center animate-fade-in space-y-12 sm:space-y-16 cursor-pointer p-4">
                   <div className="space-y-6 sm:space-y-10 text-center max-w-3xl">
                      <p className="text-green-500 font-black text-4xl sm:text-7xl animate-pulse tracking-tighter drop-shadow-[0_0_30px_rgba(34,197,94,0.6)] italic leading-tight">🟢 下载完成 (DOWNLOAD COMPLETE)</p>
                      <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent w-full"></div>
                      <p className="text-white/70 text-lg sm:text-2xl font-mono leading-relaxed font-light">信号码 <span className="text-white font-black px-2 sm:px-3 bg-white/10">[67662]</span> 已捕获。<br/>初始化<span className="text-white font-bold italic">“格式转换”</span>协议。</p>
                   </div>
                   <button className="px-10 sm:px-20 py-6 sm:py-10 bg-white text-black font-black text-2xl sm:text-4xl hover:bg-green-500 transition-all active:scale-95 shadow-[0_0_50px_rgba(255,255,255,0.2)] tracking-[0.2em] sm:tracking-[0.4em] uppercase italic group">
                     下一阶段 (Format Transition)
                     <span className="block text-[8px] sm:text-[10px] opacity-40 mt-2 font-mono group-hover:opacity-100 tracking-widest">正在初始化转换...</span>
                   </button>
                </div>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="relative min-h-screen py-24 sm:py-32 px-4">
            {screen === 1 && (
              <div className="fixed inset-0 bg-black flex flex-col justify-end p-6 sm:p-8 animate-fade-in">
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm -z-10" onClick={() => setScreen(2)}></div>
                <div className="w-full max-w-2xl mx-auto bg-black border-2 border-white/20 p-8 sm:p-12 shadow-2xl animate-slide-up relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
                  <div className="absolute top-0 left-0 w-full h-1 bg-green-500 shadow-[0_0_10px_rgba(34,197,94,1)]"></div>
                  <h3 className="text-green-500 font-black text-xl sm:text-2xl mb-6 sm:mb-8 tracking-widest italic">任务: 寻找“中间人”</h3>
                  <div className="space-y-4 sm:space-y-6 text-white/80 font-mono leading-relaxed text-sm sm:text-base">
                    <p>去 L2.01 找那个代号为 <span className="text-white font-bold">"Cha"</span> 的老派黑客。</p>
                    <p>他通常伪装成贩卖“新鲜植物提取液”的商人。</p>
                    <p className="text-red-500 font-bold italic border-l-2 border-red-500/40 pl-4 animate-pulse">注意：他只认图腾。</p>
                  </div>
                  <button onClick={() => setScreen(2)} className="mt-8 sm:mt-12 w-full py-4 sm:py-6 border border-white/20 text-white font-black hover:bg-white hover:text-black transition-all tracking-[0.3em] sm:tracking-[0.5em] uppercase italic text-sm sm:text-base">[ 接取任务 / ACCEPT ]</button>
                </div>
              </div>
            )}
            {screen === 2 && (
              <div className="max-w-4xl mx-auto space-y-16 sm:space-y-24 animate-fade-in py-8 sm:py-12 pb-32 sm:pb-48">
                <div className="space-y-8 sm:space-y-12">
                   <h2 className="text-white font-black text-4xl sm:text-6xl italic tracking-tighter drop-shadow-2xl leading-tight">请补全剩下的代码。</h2>
                   <div className="space-y-4 text-white/60 font-mono text-base sm:text-xl"><p className="italic leading-relaxed max-w-2xl">“他丢给你一张印着古怪符号的逻辑图。”</p></div>
                </div>
                <div className={`bg-[#080808] border-2 border-white/10 p-8 sm:p-24 rounded shadow-[0_50px_150px_rgba(0,0,0,1)] space-y-12 sm:space-y-20 relative overflow-hidden ${isShaking ? 'animate-shake' : ''}`}>
                   <div className="grid grid-cols-3 gap-4 sm:gap-16 max-w-2xl mx-auto">
                      {[
                        { key: 'panda', type: 'input', src: 'https://i.imgur.com/L8XsoKX.jpg' },
                        { key: '6', type: 'static', val: '6' },
                        { key: '7', type: 'static', val: '7' },
                        { key: '6-2', type: 'static', val: '6' },
                        { key: 'bird', type: 'input', src: 'https://i.imgur.com/f76uhWk.jpg' },
                        { key: 'apple', type: 'input', src: 'https://i.imgur.com/QcDAeo3.jpg' },
                        { key: 'pot', type: 'input', src: 'https://i.imgur.com/pHWuqBe.jpg' },
                        { key: '6-3', type: 'static', val: '6' },
                        { key: '2', type: 'static', val: '2' },
                      ].map((item, idx) => (
                        <div key={idx} className={`aspect-square border-2 rounded-full flex items-center justify-center relative group overflow-hidden ${item.type === 'static' ? 'bg-white border-white/10 text-black text-3xl sm:text-7xl font-black' : 'bg-black border-white/20 p-2 sm:p-4'}`}>
                          {item.type === 'static' ? (
                            item.val
                          ) : (
                            <>
                              <img src={item.src} className="absolute inset-0 w-full h-full object-cover opacity-30 grayscale contrast-125 group-focus-within:opacity-10 transition-opacity" alt={item.key} />
                              <input 
                                className="relative z-10 w-full h-full bg-transparent text-center text-3xl sm:text-7xl font-black text-white outline-none focus:text-green-500 transition-all placeholder:text-white/5" 
                                placeholder="?" 
                                value={(l4Inputs as any)[item.key]} 
                                onChange={(e) => setL4Inputs(prev => ({...prev, [item.key]: e.target.value.replace(/\D/g, '')}))} 
                                maxLength={1} 
                              />
                            </>
                          )}
                        </div>
                      ))}
                   </div>
                   <div className="pt-12 sm:pt-24 flex flex-col items-center gap-8 sm:gap-12">
                      <button onClick={checkLevel4} className="w-full sm:w-auto px-12 sm:px-24 py-6 sm:py-10 bg-white text-black font-black text-2xl sm:text-4xl hover:bg-green-500 transition-all active:scale-95 shadow-2xl uppercase italic">[ 验证 ]</button>
                      <button onClick={handleHintClick} className="text-[10px] sm:text-[11px] text-white/20 underline font-mono uppercase italic font-bold">>>> 获取提示 </button>
                      {hintsVisible && (
                        <div className="max-w-2xl text-yellow-500/80 font-mono text-xs sm:text-sm italic animate-fade-in p-4 bg-yellow-900/5 border border-yellow-500/20 text-center">
                          >>> 仔细观察那些图案，在这里会发现某种规律....
                        </div>
                      )}
                   </div>
                </div>
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="relative min-h-screen py-24 sm:py-32 px-4 selection:bg-white selection:text-black">
            <div className="max-w-4xl mx-auto">
              {screen === 1 && (
                <div onClick={() => setScreen(2)} className="h-[60vh] sm:h-[70vh] flex flex-col items-center justify-center cursor-pointer animate-fade-in space-y-8 sm:space-y-12 bg-white/5 border border-white/10 p-6 sm:p-12 rounded backdrop-blur-md shadow-2xl relative overflow-hidden group">
                   <div className="space-y-6 sm:space-y-8 text-center max-w-2xl px-4">
                     <p className="font-mono text-white/60 text-lg sm:text-2xl leading-relaxed animate-typing-1 overflow-hidden">你已到达现实与虚拟的临界点。</p>
                     <p className="font-mono text-white text-2xl sm:text-4xl font-black italic tracking-tighter animate-typing-2 opacity-0 fill-mode-forwards leading-tight">最后一块碎片沉入了更深的地方。</p>
                   </div>
                   <p className="text-[10px] text-white/20 animate-pulse tracking-[0.4em] sm:tracking-[0.6em] uppercase mt-16 sm:mt-24">【点击继续 / DESCEND】</p>
                </div>
              )}
              {screen === 2 && (
                <div className="space-y-12 sm:space-y-20 animate-fade-in py-8 sm:py-12">
                   <div className="bg-black/60 border-l-4 border-white/40 p-8 sm:p-12 backdrop-blur-xl shadow-2xl space-y-8 sm:space-y-12">
                      <div className="font-mono space-y-4">
                         <h2 className="text-white/40 text-[10px] sm:text-sm tracking-[0.3em] sm:tracking-[0.5em] font-bold uppercase">&gt; 📍 坐标点 (COORDINATES):</h2>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-sm sm:text-xl">
                            <p className="text-white font-black italic">扇区: 底层网格 (Lower Grid)</p>
                            <p className="text-blue-400 font-bold uppercase">动作: 下潜 (DESCEND)</p>
                         </div>
                      </div>
                      <p className="font-mono text-lg sm:text-2xl leading-relaxed text-white/80 border-t border-white/5 pt-6 sm:pt-8 italic">不要停留在 G 层。 在<span className="text-white font-bold underline">“表象之下”</span>，你会找到被冻结在死循环中的舞者。</p>
                   </div>
                   <button onClick={() => setScreen(3)} className="w-full sm:w-auto flex items-center justify-center gap-4 sm:gap-6 px-10 sm:px-20 py-6 sm:py-10 border-2 border-white/20 text-white hover:bg-white hover:text-black transition-all font-black text-xl sm:text-3xl animate-slide-up opacity-0 fill-mode-forwards shadow-2xl active:scale-95 uppercase tracking-widest italic">🔘 目标已锁定 (I Found Her)</button>
                </div>
              )}
              {screen === 3 && (
                <div className={`space-y-16 sm:space-y-24 animate-fade-in py-8 sm:py-12 ${isShaking ? 'animate-shake' : ''}`}>
                   <div className="bg-black/80 border border-red-500/20 p-8 sm:p-12 rounded shadow-2xl relative overflow-hidden text-center">
                      <h3 className="text-red-500 font-black text-xl sm:text-2xl italic tracking-tighter mb-4 leading-tight">Grace 的动作数据是完整的，但她的“核心参数”被锁死了。</h3>
                      <p className="text-white/60 text-base sm:text-lg leading-relaxed font-mono">为了防止病毒修改，系统架构师将密码刻在了她<span className="text-white font-bold underline underline-offset-4">“背对着世界”</span>的那一面。</p>
                   </div>
                   
                   <div className="max-w-3xl mx-auto bg-black/60 border-2 border-green-500/30 p-6 sm:p-10 backdrop-blur-xl shadow-[0_0_30px_rgba(34,197,94,0.1)] rounded-sm relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-green-500/50"></div>
                      <h4 className="text-green-500 font-bold font-mono text-xs uppercase tracking-widest mb-4">>>> MISSION DATA:</h4>
                      <p className="text-white/80 text-sm sm:text-base font-mono leading-relaxed">
                        不要被她正面的假象迷惑。绕到她的背面。观察构成她身体的<span className="text-white font-bold">“三角数据网格”</span>。
                      </p>
                      <p className="text-white/80 text-sm sm:text-base font-mono leading-relaxed mt-4">
                        密码就藏在从头到脚的网格密度里。
                      </p>
                   </div>

                   <div className="bg-[#050505] border-2 border-white/10 p-4 sm:p-16 md:p-24 rounded shadow-[0_50px_150px_rgba(0,0,0,1)] space-y-12 sm:space-y-16">
                      <h2 className="text-center font-mono text-white text-2xl sm:text-4xl font-black italic tracking-tighter uppercase leading-tight">三阶转盘锁 (The Tri-Layer Lock)</h2>
                      <TriLayerLock onSuccess={() => { setFeedback({ text: '✔ 锁定已解除', sub: '核心数据已解锁。同步中...', color: 'text-green-500' }); setTimeout(nextLevel, 3000); }} playClick={playClick} onError={triggerError} />
                      <div className="text-center">
                        <button onClick={handleHintClick} className="text-[10px] sm:text-[11px] text-white/20 underline font-mono uppercase italic font-bold">>>> 解密骨架 (Decrypt Skeleton)</button>
                        {hintsVisible && (
                          <div className="max-w-2xl mx-auto text-yellow-500/80 font-mono text-xs sm:text-sm italic animate-fade-in mt-6 border-t border-white/5 pt-6">
                            >>> 观察雕塑背后的数字序列。按照 头部 -> 身体 -> 下半身 的顺序依次校准。
                          </div>
                        )}
                      </div>
                   </div>
                </div>
              )}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="relative min-h-screen py-24 sm:py-32 px-4 selection:bg-red-600 selection:text-white">
            <div className="max-w-4xl mx-auto">
              {screen === 1 && (
                <div onClick={() => setScreen(2)} className="h-[60vh] sm:h-[70vh] flex flex-col items-center justify-center cursor-pointer animate-fade-in space-y-8 sm:space-y-12 bg-red-900/10 border border-red-500/20 p-6 sm:p-12 rounded backdrop-blur-md shadow-2xl relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-full h-1 bg-red-600 animate-pulse"></div>
                   <div className="space-y-4 sm:space-y-6 text-center px-4">
                     <p className="font-mono text-red-500 text-2xl sm:text-4xl font-black italic tracking-tighter animate-pulse uppercase">⚠️ 系统警报 (SYSTEM ALERT)</p>
                     <p className="font-mono text-white/80 text-lg sm:text-2xl leading-relaxed">你已进入底层禁区。头顶是巨大的“僵尸鲸鱼”。</p>
                   </div>
                   <p className="text-[10px] text-white/20 animate-pulse tracking-[0.4em] sm:tracking-[0.6em] uppercase mt-16 sm:mt-24">【点击进入 / ACCESS ARCHIVE】</p>
                </div>
              )}
              {screen === 2 && (
                <div className="space-y-12 sm:space-y-16 animate-fade-in py-8 sm:py-12">
                   <div className="bg-black/80 border-l-4 border-red-600 p-8 sm:p-12 shadow-2xl space-y-6 sm:space-y-8">
                      <h2 className="text-white font-black text-3xl sm:text-5xl italic tracking-tighter">深渊典藏 (The Abyssal Archive)</h2>
                      <div className="h-px bg-white/10 w-full"></div>
                      <p className="font-mono text-xl sm:text-3xl leading-relaxed text-white/60 italic">尼采说：“当你在凝视深渊时，深渊也在凝望着你。”</p>
                   </div>
                   <button onClick={() => setScreen(3)} className="w-full sm:w-auto px-10 sm:px-16 py-6 sm:py-8 border-2 border-white/20 text-white hover:bg-white hover:text-black transition-all font-black text-xl sm:text-2xl animate-slide-up opacity-0 fill-mode-forwards shadow-xl active:scale-95 uppercase tracking-widest italic">🔘 我走到这里了 (I am here)</button>
                </div>
              )}
              {screen === 3 && (
                <div className={`space-y-16 sm:space-y-24 animate-fade-in py-8 sm:py-12 pb-32 sm:pb-48 ${isShaking ? 'animate-shake' : ''}`}>
                   <div className="bg-[#050505] border border-white/5 p-6 sm:p-16 rounded space-y-8 sm:space-y-12 shadow-inner max-h-[500px] overflow-y-auto custom-scrollbar">
                      <h3 className="text-white/40 font-mono uppercase tracking-[0.3em] sm:tracking-[0.5em] text-[10px] sm:text-sm font-bold">&gt; 任务数据 (MISSION DATA):</h3>
                      <div className="space-y-8 sm:space-y-10 font-mono text-base sm:text-xl leading-relaxed text-white/80 italic">
                        <p className="border-l-2 border-red-500/20 pl-6 py-2">
                          走到这具骸骨的正下方。抬头，凝视它那空无一物的胸腔——那是失去“心”后的深渊。
                        </p>
                        <p className="text-white/60 leading-relaxed text-sm sm:text-lg">
                          “……你正在凝视深渊的内部。曾经，这里跳动着 Eden 系统最核心的‘源数据心脏’。现在，它被挖空了，能量不属于它自己，而是顺着那些从天而降的银色丝线被强制注入的。每一根丝线，都是一路高压传输通道。即使心脏已死，回声依然存在。听……心跳的节奏，正在撞击着周围那些惨白弯曲的栅栏。每一根栅栏，都代表着一个共振的节拍。”
                        </p>
                        <div className="p-4 sm:p-8 border border-red-500/30 bg-red-900/5 space-y-4">
                           <p className="text-red-500 font-black animate-pulse uppercase tracking-widest text-xs sm:text-sm font-bold">&gt; 警告 (WARNING):</p>
                           <p className="text-red-400 font-bold text-sm sm:text-base leading-tight italic">💔 心脏衰竭 (HEART FAILURE): 源数据心脏已丢失。 请匹配电压 (V) 和 频率 (BPM) 后执行起搏协议。</p>
                        </div>
                      </div>
                   </div>
                   <div className="space-y-10 sm:space-y-12">
                      <div className="text-center space-y-4">
                        <h2 className="text-white font-black text-3xl sm:text-5xl italic tracking-tighter uppercase drop-shadow-2xl leading-tight">心脏起搏器 (The Defibrillator)</h2>
                      </div>
                      <HeartDefibrillator onSuccess={() => { setFeedback({ text: '✔ 系统苏醒', sub: '深渊之眼已点亮。核心能量回流。', color: 'text-white' }); setTimeout(nextLevel, 3000); }} playClick={playClick} onError={triggerError} />
                      <div className="flex flex-col items-center gap-6 gap-8 border-t border-white/5 pt-8 sm:pt-12">
                        <button onClick={handleHintClick} className="text-[10px] sm:text-[11px] text-white/20 underline font-mono uppercase italic font-bold">>>> 获取提示 (Access Log)</button>
                        {hintsVisible && (
                          <div className="max-w-2xl text-yellow-500/80 font-mono text-xs sm:text-sm italic animate-fade-in space-y-4 p-6 bg-yellow-900/5 border border-yellow-500/20">
                            <p>>>> 选择线路： 我们有多少根传输线缆可用？将左侧旋钮调至该数值。</p>
                            <p>>>> 计算频率： 整个胸腔的骨架共振点（骨头数量）是多少？将右侧旋钮调至该数值。</p>
                            <p>>>> 起搏： 并在参数匹配的瞬间，按下电击钮。</p>
                          </div>
                        )}
                      </div>
                   </div>
                </div>
              )}
            </div>
          </div>
        );

      case 7:
        return (
          <div className="relative min-h-screen pt-24 sm:pt-32 pb-24 px-4 bg-black selection:bg-green-500 selection:text-black font-mono">
            <div className="fixed top-16 sm:top-24 right-4 z-[1100]">
              <button 
                onClick={() => setL7Perspective(l7Perspective === 'A' ? 'B' : 'A')}
                className="px-4 py-2 bg-black/80 border border-green-500/50 text-green-500 text-xs font-bold hover:bg-green-500 hover:text-black transition-all shadow-[0_0_15px_rgba(0,255,0,0.2)] uppercase tracking-wider italic flex items-center gap-2"
              >
                👁️ 切换视角: 玩家 {l7Perspective === 'A' ? 'A' : 'B'}
              </button>
            </div>

            {l7Perspective === 'A' ? (
              <div className="max-w-5xl mx-auto space-y-8 sm:space-y-12 animate-fade-in">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                  <div className="space-y-2">
                    <h2 className="text-green-500 font-black text-2xl sm:text-4xl italic tracking-tighter uppercase">📥 正在下载源代码... [100%]</h2>
                    <p className="text-white/40 text-sm sm:text-lg border-l-2 border-green-500/30 pl-4">系统日志: 正在载入 Eden 系统的“原始备份影像”。</p>
                  </div>
                  <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-sm flex flex-col items-center">
                    <p className="text-[10px] text-green-500 uppercase tracking-widest font-bold mb-1">清除标记 (Purge Tokens)</p>
                    <div className="flex items-center gap-4">
                      <div className="w-32 h-2 bg-black rounded-full overflow-hidden border border-green-500/20">
                        <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${(l7Markers.length / 6) * 100}%` }}></div>
                      </div>
                      <span className="text-xl font-black text-blue-500">{l7Markers.length}/6</span>
                    </div>
                  </div>
                </div>

                <div 
                  className="relative w-full max-w-4xl mx-auto border-2 border-green-500/50 shadow-[0_0_20px_rgba(0,255,65,0.2)] overflow-hidden cursor-crosshair select-none"
                  onClick={handleL7ImageClick}
                >
                  <img src="https://i.imgur.com/KWZJGnn.jpg" alt="异常墙" className="w-full h-auto pointer-events-none" />
                  
                  {l7Markers.map((m, i) => (
                    <div 
                      key={i}
                      className="absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ top: `${m.y}%`, left: `${m.x}%` }}
                    >
                      <div className="absolute top-1/2 left-0 w-full h-px bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,1)]"></div>
                      <div className="absolute top-0 left-1/2 w-px h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,1)]"></div>
                      <div className="absolute inset-0 border border-blue-500 rounded-full scale-50 opacity-50"></div>
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] text-blue-400 font-black">标记_{i+1}</div>
                    </div>
                  ))}

                  {l7AnomaliesCleared.length === 6 && (
                    <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center animate-pulse border-4 border-green-500">
                      <span className="text-green-500 font-black text-4xl sm:text-7xl uppercase italic tracking-widest drop-shadow-[0_0_20px_rgba(0,255,0,1)] text-center px-4">源代码完整性已恢复</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-center gap-8">
                  {l7Markers.length === 6 && l7AnomaliesCleared.length < 6 && (
                    <button 
                      onClick={handleExecutePurge}
                      className="px-16 py-6 bg-green-600 text-black font-black text-2xl sm:text-4xl hover:bg-green-400 transition-all animate-pulse shadow-[0_0_50px_rgba(0,0,0,0.3)] uppercase italic"
                    >
                      执行清除 (EXECUTE PURGE)
                    </button>
                  )}
                  {l7Markers.length > 0 && l7AnomaliesCleared.length < 6 && (
                    <button 
                      onClick={() => setL7Markers([])}
                      className="text-xs text-white/40 hover:text-white underline font-bold uppercase tracking-widest"
                    >
                      重置所有标记 (RESET MARKERS)
                    </button>
                  )}
                </div>

                <div className="bg-black/80 border-2 border-white/5 p-6 sm:p-10 space-y-6 shadow-2xl">
                   <div className="p-4 sm:p-6 border border-yellow-500/30 bg-yellow-500/5 flex items-start gap-4">
                      <span className="text-xl sm:text-2xl">⚠️</span>
                      <p className="text-xs sm:text-base text-yellow-500/90 font-bold leading-relaxed italic uppercase">
                        标记并清除: 锁定所有 6 处逻辑奇点。 一次错误的清除将导致系统重置标记。
                      </p>
                   </div>
                   <div className="space-y-4">
                      <p className="text-green-400 font-black text-lg sm:text-2xl uppercase italic tracking-widest">动作: 在图中所有“异常”像素块上放置 6 个标记。</p>
                      <button onClick={handleHintClick} className="text-[10px] sm:text-xs text-white/20 underline hover:text-white transition-colors uppercase italic font-bold tracking-[0.2em]">>>> 获取提示 (SCAN SUGGESTION)</button>
                      {hintsVisible && (
                        <p className="text-xs sm:text-sm text-white/60 italic leading-relaxed animate-fade-in border-l-2 border-white/20 pl-4 mt-2">
                          提示：病毒伪装成了笔触。 共有 6 处异常。 仔细对比每一个画框。
                        </p>
                      )}
                   </div>
                </div>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto space-y-12 sm:space-y-20 animate-fade-in flex flex-col items-center">
                <div className="w-full space-y-6">
                   {l7AnomaliesCleared.length === 6 ? (
                     <div className="p-6 sm:p-8 border-2 border-green-500/50 bg-green-950/20 text-green-500 font-bold flex items-start gap-4 shadow-[0_0_30px_rgba(34,197,94,0.2)] transition-all rounded">
                        <span className="text-xl sm:text-3xl">✔</span>
                        <div className="space-y-2">
                          <p className="text-sm sm:text-xl leading-relaxed uppercase italic font-black">视觉层异常已清除。</p>
                          <p className="text-xs sm:text-base opacity-80 uppercase">玩家 A 已完成其任务。 存在主义逻辑锁现可解开，请破解方程式。</p>
                        </div>
                     </div>
                   ) : (
                     <div className="p-6 sm:p-8 border-2 border-red-500/30 bg-red-950/20 text-red-500 font-bold flex items-start gap-4 shadow-2xl transition-all rounded">
                        <span className="text-xl sm:text-2xl">⚠️</span>
                        <div className="space-y-2">
                          <p className="text-xs sm:text-lg leading-relaxed uppercase italic font-black tracking-tight">等待玩家 A 清除视觉异常...</p>
                          <p className="text-[10px] sm:text-sm opacity-60 uppercase">你已进入底层禁区。 视觉层 (Visual Layer) 仍被异常阻塞，只有玩家 A 恢复源码后，你的终端才能最终通过验证。</p>
                        </div>
                     </div>
                   )}
                   <div className="space-y-4">
                      <p className="text-white/60 text-sm sm:text-xl leading-relaxed italic border-l-2 border-white/20 pl-6">
                        任务: 站在画廊正前方。 扫描这面由无数画框组成的“数据库”。 系统给出了一道无法被暴力破解的方程式：
                      </p>
                   </div>
                </div>

                <div className="w-full bg-[#050505] border-4 border-white/5 p-10 sm:p-20 rounded shadow-2xl space-y-12 sm:space-y-16 flex flex-col items-center">
                  <div className="text-center space-y-6 w-full">
                    <h3 className="text-white/40 text-xs sm:text-sm uppercase tracking-[0.5em] font-black italic">[ 逻辑方程式 (THE EQUATION) ]</h3>
                    <div className="text-4xl sm:text-7xl font-black text-white italic tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.3)] uppercase">
                      Σ (孤独) + Σ (虚无) = 🔓
                    </div>
                  </div>

                  <div className="w-full max-w-md space-y-6 sm:space-y-8 p-8 sm:p-12 bg-white/5 border border-white/10 shadow-inner">
                    <label className="block text-[10px] sm:text-sm text-white/40 font-bold uppercase tracking-[0.3em] mb-4 text-center italic">输入: 绝对孤独 + 白色虚无 = ？</label>
                    <input type="text" className="w-full h-16 sm:h-24 bg-black border-2 border-white/20 text-4xl sm:text-7xl font-black text-center text-white focus:border-green-500 outline-none transition-all shadow-inner tracking-widest" placeholder="??" value={l7BInput} onChange={(e) => setL7BInput(e.target.value.replace(/\D/g, ''))} onKeyDown={(e) => e.key === 'Enter' && checkLevel7B()} />
                    <button onClick={checkLevel7B} className="w-full py-6 sm:py-8 bg-white text-black font-black text-xl sm:text-3xl hover:bg-green-500 transition-all active:scale-95 uppercase italic tracking-widest shadow-2xl">验证 (Verify)</button>
                  </div>

                  <div className="flex flex-col items-center gap-6">
                    <button onClick={handleHintClick} className="text-[10px] sm:text-xs text-white/20 underline hover:text-white transition-colors uppercase italic font-bold tracking-[0.2em]">>>> 获取提示 (GET HINTS)</button>
                    {hintsVisible && (
                      <div className="max-w-xl text-yellow-500/80 font-mono text-xs sm:text-sm italic animate-fade-in space-y-4 p-6 bg-yellow-900/5 border border-yellow-500/20 whitespace-pre-wrap leading-relaxed">
                        <p className="font-bold text-yellow-500 underline mb-2 uppercase">数据挖掘日志 (DATA MINING LOG):</p>
                        “……不要被色彩的表象迷惑。在系统的眼里，这面墙上只有两种有意义的状态。
                        
                        第一种变量叫**【孤独 (Solitude)】： 去检索那些被囚禁在画框里的‘独行者’**。 画面里只有唯一的灵魂。
                        
                        第二种变量叫**【虚无 (Void)】： 去检索那些大面积留白或主色调为白色的画卷。**
                        
                        注意： 只有当玩家 A 完成视觉异常清除后，你的答案才会被系统接纳。”
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 8:
        return (
          <div className="relative min-h-screen pt-24 pb-32 px-4 bg-black font-mono selection:bg-red-600">
            <div className="max-w-4xl mx-auto space-y-12">
              {screen === 1 && (
                <div className="animate-fade-in space-y-12">
                  <div className="p-8 sm:p-16 border-2 border-red-500/30 bg-red-950/10 rounded shadow-2xl space-y-8">
                    <h2 className="text-red-500 font-black text-3xl sm:text-5xl italic tracking-tighter uppercase leading-tight animate-pulse">LEVEL 8：THE WITCH HUNT (女巫审判)⚠️</h2>
                    <p className="text-white/80 text-lg sm:text-2xl leading-relaxed italic border-l-4 border-white/20 pl-8 py-4">
                      寻找一个<span className="text-white font-bold underline">“时空错乱的节点”</span>。 在 黑色的旧时代鸭子和 彩色的新时代鸭子 之间，有一面贴满了通缉令的墙。
                    </p>
                    <div className="p-4 sm:p-6 bg-red-900/20 border border-red-500/40 rounded">
                      <p className="text-red-400 font-bold text-sm sm:text-base leading-relaxed">
                        警告： 这里混入了一个拥有自我意识的病毒，它伪装成了其中一张海报。
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <button 
                      onClick={() => setScreen(2)}
                      className="px-12 py-6 border-2 border-white/20 text-white font-black text-xl hover:bg-white hover:text-black transition-all shadow-xl active:scale-95 uppercase tracking-widest italic"
                    >
                      🔘 我已找到海报墙
                    </button>
                  </div>
                </div>
              )}

              {screen === 2 && (
                <div className="animate-fade-in space-y-12 pb-32">
                  <div className="bg-black/80 border-2 border-white/10 p-8 sm:p-12 shadow-2xl space-y-8">
                    <div className="space-y-4">
                      <h3 className="text-white/40 text-xs sm:text-sm font-bold uppercase tracking-[0.4em] border-b border-white/10 pb-2">案件背景 (CASE BRIEF)</h3>
                      <p className="text-white/70 text-base sm:text-lg leading-relaxed italic">
                        SYSTEM ADMIN: “听着，刚才系统发生了一次严重的**‘越权访问’事件**。 这里的某个病毒，在 昨天深夜，擅自启动了 ‘复方汤剂’ 程序，复制了我的管理员权限。
                        那个病毒，会在逻辑上犯下人类不会犯的错误。”
                      </p>
                    </div>

                    <div className="space-y-8">
                      <h3 className="text-white/40 text-xs sm:text-sm font-bold uppercase tracking-[0.4em] border-b border-white/10 pb-2">审讯记录 (LOGS)</h3>
                      <div className="space-y-6">
                        {[
                          { name: 'Voldemort (伏地魔)', log: '“复方汤剂？这种魔法我听过，但我不需要偷偷摸摸。我坦白的告诉你，如果是我干的，我会直接把你的服务器烧成灰烬。”' },
                          { name: 'Harry Potter (哈利波特)', log: '“这简直是污蔑！昨天深夜我一直在校长办公室接受禁闭。 Snape 当时就在我旁边，他盯着我抄写了一晚上的校规。 如果我用了那个程序，他肯定会发现的！”' },
                          { name: 'Bellatrix (贝拉特里克斯)', log: '“哈哈哈哈！你们在怀疑我？ 我根本不需要那种低级的魔药！ 我昨晚正忙着和 Fenrir 在禁林里追捕泥巴种。 那个狼人当时饿极了，我们一整晚都在一起狩猎。”' },
                          { name: 'Fenrir Greyback (芬里尔·狼人)', log: '“昨晚我确实在禁林。月亮、血腥味、猎物——这才是我关心的事。至于你们说的什么‘复方汤剂’？我对人类的魔药没兴趣。那种东西……闻起来就不对，又腥又甜，还带点旧皮革的味道。我怎么可能会去碰？”' },
                          { name: 'Severus Snape (斯内普)', log: '“Potter 说得没错（虽然我很不想承认）。 昨晚 he 确实一直被我关在办公室里，直到黎明。 我那双眼睛一直盯着他，他没有离开过半步，更不可能去搞什么**‘变身’**把戏。”' },
                          { name: 'Sirius Black (小天狼星·布莱克)', log: '“我又没有魔杖！我这十二年都在阿兹卡班或者逃亡，哪来的本事搞出什么复方汤剂？”' }
                        ].map((s, idx) => (
                          <div key={idx} className="p-4 sm:p-6 bg-white/5 border-l-2 border-white/10 hover:border-red-500 transition-colors">
                            <h4 className="text-red-500 font-black text-sm sm:text-base mb-2 uppercase tracking-widest">{s.name}:</h4>
                            <p className="text-white/80 text-sm sm:text-base leading-relaxed italic">{s.log}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-12 border-t border-white/10 space-y-8">
                      <div className="text-center">
                        <p className="text-white font-black text-xl sm:text-3xl italic tracking-tighter mb-8">找出那个“不打自招”的嫌疑人。</p>
                        <div className="max-w-md mx-auto space-y-6">
                          <input 
                            className="w-full h-16 sm:h-20 bg-black border-2 border-white/20 text-center text-xl sm:text-3xl font-black text-white focus:border-red-500 outline-none transition-all tracking-wider"
                            placeholder="输入嫌疑人名字..."
                            value={l8Input}
                            onChange={(e) => setL8Input(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && checkLevel8()}
                          />
                          <button 
                            onClick={checkLevel8}
                            className="w-full py-4 sm:py-6 bg-red-600 text-white font-black text-xl hover:bg-red-500 transition-all active:scale-95 uppercase tracking-[0.2em] italic shadow-2xl"
                          >
                            执行审判 (EXECUTE JUDGMENT)
                          </button>
                          <div className="flex flex-col items-center gap-4">
                            <button onClick={handleHintClick} className="text-[10px] sm:text-xs text-white/20 underline hover:text-white transition-colors uppercase italic font-bold tracking-[0.2em]">>>> 获取提示 (GET HINT)</button>
                            {hintsVisible && (
                              <div className="p-4 bg-yellow-900/10 border border-yellow-500/20 text-yellow-500/80 text-xs sm:text-sm italic leading-relaxed animate-fade-in">
                                >>> 提示：病毒会犯人类不会犯的错误——比如，在否认时暴露了“第一手体验”。
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 9:
        return (
          <div className="relative min-h-screen pt-24 pb-32 px-4 bg-black font-mono selection:bg-blue-600">
            <div className="max-w-4xl mx-auto space-y-12">
              {screen === 1 && (
                <div className="animate-fade-in space-y-12 py-12">
                  <div className="p-8 sm:p-16 border-2 border-blue-500/30 bg-blue-950/10 rounded shadow-2xl space-y-8">
                     <p className="text-white/80 text-lg sm:text-2xl leading-relaxed italic border-l-4 border-blue-500/40 pl-8 py-4">
                       “病毒已被隔离，但在被捕获的瞬间，它通过**‘溢出攻击’震碎了附近的现实图层，但系统的‘时间缓存’**依然残留在镜子里。”
                     </p>
                     <p className="text-blue-500 font-black text-sm sm:text-base uppercase tracking-widest">
                       📍 LOCATION (坐标): 离开通缉令墙，寻找那个**“被遗忘的祭坛”**。 标志物：枯枝、黑色的蜡烛、一本《Witches》之书，以及高悬头顶的 苍白鹿骨 (Pale Skull)。
                     </p>
                  </div>
                  <div className="flex flex-col items-center gap-6">
                    <p className="text-[10px] text-white/80 animate-pulse tracking-[0.6em] uppercase">正在加载最终章节...</p>
                    <button 
                      onClick={() => setScreen(2)}
                      className="px-12 py-6 bg-white text-black font-black text-xl hover:bg-blue-500 transition-all shadow-xl active:scale-95 uppercase tracking-widest italic"
                    >
                      🔘 初始化链接
                    </button>
                  </div>
                </div>
              )}

              {screen === 2 && (
                <div className="animate-fade-in space-y-12">
                   <div className="p-8 bg-black border border-white/10 rounded shadow-2xl space-y-8">
                      <h2 className="text-white font-black text-2xl sm:text-4xl italic uppercase tracking-tighter border-b border-white/10 pb-4">MISSION: 重置系统时钟</h2>
                      <div className="space-y-6 text-white/60 text-sm sm:text-lg leading-relaxed italic">
                        <p>抬头看那具鹿骨 (Skull)。它空洞的眼眶正盯着下方的一面镜子。 请站在镜子前，保持静止 (Stand Still)。 从左向右，读取镜面反射出的齿轮编号。</p>
                        <div className="p-4 border border-blue-500/20 bg-blue-500/5 rounded">
                          <p className="text-blue-400 font-bold mb-2">🔓 DECODING PROTOCOL (解码协议):</p>
                          <ul className="list-disc pl-6 space-y-2 text-xs sm:text-sm">
                            <li>时钟 = [ 分隔符 / 空格 ]</li>
                            <li>单数 = [ 点 ( • ) ]</li>
                            <li>双数 = [ 划 ( — ) ]</li>
                          </ul>
                        </div>
                      </div>

                      <div className="space-y-8 pt-8 border-t border-white/10">
                        <div className="max-w-md mx-auto space-y-6">
                          <label className="block text-center text-xs text-white/40 uppercase font-bold tracking-widest">请输入破译后的 4 位字母代码:</label>
                          <input 
                            className="w-full h-16 sm:h-20 bg-black border-2 border-white/20 text-center text-2xl sm:text-4xl font-black text-white focus:border-blue-500 outline-none transition-all tracking-[0.5em] uppercase"
                            placeholder="????"
                            maxLength={4}
                            value={l9Code}
                            onChange={(e) => setL9Code(e.target.value.toUpperCase())}
                            onKeyDown={(e) => e.key === 'Enter' && checkLevel9Code()}
                          />
                          <button 
                            onClick={checkLevel9Code}
                            className="w-full py-4 sm:py-6 bg-blue-600 text-white font-black text-xl hover:bg-blue-500 transition-all active:scale-95 uppercase italic shadow-2xl"
                          >
                            执行破译
                          </button>
                          <div className="flex flex-col items-center gap-4">
                            <button onClick={handleHintClick} className="text-[10px] sm:text-xs text-white/20 underline hover:text-white transition-colors uppercase italic font-bold tracking-[0.2em]">>>> 获取提示</button>
                            {hintsVisible && (
                              <div className="p-4 bg-yellow-900/10 border border-yellow-500/20 text-yellow-500/80 text-xs sm:text-sm italic leading-relaxed animate-fade-in">
                                >>> 提示：站在靠近鹿角下的镜子前，里面反射出的那面齿轮墙... 转头看看这些齿轮可以代表什么数字？注意是左到右，总共有12个齿轮。把他们代表的号码都写下来，再翻译成摩斯密码。
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                   </div>
                </div>
              )}

              {screen === 3 && (
                <div className="animate-fade-in space-y-8 py-8 flex flex-col items-center">
                   <div className="w-full text-center space-y-4">
                     <h2 className="text-white font-black text-4xl sm:text-6xl italic tracking-tighter uppercase drop-shadow-2xl">碎片重组 (Data Integration)</h2>
                     <p className="text-white/40 font-mono text-xs sm:text-sm uppercase tracking-[0.3em]">拖拽乱飘的字母进入中央核心以修复系统。</p>
                   </div>
                   <DataIntegration 
                     playClick={playClick} 
                     onComplete={() => setScreen(4)} 
                   />
                </div>
              )}

              {screen === 4 && (
                <div 
                  onClick={() => setScreen(5)}
                  className="fixed inset-0 z-[5000] bg-black flex flex-col items-center justify-center p-8 animate-fade-in cursor-pointer"
                >
                  <div className="space-y-6 text-center">
                    <p className="text-white/80 text-lg sm:text-2xl font-mono animate-pulse">“不要看屏幕。看着倒影。”</p>
                    <p className="text-white/40 text-xs sm:text-sm font-mono tracking-[0.5em] uppercase">“那个正在凝视你的人，就是代码。”</p>
                  </div>
                  <div className="mt-20 p-8 border border-white/10 bg-white/5 animate-slide-up-delayed">
                    <p className="text-green-500 font-bold font-mono text-xs sm:text-sm uppercase tracking-widest text-center">
                      SYSTEM NOTIFICATION: [ E.G.O.M. ] 确认。<br/>
                      你看见了自己，也看见了机器。镜像维度正在坍塌...
                    </p>
                  </div>
                  <p className="fixed bottom-12 text-[10px] text-white/20 animate-pulse tracking-[0.8em] uppercase">【点击裂开现实】</p>
                </div>
              )}

              {screen === 5 && (
                <div className="animate-fade-in space-y-16 py-12 flex flex-col items-center">
                  <div className="text-center space-y-6">
                    <h1 className="text-5xl sm:text-8xl font-black italic text-white tracking-tighter uppercase animate-slide-up">MISSION COMPLETE</h1>
                    <div className="h-1 bg-white w-full max-w-lg mx-auto shadow-[0_0_20px_rgba(255,255,255,0.5)]"></div>
                  </div>
                  
                  <button 
                    onClick={() => setShowFinalLog(true)}
                    className="p-8 bg-white/5 border-2 border-white/20 hover:bg-white hover:text-black transition-all group relative active:scale-95 shadow-2xl"
                  >
                    <span className="text-4xl">📖</span>
                    <p className="text-[10px] mt-4 font-mono font-black uppercase tracking-widest opacity-40 group-hover:opacity-100">Read Final Log</p>
                  </button>

                  <div className="mt-20">
                    <button 
                      onClick={() => nextLevel()}
                      className="text-base text-white/20 hover:text-red-500 transition-all font-mono tracking-[0.3em] uppercase italic underline decoration-white/20 hover:decoration-red-500 hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] active:scale-95 duration-300"
                    >
                      > _挑战_开发者的试炼?
                    </button>
                  </div>

                  {showFinalLog && (
                    <div className="fixed inset-0 z-[6000] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl animate-fade-in">
                       <div className="max-w-2xl w-full bg-black border-2 border-white/20 p-8 sm:p-12 space-y-8 relative shadow-2xl overflow-y-auto max-h-[80vh]">
                          <button onClick={() => setShowFinalLog(false)} className="absolute top-4 right-4 text-white/40 hover:text-white text-xl">✕</button>
                          <h2 className="text-white font-black text-2xl uppercase tracking-widest border-b border-white/10 pb-4 italic">FINAL LOG (特工日志)</h2>
                          <div className="space-y-6 text-white/80 font-mono leading-relaxed text-sm sm:text-base italic">
                            <p>“做得好，记忆修复师。”</p>
                            <p>你重启了心脏 (Heart)，找回了被遗忘的艺术，修正了被篡改的历史，并最终在镜子中认清了系统的机器的自我幽灵。</p>
                            <p>Eden 服务器的备份已更新。虽然这里的某些数据依然是假的（比如那些不会凋谢的花），但你刚刚修复的这段记忆，是真实的。</p>
                            <p className="text-white font-bold border-l-2 border-white/40 pl-4 py-2 mt-8">
                              “代码是暂时的，记忆是永恒的。在这个由像素组成的商场里，你找到了那颗跳动的核心。”
                            </p>
                          </div>
                          <button onClick={() => setShowFinalLog(false)} className="w-full py-4 border border-white/20 text-white font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all mt-8">CLOSE_LOG</button>
                       </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      case 10:
        return (
          <div className="relative min-h-screen flex flex-col bg-[#050505] font-mono text-white selection:bg-red-600 overflow-hidden">
             {/* Background Matrix/Glow */}
             <div className="fixed inset-0 pointer-events-none opacity-20">
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.2)_0%,transparent_70%)]"></div>
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
             </div>

             {/* Persistently Visible Perspective Toggle */}
             <div className="fixed top-16 sm:top-24 right-4 z-[5000]">
                <button 
                  onClick={() => setL10Perspective(l10Perspective === 'A' ? 'B' : 'A')}
                  className="px-6 py-3 bg-red-600/20 border-2 border-red-600 text-red-500 font-black hover:bg-red-600 hover:text-black transition-all shadow-[0_0_25px_rgba(220,38,38,0.5)] uppercase italic tracking-widest flex items-center gap-3 scale-110"
                >
                  👁️ {l10Perspective === 'A' ? '查看玩家 B 界面' : '查看玩家 A 界面'}
                </button>
             </div>

             <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative z-10">
               {screen === 1 && (
                 <div className="max-w-3xl w-full space-y-12 animate-fade-in">
                    <div className="p-8 sm:p-16 border-2 border-red-600/40 bg-red-950/10 rounded shadow-[0_0_100px_rgba(220,38,38,0.1)] space-y-8 relative overflow-hidden">
                       <div className="absolute top-0 left-0 w-full h-1 bg-red-600 animate-pulse shadow-[0_0_15px_rgba(220,38,38,1)]"></div>
                       <h2 className="text-red-500 font-black text-3xl sm:text-6xl italic tracking-tighter uppercase">🕵️‍♂️ BONUS STAGE: THE DEVELOPER'S LEGACY</h2>
                       <div className="space-y-6 text-white/80 font-mono text-base sm:text-xl leading-relaxed italic">
                         <p className="text-red-600 font-black">⚠️ WARNING: HIGH DIFFICULTY ZONE</p>
                         <p>特工，你的任务已经圆满完成。世界已安全。</p>
                         <p>但系统扫描到<span className="text-white font-bold">“深渊典藏（The Abyssal Archive）”</span>的角落里，还有一台未注册的老旧终端正在运行。 那是架构师留下的私人日志，与主线任务无关。</p>
                         <p className="text-red-400 font-bold border-l-2 border-red-600/40 pl-6">
                           该加密复杂，且没有自动导航。 只有最执着、最渴望真相的特工才能解开它。
                         </p>
                       </div>
                       <div className="flex flex-col sm:flex-row gap-6 pt-12">
                          <button onClick={onExit} className="flex-1 py-6 border-2 border-white/10 text-white font-black hover:bg-white hover:text-black transition-all uppercase italic tracking-widest">[ 算了，我累了 ]</button>
                          <button onClick={() => setScreen(2)} className="flex-1 py-6 bg-red-600 text-white font-black hover:bg-red-500 transition-all shadow-2xl uppercase italic tracking-widest">[ 带我去看看 ]</button>
                       </div>
                    </div>
                 </div>
               )}

               {screen === 2 && l10Perspective === 'A' && (
                 <div className="max-w-4xl w-full flex flex-col items-center gap-12 animate-fade-in py-16">
                    <div className="w-full bg-[#0a0a0a] border-2 border-white/10 p-8 sm:p-12 rounded shadow-2xl relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-4 font-mono text-[8px] sm:text-[10px] text-white/10 uppercase tracking-widest">TYPE: PROTOTYPE_CONSOLE_V0.1</div>
                       <h3 className="text-white font-black text-xl sm:text-2xl italic tracking-tighter mb-8 flex items-center gap-4">
                         <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></span>
                         🕹️ 装置名称：【生命轨迹覆写台】
                       </h3>
                       <div className="bg-white/5 p-6 rounded border border-white/10 font-mono text-sm sm:text-base text-white/60 leading-relaxed italic border-l-4 border-yellow-500/50 mb-12 relative">
                         “这是一台被时代淘汰的原型机。它的操作手感很糟糕，没有容错，就像我们要面对的真实人生一样。—— The Architect”
                         <div className="absolute -top-4 -right-4 bg-yellow-400 text-black px-4 py-1 text-[10px] font-black rotate-3 shadow-lg uppercase">ARCHITECT'S NOTE</div>
                       </div>
                       
                       <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                          <div className="space-y-8">
                             <div className="bg-black border-2 border-green-900/50 p-6 sm:p-10 shadow-inner rounded relative overflow-hidden min-h-[250px] flex flex-col justify-center">
                                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] pointer-events-none z-10"></div>
                                <div className="relative z-20 font-mono space-y-4">
                                   <div className="flex justify-between items-center text-[10px] text-green-500/40 font-bold uppercase tracking-[0.3em]">
                                      <span>STATUS: {l10Ignited ? 'ONLINE' : 'BOOT_READY'}</span>
                                      <span>PHASE {l10Phase + 1} / 5</span>
                                   </div>
                                   <div className="h-2 bg-green-900/20 w-full overflow-hidden border border-green-500/10">
                                      <div className="h-full bg-green-500 transition-all duration-1000 shadow-[0_0_15px_rgba(0,255,0,0.5)]" style={{ width: `${(l10Phase / 5) * 100}%` }}></div>
                                   </div>
                                   <div className="flex flex-col gap-4 pt-6">
                                      <div className="flex justify-between items-center">
                                         <span className="text-green-500 font-bold text-xs uppercase tracking-widest">当前轨迹 (Trace):</span>
                                         <div className="flex gap-2">
                                            {l10Sequences[l10Phase].map((_, i) => (
                                              <div key={i} className={`w-6 h-6 sm:w-8 sm:h-8 border-2 transition-all flex items-center justify-center font-black ${l10InputBuffer[i] ? 'bg-green-500 border-green-500 text-black' : 'border-green-500/20 text-green-500/10'}`}>
                                                {l10InputBuffer[i] === 'U' ? '^' : l10InputBuffer[i] === 'D' ? 'v' : l10InputBuffer[i] === 'L' ? '<' : l10InputBuffer[i] === 'R' ? '>' : '?'}
                                              </div>
                                            ))}
                                         </div>
                                      </div>
                                      <div className="flex gap-1 justify-center mt-6">
                                         {l10PhasesCompleted.map((done, i) => (
                                           <div key={i} className={`w-8 h-2 sm:w-16 sm:h-4 rounded-sm transition-all ${done ? 'bg-green-500 shadow-[0_0_20px_rgba(34,197,94,1)]' : 'bg-green-900/20'}`}></div>
                                         ))}
                                      </div>
                                   </div>
                                </div>
                             </div>
                             <div className="p-6 bg-red-900/10 border border-red-500/20 rounded font-mono text-[10px] sm:text-xs text-red-500/80 uppercase space-y-2 leading-relaxed">
                                <p className="font-bold underline text-red-500">🕹️ 核心操作指南 (OPERATIONS):</p>
                                <p>1. 启动引擎 (IGNITION): ⚪ 推杆 向上 (UP) 并保持，直至系统联机。</p>
                                <p>2. 轨迹校准 (CALIBRATION): ⚪ 快速拨动 左右 或 下。</p>
                                <p>3. 物理反馈: 听到“啪”声回中后方可进行下一次输入。错误将导致重置。</p>
                                <p className="mt-4 italic text-white/40">⚡ 手感提示：摇杆很有弹性，拨动后让它自己弹回中间，不要一直推着不放。</p>
                             </div>
                          </div>
                          <div className="flex justify-center flex-col items-center gap-6">
                             <MechanicalJoystick onInput={handleLevel10JoystickInput} playClick={playClick} />
                             <p className="text-white/20 font-mono text-[8px] uppercase tracking-widest">Mechanical High-Tension Joystick V.1</p>
                          </div>
                       </div>
                    </div>
                 </div>
               )}

               {screen === 2 && l10Perspective === 'B' && (
                 <div className="max-w-4xl w-full animate-fade-in py-16 px-4">
                    <div className="bg-[#0a0a0a] border-2 border-red-600/30 p-8 sm:p-12 rounded shadow-[0_50px_100px_rgba(0,0,0,0.8)] space-y-12 relative overflow-hidden">
                       <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5"></div>
                       <div className="flex justify-between items-start relative z-10">
                          <h2 className="text-red-500 font-black text-2xl sm:text-4xl italic tracking-tighter uppercase border-l-4 border-red-600 pl-6">LIFE_LOG_V7.0 (BETA)</h2>
                          <div className="text-[10px] text-red-500 font-bold uppercase tracking-widest animate-pulse">正在校准人生轨迹...</div>
                       </div>

                       <div className="bg-red-950/20 p-6 border border-red-500/30 font-mono text-xs sm:text-sm text-red-400 italic mb-8 relative z-10">
                         “此程序一旦启动，无法中途退出。 你需要那张**‘泛美航空机票’**作为密钥。 如果你没有它，或者不想面对那些艰难的时刻，请现在拔掉电源。”
                       </div>

                       <div className="space-y-12 font-mono text-sm sm:text-lg leading-relaxed text-white/70 italic relative z-10">
                          <div className={`p-6 border border-white/5 transition-all ${l10Phase >= 0 ? 'bg-white/10 text-white/90 border-red-500/50' : 'opacity-20'}`}>
                             <p className="text-red-500 font-black mb-4 uppercase text-xs tracking-[0.3em]">>>> [ PHASE 1 ] 我们都始于 少年 (Young Adults) ...</p>
                             <p>“这条路途并不简单... [ ^ ]  [  ] [  ] [  ]。”</p>
                             <div className="flex gap-3 mt-6">
                                {[...Array(4)].map((_, i) => (
                                  <div key={i} className={`w-10 h-10 border-2 border-white/20 flex items-center justify-center text-xl font-black ${l10PhasesCompleted[0] ? 'bg-green-600 border-green-600 text-black animate-pulse' : 'text-white/10'}`}>
                                    {l10PhasesCompleted[0] ? '✔' : '□'}
                                  </div>
                                ))}
                             </div>
                          </div>

                          <div className={`p-6 border border-white/5 transition-all ${l10Phase >= 1 ? 'bg-white/10 text-white/90 border-red-500/50' : 'opacity-10'}`}>
                             <p className="text-red-500 font-black mb-4 uppercase text-xs tracking-[0.3em]">>>> [ PHASE 2 ] 你会经历 两次至暗时刻 (2 Dark Times) ...</p>
                             <p> [  ] [  ] [  ] [  ] [  ] [  ]。”</p>
                             <div className="flex gap-3 mt-6">
                                {[...Array(6)].map((_, i) => (
                                  <div key={i} className={`w-10 h-10 border-2 border-white/20 flex items-center justify-center text-xl font-black ${l10PhasesCompleted[1] ? 'bg-green-600 border-green-600 text-black animate-pulse' : 'text-white/10'}`}>
                                    {l10PhasesCompleted[1] ? '✔' : '□'}
                                  </div>
                                ))}
                             </div>
                          </div>

                          <div className={`p-6 border border-white/5 transition-all ${l10Phase >= 2 ? 'bg-white/10 text-white/90 border-red-500/50' : 'opacity-10'}`}>
                             <p className="text-red-500 font-black mb-4 uppercase text-xs tracking-[0.3em]">>>> [ PHASE 3 ] 途中会有许多过客擦肩而过 ...</p>
                             <p>“左右摇摆是成长的必经之路。 [  ] [  ] [  ] [  ] 但不要放弃，这是最后的平衡练习。”</p>
                             <div className="flex gap-3 mt-6">
                                {[...Array(4)].map((_, i) => (
                                  <div key={i} className={`w-10 h-10 border-2 border-white/20 flex items-center justify-center text-xl font-black ${l10PhasesCompleted[2] ? 'bg-green-600 border-green-600 text-black animate-pulse' : 'text-white/10'}`}>
                                    {l10PhasesCompleted[2] ? '✔' : '□'}
                                  </div>
                                ))}
                             </div>
                          </div>

                          <div className={`p-6 border border-white/5 transition-all ${l10Phase >= 3 ? 'bg-white/10 text-white/90 border-red-500/50' : 'opacity-10'}`}>
                             <p className="text-red-500 font-black mb-4 uppercase text-xs tracking-[0.3em]">>>> [ PHASE 4 ] 哪怕只有自己，也要保持航向 ...</p>
                             <p> [  ] [ &lt; ] [ &lt; ]。那是通往真相的唯一偏见。”</p>
                             <div className="flex gap-3 mt-6">
                                {[...Array(3)].map((_, i) => (
                                  <div key={i} className={`w-10 h-10 border-2 border-white/20 flex items-center justify-center text-xl font-black ${l10PhasesCompleted[3] ? 'bg-green-600 border-green-600 text-black animate-pulse' : 'text-white/10'}`}>
                                    {l10PhasesCompleted[3] ? '✔' : '□'}
                                  </div>
                                ))}
                             </div>
                          </div>

                          <div className={`p-6 border border-white/5 transition-all ${l10Phase >= 4 ? 'bg-white/10 text-white/90 border-red-500/50' : 'opacity-10'}`}>
                             <p className="text-red-500 font-black mb-4 uppercase text-xs tracking-[0.3em]">>>> [ FINAL ] 直到看见 深渊典藏 ...</p>
                             <p> [  ] [  ]，那便是终点。”</p>
                             <div className="flex gap-3 mt-6">
                                {[...Array(2)].map((_, i) => (
                                  <div key={i} className={`w-10 h-10 border-2 border-white/20 flex items-center justify-center text-xl font-black ${l10PhasesCompleted[4] ? 'bg-green-600 border-green-600 text-black animate-pulse' : 'text-white/10'}`}>
                                    {l10PhasesCompleted[4] ? '✔' : '□'}
                                  </div>
                                ))}
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
               )}

               {screen === 3 && (
                 <div className="max-w-4xl w-full animate-fade-in flex flex-col items-center justify-center p-12 text-center bg-[#0a0a0a] border-4 border-white/10 rounded shadow-2xl relative overflow-hidden min-h-[60vh]">
                    <div className="absolute inset-0 bg-gradient-to-t from-red-600/20 to-transparent pointer-events-none"></div>
                    <div className="space-y-12 relative z-10">
                       <h2 className="text-6xl sm:text-9xl font-black italic text-white tracking-tighter uppercase animate-slide-up drop-shadow-[0_0_50px_rgba(255,255,255,0.3)]">ACCESS GRANTED</h2>
                       <div className="h-4 bg-red-600 w-full shadow-[0_0_50px_rgba(220,38,38,1)] animate-pulse"></div>
                       <div className="max-w-3xl mx-auto space-y-6">
                         <p className="text-white font-mono text-xl sm:text-4xl italic leading-tight text-center px-4">
                           “感谢你没有放弃。这张机票带我飞向了未知，而你的操作带我回到了原点。”
                         </p>
                         <p className="text-red-500 font-mono text-2xl sm:text-5xl font-black uppercase tracking-tighter animate-bounce">这个世界现在是你的了。</p>
                         <p className="text-white/40 font-mono text-sm uppercase tracking-[0.5em]">—— The Architect, 2077.07.07</p>
                       </div>
                       <div className="pt-24">
                          <button 
                            onClick={() => setLevel(11)}
                            className="px-20 py-10 bg-white text-black font-black text-2xl sm:text-5xl hover:bg-red-600 hover:text-white transition-all shadow-2xl uppercase tracking-[0.2em] italic active:scale-95"
                          >
                            [ 最终注销 / FINAL LOGOUT ]
                          </button>
                       </div>
                    </div>
                 </div>
               )}
             </div>

             <style>{`
                .animate-violent-shake { animation: violent-shake 0.3s both; }
                @keyframes violent-shake {
                  0% { transform: translate(0,0); }
                  25% { transform: translate(-5px, 5px); }
                  50% { transform: translate(5px, -5px); }
                  75% { transform: translate(-5px, -5px); }
                  100% { transform: translate(0,0); }
                }
             `}</style>
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center h-screen space-y-10 sm:space-y-16 animate-fade-in text-center px-6 bg-black">
            <h2 className="text-5xl sm:text-9xl font-black text-white drop-shadow-[0_0_100px_rgba(255,255,255,0.2)] uppercase tracking-tighter italic leading-none">任务结束</h2>
            <p className="text-white/60 text-lg sm:text-2xl font-light leading-relaxed max-w-3xl italic">“格式转换已启动。你的贡献已被 Eden 记录。期待下一次链接。”</p>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-10 w-full sm:w-auto">
              <button onClick={() => setLevel(1)} className="px-10 sm:px-20 py-4 sm:py-8 border-2 border-white/10 hover:bg-white hover:text-black font-black text-xl sm:text-2xl transition-all uppercase italic shadow-xl">重新开始</button>
              <button onClick={onExit} className="px-10 sm:px-20 py-4 sm:py-8 border-2 border-white/10 text-red-500 hover:bg-red-500 hover:text-white font-black text-xl sm:text-2xl transition-all uppercase italic shadow-xl">退出系统</button>
            </div>
            <footer className="mt-12 text-[10px] opacity-20 font-mono tracking-[1em] uppercase">SYSTEM_ARCHIVE_SECURED</footer>
          </div>
        );
    }
  };

  return (
    <div className={`h-screen w-full bg-[#020202] text-white overflow-y-auto scroll-smooth relative custom-scrollbar ${isShaking ? 'animate-violent-shake' : ''}`}>
      <div className="fixed top-0 left-0 w-full p-4 sm:p-6 md:p-8 bg-black/98 backdrop-blur-3xl border-b border-white/5 z-[1000] flex justify-between items-center font-mono text-[9px] sm:text-[11px] uppercase tracking-[0.1em] sm:tracking-[0.4em] italic font-bold">
        <div className="flex items-center gap-2 sm:gap-6">
          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(34,197,94,1)]"></div>
          <span className="bg-white/5 border border-white/10 px-2 sm:px-6 py-1 sm:py-2 rounded-sm truncate max-w-[80px] sm:max-w-none">LVL_{level.toString().padStart(2, '0')}</span>
        </div>
        <div className="flex gap-2 sm:gap-4">
          {screen > 1 && level < 10 && (
            <button onClick={handleBack} className="text-white/40 border border-white/10 px-2 py-1 sm:px-6 sm:py-2 hover:bg-white hover:text-black transition-all shrink-0">返回</button>
          )}
          <button onClick={onExit} className="text-red-500 border border-red-500/20 px-2 py-1 sm:px-6 sm:py-2 hover:bg-red-500 hover:text-white transition-all shrink-0">终止</button>
        </div>
      </div>

      <div className="relative z-10">{renderLevel()}</div>

      {feedback && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/98 backdrop-blur-3xl animate-fade-in px-4">
          <div className="bg-black border-4 border-white p-12 sm:p-24 text-center shadow-2xl relative w-full max-w-2xl">
             <div className={`text-4xl sm:text-8xl font-black italic mb-6 sm:mb-10 ${feedback.color} uppercase tracking-tighter drop-shadow-2xl leading-none`}>{feedback.text}</div>
             <div className="text-lg sm:text-4xl text-white/40 font-mono tracking-[0.3em] sm:tracking-[0.5em] uppercase font-bold">{feedback.sub}</div>
          </div>
        </div>
      )}

      {errorFlash && (
        <div className="fixed inset-0 z-[9999] bg-red-600/40 backdrop-blur-sm flex flex-col items-center justify-center animate-pulse pointer-events-none">
          <div className="text-6xl sm:text-9xl font-black text-red-600 italic tracking-tighter uppercase glitch-text-red text-center px-4">访问被拒绝</div>
        </div>
      )}

      {showHintModal && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl animate-fade-in">
          <div className="max-w-2xl w-full bg-[#0a0a0a] border-2 border-white/20 p-8 sm:p-16 space-y-10 sm:space-y-16 rounded shadow-2xl">
            <h3 className="text-2xl sm:text-4xl font-black text-white/90 uppercase border-b border-white/10 pb-4 sm:pb-8 italic tracking-widest">系统质询 (Query)</h3>
            <p className="text-white/80 font-mono text-xl sm:text-3xl italic font-bold">提示次数有限，确定使用吗？</p>
            <div className="flex gap-4 sm:gap-8">
              <button onClick={confirmHint} className="flex-1 py-6 sm:py-8 bg-white text-black font-black text-xl sm:text-2xl hover:bg-green-500 transition-all italic tracking-widest">是 (Yes)</button>
              <button onClick={() => setShowHintModal(false)} className="flex-1 py-6 sm:py-8 border-2 border-white/20 text-white font-black text-xl sm:text-2xl hover:bg-red-500 transition-all italic tracking-widest">否 (No)</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes typing { from { width: 0 } to { width: 100% } }
        @keyframes fade-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slide-up { from { transform: translateY(100px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes slide-up-fast { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes violent-shake {
          0% { transform: translate(0,0) rotate(0); }
          10% { transform: translate(-3px,-3px) rotate(-1deg); }
          20% { transform: translate(3px,3px) rotate(1deg); }
          30% { transform: translate(-3px,3px) rotate(-1deg); }
          40% { transform: translate(3px,-3px) rotate(1deg); }
          100% { transform: translate(0,0) rotate(0); }
        }
        @keyframes glitch-red {
          0% { clip-path: inset(20% 0 30% 0); transform: skew(5deg); }
          100% { clip-path: inset(30% 0 20% 0); transform: skew(-5deg); }
        }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes spin-reverse-slow { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
        
        .animate-spin-slow { animation: spin-slow 10s linear infinite; }
        .animate-spin-reverse-slow { animation: spin-reverse-slow 15s linear infinite; }
        .animate-fade-in { animation: fade-in 1.2s ease-out forwards; }
        .animate-slide-up { animation: slide-up 1.2s cubic-bezier(0.23, 1, 0.32, 1) forwards; }
        .animate-slide-up-fast { animation: slide-up-fast 0.4s ease-out forwards; }
        .animate-slide-up-delayed { animation: slide-up 1.2s cubic-bezier(0.23, 1, 0.32, 1) 0.5s forwards; }
        .animate-slide-up-delayed-1 { animation: slide-up 1.2s cubic-bezier(0.23, 1, 0.32, 1) 1s forwards; }
        .animate-slide-up-delayed-2 { animation: slide-up 1.2s cubic-bezier(0.23, 1, 0.32, 1) 2s forwards; }
        .animate-typing-1 { animation: typing 1.5s steps(40) forwards, fade-in 0.1s forwards; }
        .animate-typing-2 { animation: typing 1.5s steps(40) forwards, fade-in 0.1s forwards; animation-delay: 1.5s; }
        .animate-typing-3 { animation: typing 1.5s steps(40) forwards, fade-in 0.1s forwards; animation-delay: 3s; }
        .animate-typing-2-fast { animation: typing 1s steps(30) forwards, fade-in 0.1s forwards; animation-delay: 1s; }
        .fill-mode-forwards { animation-fill-mode: forwards; }
        .animate-violent-shake { animation: violent-shake 0.3s cubic-bezier(.36,.07,.19,.97) both; }
        .glitch-text-red { animation: glitch-red 0.2s infinite; text-shadow: 1px 0 red, -1px 0 blue; }
        
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #000; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #222; border-radius: 3px; }
      `}</style>
    </div>
  );
};

export default GameView;
