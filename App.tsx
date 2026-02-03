
import React, { useState, createContext, useMemo, useEffect } from 'react';
import { 
  Role, Shipment, ShipmentStatus, TransitContextType, Document, Expense, CommodityType, DeliveryInfo 
} from './types';
import { Dashboard } from './components/Dashboard';
import { ShipmentDetail } from './components/ShipmentDetail';
import { CustomsCalculator } from './components/CustomsCalculator';
import { LoginScreen } from './components/LoginScreen';
import { RegisterScreen } from './components/RegisterScreen';
import { InviteSetupScreen } from './components/InviteSetupScreen';
import { CreateShipmentForm } from './components/CreateShipmentForm';
import { AccountingView } from './components/AccountingView';
import { TeamManagement } from './components/TeamManagement'; 
import { ProfileSettings } from './components/ProfileSettings';
import { logger } from './services/logger';
import { 
  Wifi, WifiOff, LayoutGrid, Settings, 
  MessageSquare, Send, User, Calculator, Zap, LogOut, Search, Bell, PieChart, Box, Users
} from 'lucide-react';

// --- CONTEXT ---
export const TransitContext = createContext<TransitContextType>({} as TransitContextType);

// --- MAIN APP ---
const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authView, setAuthView] = useState<'login' | 'register' | 'invite'>('login');
  
  const [role, setRole] = useState<Role>(Role.DIRECTOR);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [shipments, setShipments] = useState<Shipment[]>([]); // Données vides - à connecter au backend
  const [currentView, setCurrentView] = useState<'dashboard' | 'detail' | 'create' | 'calculator' | 'assistant' | 'accounting' | 'team' | 'profile'>('dashboard');
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [assistantInput, setAssistantInput] = useState('');
  const [assistantMessages, setAssistantMessages] = useState<{role: 'user'|'ai', text: string}[]>([
    { role: 'ai', text: 'Bonjour. Je suis votre expert transit. Une question sur la douane ou un dossier ?' }
  ]);
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);

  // Simulate Session Check on Mount
  useEffect(() => {
    const savedRole = sessionStorage.getItem('currentUserRole');
    if (savedRole) {
      setRole(savedRole as Role);
      setIsAuthenticated(true);
      logger.info('Session restaurée', { role: savedRole });
    }
  }, []);

  // Search Filtering Logic
  const filteredShipments = useMemo(() => {
    if (!searchQuery) return shipments;
    const lowerQ = searchQuery.toLowerCase();
    return shipments.filter(s => 
      s.trackingNumber.toLowerCase().includes(lowerQ) ||
      s.blNumber.toLowerCase().includes(lowerQ) ||
      s.clientName.toLowerCase().includes(lowerQ) ||
      (s.containerNumber && s.containerNumber.toLowerCase().includes(lowerQ))
    );
  }, [shipments, searchQuery]);

  const handleLogin = (selectedRole: Role) => {
    setRole(selectedRole);
    setIsAuthenticated(true);
    // Simulation du stockage JWT
    sessionStorage.setItem('currentUserRole', selectedRole);
    logger.info('Utilisateur connecté', { role: selectedRole });
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('currentUserRole');
    setCurrentView('dashboard');
    logger.info('Utilisateur déconnecté');
  };

  const toggleOffline = () => {
    setIsOffline(!isOffline);
    logger.info(`Mode ${!isOffline ? 'Hors-ligne' : 'Connecté'} activé`);
  };

  const viewShipment = (id: string) => {
    setSelectedShipmentId(id);
    setCurrentView('detail');
    logger.info('Consultation dossier', { shipmentId: id });
  };

  const addShipment = (newShipment: Shipment) => {
    setShipments(prev => [newShipment, ...prev]);
    logger.audit('Dossier Créé', { id: newShipment.id, tracking: newShipment.trackingNumber });
  };

  const updateShipmentStatus = (shipmentId: string, newStatus: ShipmentStatus, deliveryInfo?: DeliveryInfo) => {
    setShipments(prev => prev.map(s => 
      s.id === shipmentId ? { ...s, status: newStatus, deliveryInfo: deliveryInfo || s.deliveryInfo } : s
    ));
    logger.audit('Changement Statut', { shipmentId, status: newStatus });
  };

  const setArrivalDate = (shipmentId: string, date: string) => {
    setShipments(prev => prev.map(s => 
      s.id === shipmentId ? { ...s, arrivalDate: date } : s
    ));
  };

  const setDeclarationDetails = (shipmentId: string, number: string, amount: number) => {
    setShipments(prev => prev.map(s => {
      if (s.id === shipmentId) {
        const newExpense: Expense = {
          id: Date.now().toString(),
          description: `Liquidation Douane (${number})`,
          amount: amount,
          category: 'Douane',
          paid: false,
          type: 'DISBURSEMENT',
          date: new Date().toISOString()
        };
        logger.audit('Déclaration Enregistrée', { shipmentId, declaration: number, amount });
        return {
          ...s,
          declarationNumber: number,
          expenses: [...s.expenses, newExpense]
        };
      }
      return s;
    }));
  };

  const payLiquidation = (shipmentId: string): { success: boolean; message: string } => {
    let result = { success: false, message: '' };
    setShipments(prev => prev.map(s => {
      if (s.id === shipmentId) {
        const provisions = s.expenses.filter(e => e.type === 'PROVISION').reduce((acc, curr) => acc + curr.amount, 0);
        const paidDisbursements = s.expenses.filter(e => e.type === 'DISBURSEMENT' && e.paid).reduce((acc, curr) => acc + curr.amount, 0);
        const currentBalance = provisions - paidDisbursements;
        const liquidationExpense = s.expenses.find(e => e.category === 'Douane' && !e.paid);
        
        if (!liquidationExpense) {
           result = { success: false, message: 'Aucune liquidation en attente trouvée.' };
           return s;
        }

        if (currentBalance >= liquidationExpense.amount) {
           result = { success: true, message: 'Paiement autorisé.' };
           logger.audit('Paiement Liquidation Validé', { shipmentId, amount: liquidationExpense.amount });
           return {
             ...s,
             status: ShipmentStatus.LIQUIDATION_PAID,
             expenses: s.expenses.map(e => e.id === liquidationExpense.id ? { ...e, paid: true } : e)
           };
        } else {
           logger.warn('Paiement refusé (Solde insuffisant)', { shipmentId, balance: currentBalance, required: liquidationExpense.amount });
           result = { success: false, message: `Solde insuffisant (${new Intl.NumberFormat('fr-GN').format(currentBalance)} GNF). Provision requise.` };
           return s;
        }
      }
      return s;
    }));
    return result;
  };

  const handleCreateShipment = (shipment: Shipment) => {
    addShipment(shipment);
    setCurrentView('dashboard');
  };

  const handleAssistantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assistantInput.trim()) return;

    const userMsg = assistantInput;
    setAssistantMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setAssistantInput('');
    setIsAssistantLoading(true);

    // Simulation de réponse locale - à remplacer par un service sécurisé
    const answer = "Service d'assistance temporairement désactivé pour des raisons de sécurité. Veuillez contacter votre superviseur.";
    
    setAssistantMessages(prev => [...prev, { role: 'ai', text: answer }]);
    setIsAssistantLoading(false);
  };

  const addDocument = (id: string, doc: Document) => { 
    setShipments(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, documents: [...s.documents, doc] };
      }
      return s;
    }));
    logger.info('Document ajouté', { shipmentId: id, type: doc.type });
  };
  
  const addExpense = (id: string, expense: Expense) => { 
      setShipments(prev => prev.map(s => {
          if (s.id === id) {
              return { ...s, expenses: [...s.expenses, expense] };
          }
          return s;
      }));
      logger.audit('Transaction Financière', { shipmentId: id, amount: expense.amount, type: expense.type });
  };
  
  const updateShipmentDetails = (id: string, updates: Partial<Shipment>) => {
      setShipments(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
      logger.info('Mise à jour dossier', { shipmentId: id, fields: Object.keys(updates) });
  };

  // --- AUTH VIEW ROUTING ---
  if (!isAuthenticated) {
    if (authView === 'register') {
       return <RegisterScreen onBackToLogin={() => setAuthView('login')} />;
    }
    if (authView === 'invite') {
       return <InviteSetupScreen onBackToLogin={() => setAuthView('login')} onActivationSuccess={() => {
         setRole(Role.FIELD_AGENT); // Simuler activation comme agent
         setIsAuthenticated(true);
       }}/>;
    }
    return <LoginScreen 
       onLogin={handleLogin} 
       onSwitchToRegister={() => setAuthView('register')} 
       onSwitchToInvite={() => setAuthView('invite')}
    />;
  }

  // Determine if user has access to sensitive modules
  const canViewAccounting = role === Role.DIRECTOR || role === Role.ACCOUNTANT;
  const canViewTeam = role === Role.DIRECTOR;

  return (
    <TransitContext.Provider value={{ 
      role, setRole, isOffline, toggleOffline, shipments: filteredShipments, 
      addDocument, addExpense, addShipment, updateShipmentStatus, setArrivalDate, 
      setDeclarationDetails, payLiquidation, updateShipmentDetails
    }}>
      <div className={`flex flex-col h-screen overflow-hidden ${isOffline ? 'grayscale' : ''} bg-[#f8fafc]`}>
        
        {/* PREMIUM NAVBAR (Glassmorphism) - Hidden in Detail View */}
        {currentView !== 'detail' && (
          <div className="glass-panel sticky top-0 z-50">
            <div className="max-w-6xl mx-auto px-4 py-3">
               <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                     <div className="bg-slate-900 text-white p-1.5 rounded-lg">
                        <Box size={18} strokeWidth={2.5} />
                     </div>
                     <span className="font-bold text-lg tracking-tight text-slate-900">Transit<span className="text-slate-500">Secure</span></span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                      <button className="relative p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-500">
                          <Bell size={20} />
                          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                      </button>
                      <div className="h-6 w-px bg-slate-200"></div>
                      <button 
                        onClick={() => setCurrentView('profile')}
                        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                      >
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">
                            {role.charAt(0)}
                          </div>
                          <div className="hidden md:block text-left">
                             <p className="text-xs font-bold text-slate-900">{role}</p>
                             <p className="text-[10px] text-slate-500">Connecté</p>
                          </div>
                      </button>
                      <button onClick={handleLogout} className="ml-2 text-slate-400 hover:text-red-600 transition-colors">
                          <LogOut size={18} />
                      </button>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto pb-24 scroll-smooth bg-[#f8fafc]">
          {currentView === 'dashboard' && (
            <div className="p-4 md:p-6">
              <Dashboard 
                onViewShipment={viewShipment} 
                onCreateShipment={() => setCurrentView('create')} 
              />
            </div>
          )}
          
          {currentView === 'create' && (
             <CreateShipmentForm 
                onSubmit={handleCreateShipment} 
                onCancel={() => setCurrentView('dashboard')} 
             />
          )}

          {currentView === 'detail' && selectedShipmentId && (
            <ShipmentDetail 
              shipmentId={selectedShipmentId} 
              onBack={() => setCurrentView('dashboard')} 
            />
          )}

          {currentView === 'calculator' && (
            <div className="p-4 md:p-6 max-w-3xl mx-auto animate-in fade-in duration-300">
              <header className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Simulateur Douanier</h1>
                <p className="text-sm text-slate-500">Estimation des droits et taxes</p>
              </header>
              <CustomsCalculator />
            </div>
          )}
          
          {currentView === 'accounting' && canViewAccounting && (
             <AccountingView />
          )}

          {currentView === 'team' && canViewTeam && (
             <TeamManagement />
          )}
          
          {currentView === 'profile' && (
             <ProfileSettings />
          )}

          {currentView === 'assistant' && (
            <div className="flex flex-col h-full bg-white max-w-3xl mx-auto border-x border-slate-100 shadow-sm">
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                {assistantMessages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-4 rounded-xl text-sm leading-relaxed shadow-sm ${m.role === 'user' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>
                      {m.text}
                    </div>
                  </div>
                ))}
                {isAssistantLoading && (
                   <div className="flex justify-start">
                     <div className="bg-white px-4 py-2 rounded-full border border-slate-100 text-slate-400 text-xs shadow-sm">
                        L'assistant réfléchit...
                     </div>
                   </div>
                )}
              </div>
              <form onSubmit={handleAssistantSubmit} className="p-4 bg-white border-t border-slate-100 flex gap-2">
                <input 
                  value={assistantInput}
                  onChange={e => setAssistantInput(e.target.value)}
                  placeholder="Posez votre question technique..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all text-slate-900"
                />
                <button type="submit" disabled={isAssistantLoading} className="bg-slate-900 text-white px-4 rounded-lg hover:bg-slate-800 transition-colors">
                  <Send size={18} />
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Clean Bottom Navigation - Fixed Overflow for many items */}
        <div className="fixed bottom-6 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-auto bg-slate-900 text-white rounded-2xl shadow-2xl z-40 px-6 py-3 border border-slate-800">
           <div className="flex gap-6 items-center justify-between md:justify-center overflow-x-auto no-scrollbar w-full">
            <button 
              onClick={() => setCurrentView('dashboard')}
              className={`flex flex-col items-center gap-1 transition-all flex-shrink-0 ${currentView === 'dashboard' || currentView === 'create' ? 'text-white scale-110' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <LayoutGrid size={20} />
            </button>
            
            <button 
              onClick={() => setCurrentView('calculator')}
              className={`flex flex-col items-center gap-1 transition-all flex-shrink-0 ${currentView === 'calculator' ? 'text-white scale-110' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Calculator size={20} />
            </button>

            {canViewAccounting && (
              <button 
                 onClick={() => setCurrentView('accounting')}
                 className={`flex flex-col items-center gap-1 transition-all flex-shrink-0 ${currentView === 'accounting' ? 'text-white scale-110' : 'text-slate-400 hover:text-slate-200'}`}
              >
                 <PieChart size={20} />
              </button>
            )}

            {canViewTeam && (
              <button 
                 onClick={() => setCurrentView('team')}
                 className={`flex flex-col items-center gap-1 transition-all flex-shrink-0 ${currentView === 'team' ? 'text-white scale-110' : 'text-slate-400 hover:text-slate-200'}`}
              >
                 <Users size={20} />
              </button>
            )}

            <button 
               onClick={() => setCurrentView('assistant')}
               className={`flex flex-col items-center gap-1 transition-all flex-shrink-0 ${currentView === 'assistant' ? 'text-white scale-110' : 'text-slate-400 hover:text-slate-200'}`}
            >
               <MessageSquare size={20} />
            </button>
            
            <button 
               onClick={() => setCurrentView('profile')}
               className={`flex flex-col items-center gap-1 transition-all flex-shrink-0 ${currentView === 'profile' ? 'text-white scale-110' : 'text-slate-400 hover:text-slate-200'}`}
            >
               <User size={20} />
            </button>

             <button onClick={toggleOffline} className={`flex flex-col items-center gap-1 transition-all flex-shrink-0 ${isOffline ? 'text-orange-500' : 'text-slate-500 hover:text-slate-400'}`}>
                {isOffline ? <WifiOff size={20} /> : <Wifi size={20}/>}
             </button>
           </div>
        </div>

      </div>
    </TransitContext.Provider>
  );
};

export default App;
