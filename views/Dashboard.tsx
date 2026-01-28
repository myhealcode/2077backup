
import React from 'react';
import { User } from '../types';

interface DashboardProps {
  user: User;
  onStart: () => void;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onStart, onLogout }) => {
  const serverIntegrity = 45;
  const hasAccessTo2077 = user.ownedModules?.includes("2077_BASE") || false;

  return (
    <div className="min-h-screen p-8 flex flex-col font-mono animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-green-500/30 pb-4 mb-12 gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-widest text-green-400">【HEAL CODE 控制台】 (The Dashboard)</h1>
          <div className="flex items-center gap-4 mt-1 text-xs opacity-60">
            <span>特工: <span className="text-green-400">{user.email}</span></span>
            <span className="flex items-center gap-1">
              状态: <span className="text-green-500 animate-pulse">在线 (ONLINE)</span>
            </span>
          </div>
        </div>
        <div className="w-full md:w-64">
          <div className="flex justify-between text-[10px] mb-1">
            <span>服务器稳定性 (SERVER INTEGRITY)</span>
            <span className="text-red-500">{serverIntegrity}% (严重受损)</span>
          </div>
          <div className="h-1 bg-green-900/50 w-full rounded-full overflow-hidden">
            <div className="h-full bg-red-500 animate-pulse" style={{ width: `${serverIntegrity}%` }}></div>
          </div>
        </div>
        <button 
          onClick={onLogout}
          className="text-[10px] border border-green-500/30 px-4 py-2 hover:bg-green-500 hover:text-black transition-all uppercase font-bold"
        >
          [ 断开链接 / DISCONNECT ]
        </button>
      </div>

      {/* Mission Cards Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 flex-grow">
        {/* Module 1: Eden: Backup from 2077 */}
        <div 
          className={`group relative border border-green-500/40 bg-green-900/5 p-6 transition-all rounded-md overflow-hidden ${hasAccessTo2077 ? 'hover:bg-green-500/10 cursor-pointer shadow-[0_0_20px_rgba(0,255,0,0.05)]' : 'opacity-50 grayscale'}`}
          onClick={hasAccessTo2077 ? onStart : undefined}
        >
          <div className="absolute top-0 right-0 p-2 text-[10px] text-yellow-500 flex items-center gap-1 font-bold">
             {hasAccessTo2077 ? '⚠️ 需要修复 (REPAIR)' : '🔒 访问受限 (RESTRICTED)'}
          </div>
          
          <div className="w-full aspect-video bg-black/40 mb-6 relative overflow-hidden rounded border border-green-500/20">
             <img 
               src="https://picsum.photos/seed/glitch/600/400" 
               alt="Eden Cover" 
               className={`w-full h-full object-cover opacity-60 transition-transform duration-1000 ${hasAccessTo2077 ? 'group-hover:scale-110 grayscale group-hover:grayscale-0' : 'grayscale'}`}
             />
             <div className="absolute inset-0 bg-green-500/10 mix-blend-overlay"></div>
             {hasAccessTo2077 && (
               <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="bg-black/90 px-6 py-3 text-xs border-2 border-green-500 text-green-400 font-bold tracking-widest shadow-[0_0_25px_rgba(0,255,0,0.4)]">
                    进入模块 (INITIATE DIVE)
                  </span>
               </div>
             )}
          </div>

          <h2 className="text-xl font-bold mb-2 tracking-tight">模块 01: 《来自 2077 的备份》</h2>
          <div className="flex items-center gap-2 mb-4">
             <span className={`px-2 py-0.5 text-[10px] border ${hasAccessTo2077 ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' : 'bg-red-500/20 text-red-500 border-red-500/30'}`}>
               {hasAccessTo2077 ? '数据损坏 (CORRUPTED)' : '未授权 (UNAUTHORIZED)'}
             </span>
             <span className="text-[10px] text-green-500/60 uppercase">系统: EDEN v1.2</span>
          </div>

          <p className="text-xs text-green-500/70 mb-8 leading-relaxed italic">
            “侦测到严重的逻辑病毒。商场区域的现实图层正在坍塌。需要人工介入以稳定底层架构。”
          </p>

          <button 
            disabled={!hasAccessTo2077}
            className={`w-full py-4 border-2 transition-all font-black tracking-widest uppercase ${hasAccessTo2077 ? 'border-green-500/50 hover:bg-green-500 hover:text-black shadow-lg active:scale-[0.98]' : 'border-white/10 text-white/20'}`}
          >
            {hasAccessTo2077 ? '[ >>> 潜入系统 / JACK IN ]' : '[ 访问拒绝 / ACCESS DENIED ]'}
          </button>
        </div>

        {/* Card 2: Unknown */}
        <div className="border border-white/5 bg-white/5 p-6 opacity-30 grayscale pointer-events-none relative rounded-md flex flex-col justify-center items-center">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-xl font-bold mb-2 tracking-tight text-white/50">《未知信号》 (UNKNOWN)</h2>
          <div className="px-3 py-1 bg-white/10 text-white/40 text-[10px] uppercase font-bold tracking-widest mb-6">即将推出 (COMING SOON)</div>
          <p className="text-[10px] text-center max-w-[200px]">“需完成前置修复任务方可访问后续受损节点。”</p>
        </div>

        {/* Card 3: Unknown */}
        <div className="border border-white/5 bg-white/5 p-6 opacity-30 grayscale pointer-events-none relative rounded-md flex flex-col justify-center items-center">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-xl font-bold mb-2 tracking-tight text-white/50">《深渊典藏》 (ABYSS)</h2>
          <div className="px-3 py-1 bg-white/10 text-white/40 text-[10px] uppercase font-bold tracking-widest mb-6">即将推出 (COMING SOON)</div>
          <p className="text-[10px] text-center max-w-[200px]">“侦测到加密防火墙，等待系统解锁指令。”</p>
        </div>
      </div>

      <footer className="mt-12 text-[10px] opacity-30 flex justify-between border-t border-green-500/10 pt-6 italic tracking-wider">
        <span>ENCRYPTED_CONNECTION_V5.0_SECURED</span>
        <span>© 2077 HEAL CODE SYSTEM ARCHIVE</span>
      </footer>
    </div>
  );
};

export default Dashboard;
