
import React, { useState } from 'react';
import { Role } from '../types';
import { ShieldCheck, Mail, Lock, ArrowRight, Zap, Building2, UserPlus, KeyRound } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (role: Role) => void;
  onSwitchToRegister: () => void;
  onSwitchToInvite: () => void; // Nouvelle prop
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onSwitchToRegister, onSwitchToInvite }) => {
  const [selectedRole, setSelectedRole] = useState<Role>(Role.DIRECTOR);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      onLogin(selectedRole);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#0b1120] flex flex-col items-center justify-center p-6 relative">
      
      {/* Professional Grid Background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none"></div>

      <div className="w-full max-w-sm relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Branding */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 bg-blue-900/30 border border-blue-800/50 rounded-full text-blue-200 text-xs font-medium">
             <ShieldCheck size={12} /> Portail Sécurisé v2.4
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center justify-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
               <Zap size={20} className="text-white" fill="currentColor" />
            </div>
            Transit<span className="text-blue-500">Secure</span>
          </h1>
          <p className="text-slate-400 mt-2 text-sm font-medium">Système de Gestion Logistique Intégré</p>
        </div>

        {/* Professional Login Card */}
        <div className="bg-white rounded-xl p-8 shadow-2xl shadow-black/50 border border-slate-800/50">
          <form onSubmit={handleLogin} className="space-y-5">
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Identifiant</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all text-sm font-medium"
                    placeholder="nom@entreprise.gn"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Mot de passe</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all text-sm font-medium"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Role Selector */}
            <div className="pt-2 border-t border-slate-100 mt-4">
               <span className="block text-xs text-slate-400 mb-2">Sélection du profil (Simulation)</span>
               <select 
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as Role)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block p-2.5 font-medium"
               >
                 {Object.values(Role).map((r) => (
                   <option key={r} value={r}>{r}</option>
                 ))}
               </select>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-sm transform transition-all active:scale-[0.98] disabled:opacity-70 text-sm"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  Accéder à l'espace <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Additional Links */}
          <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
             <button 
                onClick={onSwitchToInvite}
                className="w-full py-2 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg transition-colors text-xs flex items-center justify-center gap-2"
             >
                <KeyRound size={14} /> Vous avez reçu une invitation ? (Activer)
             </button>
             
             <button 
                onClick={onSwitchToRegister}
                className="w-full py-2 px-4 bg-transparent hover:bg-slate-50 text-slate-500 hover:text-slate-700 font-bold rounded-lg transition-colors text-xs flex items-center justify-center gap-2"
             >
                <UserPlus size={14} /> Créer un compte entreprise
             </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center space-y-2">
           <div className="flex items-center justify-center gap-2 text-slate-500">
              <Building2 size={14} />
              <span className="text-xs font-medium">Conakry Port Authority Connected</span>
           </div>
           <p className="text-[10px] text-slate-600 opacity-60">© 2024 TransitGuinée Solutions. Tous droits réservés.</p>
        </div>

      </div>
    </div>
  );
};
