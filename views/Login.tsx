
import React, { useState } from 'react';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
  onAdmin: () => void;
}

// 您提供的最新 Web App URL
const API_URL = "https://script.google.com/macros/s/AKfycbyz9rRvUz6m_Eivd1BHYJZxOjUDPRcmyTZeKtptWBS9NQZ5_4Fo3YSHPNnuFP8e4QkIhQ/exec";

const Login: React.FC<LoginProps> = ({ onLogin, onAdmin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'email' | 'password'>('email');
  const [subStep, setSubStep] = useState<'login' | 'setup'>('login');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<'none' | 'success' | 'fail'>('none');

  const handleConnect = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return;
    
    setError(null);
    setFeedback('none');
    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        mode: 'cors',
        redirect: 'follow', 
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: "verify_email", email: cleanEmail })
      });

      if (!response.ok) throw new Error(`HTTP_${response.status}`);
      const data = await response.json();

      if (data.status === "error") {
        setFeedback('fail');
        setError(data.message || 'ACCESS_DENIED');
      } else {
        setFeedback('success');
        setSubStep(data.type === "first_time_setup" ? 'setup' : 'login');
        setTimeout(() => setStep('password'), 800);
      }
    } catch (err: any) {
      setFeedback('fail');
      setError(err.message === 'Failed to fetch' ? '连接失败：请检查脚本是否部署为“Anyone”。' : `ERR: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!password || !cleanEmail) return;
    
    setError(null);
    setLoading(true);

    try {
      const action = subStep === 'setup' ? 'setup_password' : 'login';
      const response = await fetch(API_URL, {
        method: 'POST',
        mode: 'cors',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action, email: cleanEmail, password })
      });

      const data = await response.json();

      if (data.status === "success" && data.user) {
        const loggedUser: User = {
          email: data.user.email,
          isPaid: data.user.ownedModules?.includes("2077_BASE") || false,
          gameProgress: data.user.gameProgress || 1,
          ownedModules: data.user.ownedModules || []
        };
        onLogin(loggedUser);
      } else {
        setError(data.message || 'KEY_INCORRECT');
      }
    } catch (err) {
      setError('TIMEOUT: 验证通讯失败。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen p-4 transition-colors duration-700 ${feedback === 'success' ? 'bg-green-900/10' : feedback === 'fail' ? 'bg-red-900/10' : 'bg-black'}`}>
      <div className="max-w-md w-full border-2 border-green-500/30 bg-black/90 p-8 rounded-lg shadow-[0_0_50px_rgba(0,255,0,0.1)] backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-green-500/30 animate-pulse"></div>
        <h1 className="text-2xl font-black mb-1 tracking-tighter italic flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,1)]"></span>
          IDENTITY VERIFICATION
        </h1>
        <p className="text-[10px] text-green-500/50 mb-8 border-b border-green-500/10 pb-2 uppercase tracking-[0.3em] font-bold">Heal Code Security Console v5.4</p>

        {step === 'email' ? (
          <div className="space-y-6 animate-slide-up-fast">
            <div className="space-y-2">
              <label className="block text-[10px] opacity-60 uppercase tracking-[0.2em] font-bold">[ 神经链接 ID / EMAIL ]</label>
              <input 
                type="email"
                autoFocus
                placeholder="输入特工邮箱以核验身份..."
                className="w-full bg-black/40 border border-green-500/40 p-4 outline-none focus:border-green-400 focus:shadow-[0_0_15px_rgba(0,255,0,0.2)] transition-all text-green-400 placeholder:text-green-900/40 font-mono text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                disabled={loading}
              />
            </div>
            <button 
              onClick={handleConnect}
              disabled={loading || !email}
              className="w-full border-2 border-green-500 py-4 font-black tracking-[0.4em] transition-all hover:bg-green-500 hover:text-black active:scale-95 disabled:opacity-30"
            >
              {loading ? '正在检索...' : '申请接入 / CONNECT'}
            </button>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            <div className="p-4 bg-green-500/10 border border-green-500/20 text-[11px] text-green-400 leading-relaxed italic border-l-4">
              >>> 识别成功: <span className="font-bold text-white uppercase">{email}</span><br/>
              {subStep === 'setup' ? '首次访问，请设定访问密钥。' : '请输入访问密钥。'}
            </div>
            <input 
              type="password"
              autoFocus
              className="w-full bg-black/40 border border-green-500/40 p-4 outline-none focus:border-green-400 transition-all text-green-400 font-mono"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
            />
            <button 
              onClick={handlePasswordSubmit}
              disabled={loading || !password}
              className="w-full border-2 border-green-500 py-4 font-black hover:bg-green-500 hover:text-black transition-all active:scale-95 disabled:opacity-30"
            >
              {loading ? '同步中...' : '执行验证 / EXECUTE'}
            </button>
          </div>
        )}

        {error && (
          <div className="mt-8 p-4 border border-red-500/40 bg-red-950/20 text-red-500 animate-pulse text-[10px] font-mono leading-tight">
            ⚠️ SYSTEM_FAIL: {error}
          </div>
        )}

        <div className="mt-12 pt-4 border-t border-green-500/10 text-[9px] opacity-20 flex justify-between font-mono italic">
          <span>STATUS: SYNC_READY</span>
          <span>HEAL_CODE_OS_v5.4.1</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
