
import React, { useState } from 'react';
import { Role } from '../types';
import { ShieldCheck, Mail, Lock, ArrowRight, Zap, Building2, User, CheckCircle2, ArrowLeft } from 'lucide-react';

interface RegisterScreenProps {
  onBackToLogin: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onBackToLogin }) => {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: Role.DIRECTOR // CHANGEMENT ICI: Le créateur du compte est Directeur par défaut
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation basique
    if (!formData.companyName || !formData.email || !formData.password) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setIsLoading(true);
    
    // Simulation d'appel API
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
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Compte Créé !</h2>
            <p className="text-slate-600 mb-6 text-sm leading-relaxed">
              Un email de confirmation a été envoyé à <span className="font-bold text-slate-900">{formData.email}</span>. 
              Votre espace administrateur pour <strong>{formData.companyName}</strong> est prêt.
            </p>
            <button 
              onClick={onBackToLogin}
              className="w-full py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors"
            >
              Se connecter (Admin)
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
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center justify-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
               <Zap size={20} className="text-white" fill="currentColor" />
            </div>
            Transit<span className="text-blue-500">Secure</span>
          </h1>
          <p className="text-slate-400 mt-2 text-sm font-medium">Inscription Entreprise (Admin)</p>
        </div>

        <div className="bg-white rounded-xl p-8 shadow-2xl shadow-black/50 border border-slate-800/50">
          <form onSubmit={handleRegister} className="space-y-4">
            
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-100 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> {error}
              </div>
            )}

            <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Nom de l'entreprise <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all text-sm font-medium"
                    placeholder="Ex: Transit Logistics GN"
                    required
                  />
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Email Administrateur <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all text-sm font-medium"
                    placeholder="admin@entreprise.com"
                    required
                  />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Mot de passe <span className="text-red-500">*</span></label>
                    <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all text-sm font-medium"
                        placeholder="••••••"
                        required
                    />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Confirmation <span className="text-red-500">*</span></label>
                    <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CheckCircle2 className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all text-sm font-medium"
                        placeholder="••••••"
                        required
                    />
                    </div>
                </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-sm transform transition-all active:scale-[0.98] disabled:opacity-70 text-sm"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  Créer Compte Admin <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-500 mb-3">Vous avez déjà un compte ?</p>
              <button 
                onClick={onBackToLogin}
                className="text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center justify-center gap-1 mx-auto"
              >
                 <ArrowLeft size={14} /> Se connecter
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};
