
import React, { useEffect, useState } from 'react';

interface TheDiveProps {
  onComplete: () => void;
}

const TheDive: React.FC<TheDiveProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<'contracting' | 'streaming' | 'texting'>('contracting');
  const [messages, setMessages] = useState<string[]>([]);
  
  const textSteps = [
    "初始化神经链接...",
    "正在同步痛觉屏蔽器...",
    "载入地图：Sunway_Square_Mall_v2.0...",
    "祝你好运，特工。"
  ];

  useEffect(() => {
    // Stage 1: Screen contraction (old TV)
    const t1 = setTimeout(() => setPhase('streaming'), 800);
    
    // Stage 2: Code streaming
    const t2 = setTimeout(() => setPhase('texting'), 2500);

    // Stage 3: Typewriter messages
    let msgIndex = 0;
    const interval = setInterval(() => {
      if (msgIndex < textSteps.length) {
        setMessages(prev => [...prev, textSteps[msgIndex]]);
        msgIndex++;
      } else {
        clearInterval(interval);
        setTimeout(onComplete, 1000);
      }
    }, 600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearInterval(interval);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center overflow-hidden">
      {phase === 'contracting' && (
        <div className="w-full h-1 bg-white animate-[expand_0.8s_ease-in-out]"></div>
      )}

      {phase === 'streaming' && (
        <div className="absolute inset-0 grid grid-cols-10 gap-2 opacity-50">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="flex flex-col text-[10px] animate-slide-down">
              {[...Array(50)].map((_, j) => (
                <span key={j} className="text-green-500 font-mono">
                  {Math.random().toString(36).substring(7)}
                </span>
              ))}
            </div>
          ))}
        </div>
      )}

      {phase === 'texting' && (
        <div className="z-10 bg-black/80 p-12 border border-green-500 w-full max-w-xl">
          <div className="space-y-4 font-mono">
            {messages.map((m, i) => (
              <p key={i} className="text-green-400">>>> {m}</p>
            ))}
            <div className="w-2 h-5 bg-green-500 animate-pulse inline-block"></div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes expand {
          0% { transform: scaleX(0); opacity: 0; }
          50% { transform: scaleX(1); opacity: 1; height: 1px; }
          100% { transform: scaleX(1.5); opacity: 0; height: 100vh; }
        }
        @keyframes slide-down {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .animate-slide-down {
          animation: slide-down 1.5s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default TheDive;
