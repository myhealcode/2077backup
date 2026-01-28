
import React, { useState, useEffect } from 'react';
import { User } from '../types';

interface AdminProps {
  onBack: () => void;
}

const Admin: React.FC<AdminProps> = ({ onBack }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [newEmail, setNewEmail] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('glitch_users');
    if (saved) {
      setUsers(JSON.parse(saved));
    }
  }, []);

  const addUser = () => {
    if (!newEmail) return;
    const newUser: User = {
      email: newEmail,
      isPaid: true,
      gameProgress: 1
    };
    const updated = [...users, newUser];
    setUsers(updated);
    localStorage.setItem('glitch_users', JSON.stringify(updated));
    setNewEmail('');
  };

  const removeUser = (email: string) => {
    const updated = users.filter(u => u.email !== email);
    setUsers(updated);
    localStorage.setItem('glitch_users', JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen p-12 max-w-2xl mx-auto space-y-12">
      <div className="flex justify-between items-center border-b border-green-500/20 pb-4">
        <h1 className="text-2xl font-bold">ADMIN_TERMINAL_V1</h1>
        <button onClick={onBack} className="text-xs hover:underline">[ 返回 / RETURN ]</button>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm uppercase opacity-60">Add to Whitelist (添加白名单)</h2>
        <div className="flex gap-2">
          <input 
            className="flex-grow bg-black border border-green-500 p-2 text-green-400 outline-none"
            placeholder="Agent Email..."
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
          />
          <button onClick={addUser} className="bg-green-500 text-black px-6 font-bold hover:bg-green-400">ADD</button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm uppercase opacity-60">Registered Agents ({users.length})</h2>
        <div className="border border-green-500/20 rounded divide-y divide-green-500/10">
          {users.map(u => (
            <div key={u.email} className="p-4 flex justify-between items-center hover:bg-green-900/5">
              <div>
                <p className="text-green-400">{u.email}</p>
                <p className="text-[10px] opacity-40">Progress: Level {u.gameProgress}</p>
              </div>
              <button onClick={() => removeUser(u.email)} className="text-red-500 text-xs hover:bg-red-500 hover:text-black px-2 py-1 transition-all">DELETE</button>
            </div>
          ))}
          {users.length === 0 && <p className="p-8 text-center opacity-30 italic">No agents found.</p>}
        </div>
      </div>
    </div>
  );
};

export default Admin;
