
import React, { useState } from 'react';
import { Lock, Mail, CheckCircle2, ArrowRight, ArrowLeft, KeyRound } from 'lucide-react';

interface InviteSetupScreenProps {
  onBackToLogin: () => void;
  onActivationSuccess: () => void;
}

export const InviteSetupScreen: React.FC<InviteSetupScreenProps> = ({ onBackToLogin, onActivationSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setIsLoading(true);
    // Simulation API
    setTimeout(() => {
      setIsLoading(false);
      setStep('success');
    }, 1500);
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-[#0b1120] flex flex-col items-center justify-center p-6 relative">
        <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none"></div>
        <div className="w-full max-w-sm bg-white rounded-xl p-8 shadow-2xl animate-in zoom-in-95 duration-300 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={32} className="text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Compte Activé !</h2>
            <p className="text-slate-600 mb-6 text-sm leading-relaxed">
              Votre mot de passe a été défini avec succès. Vous pouvez maintenant accéder à la plateforme.
            </p>
            <button 
              onClick={onActivationSuccess}
              className="w-full py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors"
            >
              Accéder à mon espace
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1120] flex flex-col items-center justify-center p-6 relative">
      <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        <div className="text-center mb-8">
           <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-900/50">
               <KeyRound size={24} className="text-white" />
            </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Activation du Compte</h1>
          <p className="text-slate-400 mt-2 text-sm">Définissez votre mot de passe pour finaliser l'invitation.</p>
        </div>

        <div className="bg-white rounded-xl p-8 shadow-2xl shadow-black/50 border border-slate-800/50">
          <form onSubmit={handleActivate} className="space-y-4">
            
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-100 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> {error}
              </div>
            )}

            <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Email Professionnel</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all text-sm font-medium"
                    placeholder="votre.email@entreprise.gn"
                    required
                  />
                </div>
            </div>

            <div className="pt-2">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Nouveau Mot de passe</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all text-sm font-medium"
                    placeholder="••••••"
                    required
                  />
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Confirmer le mot de passe</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CheckCircle2 className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all text-sm font-medium"
                    placeholder="••••••"
                    required
                  />
                </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-lg shadow-blue-900/20 transform transition-all active:scale-[0.98] disabled:opacity-70 text-sm"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  Activer mon compte <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
              <button 
                onClick={onBackToLogin}
                className="text-sm font-bold text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1 mx-auto"
              >
                 <ArrowLeft size={14} /> Annuler
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};
