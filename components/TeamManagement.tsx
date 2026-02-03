
import React, { useState } from 'react';
import { Role } from '../types';
import { User, Mail, Shield, Plus, Trash2, CheckCircle2, Search, Briefcase } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: 'Active' | 'Pending';
  joinedDate: string;
}

// Données fictives initiales
const INITIAL_MEMBERS: TeamMember[] = [
  { id: '1', name: 'Amadou Diallo', email: 'dg@transit-secure.gn', role: Role.DIRECTOR, status: 'Active', joinedDate: '2023-01-15' },
  { id: '2', name: 'Fatoumata Camara', email: 'finances@transit-secure.gn', role: Role.ACCOUNTANT, status: 'Active', joinedDate: '2023-03-10' },
];

export const TeamManagement: React.FC = () => {
  const [members, setMembers] = useState<TeamMember[]>(INITIAL_MEMBERS);
  const [showForm, setShowForm] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: Role.FIELD_AGENT });
  const [isLoading, setIsLoading] = useState(false);

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulation d'envoi d'invitation
    setTimeout(() => {
      const newMember: TeamMember = {
        id: Date.now().toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: 'Pending',
        joinedDate: new Date().toISOString()
      };
      setMembers([...members, newMember]);
      setNewUser({ name: '', email: '', role: Role.FIELD_AGENT });
      setShowForm(false);
      setIsLoading(false);
    }, 1000);
  };

  const removeUser = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet accès ?')) {
      setMembers(members.filter(m => m.id !== id));
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 animate-in fade-in duration-500 pb-24">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestion d'Équipe</h1>
          <p className="text-slate-500 text-sm mt-1">Gérez les accès et les rôles de vos collaborateurs.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-lg flex items-center gap-2 transition-all active:scale-95"
        >
          <Plus size={18} /> {showForm ? 'Fermer' : 'Ajouter un collaborateur'}
        </button>
      </div>

      {/* Formulaire d'ajout (Toggle) */}
      {showForm && (
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100 mb-8 animate-in slide-in-from-top-4">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4 flex items-center gap-2">
            <User size={16} className="text-blue-600"/> Nouveau Compte
          </h2>
          <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nom Complet</label>
               <input 
                 required
                 type="text"
                 value={newUser.name}
                 onChange={e => setNewUser({...newUser, name: e.target.value})}
                 placeholder="Ex: Ibrahima Sory"
                 className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-slate-900 transition-all"
               />
            </div>
            <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Professionnel</label>
               <input 
                 required
                 type="email"
                 value={newUser.email}
                 onChange={e => setNewUser({...newUser, email: e.target.value})}
                 placeholder="agent@entreprise.gn"
                 className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-slate-900 transition-all"
               />
            </div>
            <div className="md:col-span-2">
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Rôle / Permission</label>
               <select 
                 value={newUser.role}
                 onChange={e => setNewUser({...newUser, role: e.target.value as Role})}
                 className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-slate-900 transition-all"
               >
                 <option value={Role.ACCOUNTANT}>Comptable (Finance & Facturation)</option>
                 <option value={Role.FIELD_AGENT}>Agent de Terrain (Port & Douane)</option>
                 <option value={Role.CREATION_AGENT}>Chargé de Création (Dossiers)</option>
                 <option value={Role.DIRECTOR}>Directeur (Admin)</option>
               </select>
               <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                 <Shield size={10} /> Ce rôle définit les accès aux modules sensibles.
               </p>
            </div>
            <div className="md:col-span-2 pt-2">
               <button 
                 type="submit" 
                 disabled={isLoading}
                 className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70"
               >
                 {isLoading ? 'Envoi en cours...' : 'Envoyer l\'invitation'}
               </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des membres */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
           <div className="flex items-center gap-2 text-slate-500">
             <Briefcase size={16} /> <span className="text-xs font-bold uppercase">Membres Actifs</span>
           </div>
           <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs font-bold">{members.length}</span>
        </div>
        
        <div className="divide-y divide-slate-100">
          {members.map((member) => (
            <div key={member.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors group">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold border border-slate-200">
                     {member.name.charAt(0)}
                  </div>
                  <div>
                     <h4 className="font-bold text-slate-900 text-sm">{member.name}</h4>
                     <p className="text-xs text-slate-500 flex items-center gap-1">
                       <Mail size={10} /> {member.email}
                     </p>
                  </div>
               </div>

               <div className="flex items-center gap-4 justify-between md:justify-end">
                  <div className="flex flex-col items-end">
                     <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                        member.role === Role.DIRECTOR ? 'bg-purple-50 text-purple-700 border-purple-100' :
                        member.role === Role.ACCOUNTANT ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        'bg-blue-50 text-blue-700 border-blue-100'
                     }`}>
                        {member.role}
                     </span>
                     <span className={`text-[10px] font-medium mt-1 flex items-center gap-1 ${member.status === 'Active' ? 'text-emerald-600' : 'text-orange-500'}`}>
                        {member.status === 'Active' ? <CheckCircle2 size={10} /> : <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></div>}
                        {member.status === 'Active' ? 'Compte Actif' : 'Invitation envoyée'}
                     </span>
                  </div>
                  
                  {member.role !== Role.DIRECTOR && (
                    <button 
                      onClick={() => removeUser(member.id)}
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      title="Supprimer l'accès"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
