
import React, { useState, useContext } from 'react';
import { TransitContext } from '../App';
import { User, Lock, Save, Shield, Mail } from 'lucide-react';

export const ProfileSettings: React.FC = () => {
  const { role } = useContext(TransitContext);
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (passwordForm.new !== passwordForm.confirm) {
        setMessage({ type: 'error', text: 'Les nouveaux mots de passe ne correspondent pas.' });
        return;
    }

    setIsLoading(true);
    // Simulation
    setTimeout(() => {
        setIsLoading(false);
        setMessage({ type: 'success', text: 'Mot de passe mis à jour avec succès.' });
        setPasswordForm({ current: '', new: '', confirm: '' });
    }, 1000);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 pb-24 animate-in fade-in slide-in-from-bottom-4">
       <header className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <User className="text-slate-900" /> Mon Profil
          </h1>
          <p className="text-slate-500 text-sm mt-1">Gérez vos informations personnelles et votre sécurité.</p>
       </header>

       <div className="space-y-6">
          {/* Info Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
             <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Informations Compte</h2>
             <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-2xl border border-slate-200">
                    {role.charAt(0)}
                </div>
                <div>
                    <p className="font-bold text-slate-900 text-lg">Utilisateur Connecté</p>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-bold rounded border border-blue-100 flex items-center gap-1">
                            <Shield size={10} /> {role}
                        </span>
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded border border-emerald-100 flex items-center gap-1">
                            Actif
                        </span>
                    </div>
                </div>
             </div>
             
             <div className="grid gap-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-500 cursor-not-allowed">
                        <Mail size={16} />
                        <span className="text-sm font-medium">user@transit-secure.gn</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">L'email ne peut être modifié que par l'administrateur.</p>
                 </div>
             </div>
          </div>

          {/* Security Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
             <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                 <Lock size={16} /> Sécurité
             </h2>
             
             <form onSubmit={handleUpdatePassword} className="space-y-4">
                 {message && (
                     <div className={`p-3 rounded-lg text-xs font-bold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                         {message.text}
                     </div>
                 )}
                 
                 <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mot de passe actuel</label>
                    <input 
                        type="password"
                        required
                        value={passwordForm.current}
                        onChange={e => setPasswordForm({...passwordForm, current: e.target.value})}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 transition-all"
                    />
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Nouveau mot de passe</label>
                        <input 
                            type="password"
                            required
                            minLength={6}
                            value={passwordForm.new}
                            onChange={e => setPasswordForm({...passwordForm, new: e.target.value})}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Confirmer nouveau</label>
                        <input 
                            type="password"
                            required
                            minLength={6}
                            value={passwordForm.confirm}
                            onChange={e => setPasswordForm({...passwordForm, confirm: e.target.value})}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 transition-all"
                        />
                    </div>
                 </div>

                 <div className="pt-2">
                     <button 
                        type="submit" 
                        disabled={isLoading}
                        className="py-3 px-6 bg-slate-900 text-white font-bold rounded-lg shadow-md hover:bg-slate-800 transition-all flex items-center gap-2 text-sm disabled:opacity-70"
                     >
                         {isLoading ? 'Mise à jour...' : <><Save size={16} /> Mettre à jour le mot de passe</>}
                     </button>
                 </div>
             </form>
          </div>
       </div>
    </div>
  );
};
