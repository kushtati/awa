
import React, { useContext, useState } from 'react';
import { TransitContext } from '../App';
import { Shipment, ShipmentStatus, Document, Role, Expense } from '../types';
import { ArrowLeft, FileText, CheckCircle2, MessageCircle, AlertCircle, Plus, Wallet, TrendingDown, TrendingUp, Ship, MapPin, Container, Anchor, Hash, ShieldCheck, PlayCircle, AlertTriangle, Lock, Truck, UserCheck, CalendarClock, Timer, Calculator, AlertOctagon, Banknote, Stamp, Camera, PenLine, Save, Upload, Receipt, PackageCheck, Hourglass, Info, Calendar } from 'lucide-react';
import { DocumentScanner } from './DocumentScanner';

interface Props {
  shipmentId: string;
  onBack: () => void;
}

export const ShipmentDetail: React.FC<Props> = ({ shipmentId, onBack }) => {
  const { shipments, role, updateShipmentStatus, addDocument, setArrivalDate, setDeclarationDetails, payLiquidation, addExpense, updateShipmentDetails } = useContext(TransitContext);
  
  // Security & Role Logic
  const canViewFinance = role === Role.ACCOUNTANT || role === Role.DIRECTOR;
  const canMakePayments = role === Role.ACCOUNTANT || role === Role.DIRECTOR;
  const canEditOperations = role !== Role.CLIENT;

  // Default tab logic
  const [activeTab, setActiveTab] = useState<'timeline' | 'details' | 'docs' | 'finance'>('timeline');
  
  const [showScanner, setShowScanner] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [deliveryForm, setDeliveryForm] = useState({ driverName: '', truckPlate: '', recipientName: '' });
  
  // Context for scanner (what are we scanning?)
  const [scanContext, setScanContext] = useState<{ type: 'generic' | 'BAE' | 'TRUCK_PHOTO' | 'RECEIPT', expenseId?: string }>({ type: 'generic' });
  
  // Edit Mode for Tracking Manager
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Shipment>>({});
  
  // Financial Actions State
  const [showFinanceInput, setShowFinanceInput] = useState<'PROVISION' | 'DISBURSEMENT' | null>(null);
  const [financeForm, setFinanceForm] = useState({ amount: '', description: '' });

  // Declaration Form
  const [declForm, setDeclForm] = useState({ number: '', amount: '' });
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const shipment = shipments.find(s => s.id === shipmentId);

  if (!shipment) return <div>Dossier introuvable</div>;

  const handleWhatsAppShare = () => {
    const message = `*TRANSIT GUINÉE* - Point Dossier\n\n📦 Ref: ${shipment.trackingNumber}\n🚢 BL: ${shipment.blNumber}\n📍 Statut: ${shipment.status}\n📅 ETA: ${shipment.eta}\n\nMerci de votre confiance.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const openScanner = (type: 'generic' | 'BAE' | 'TRUCK_PHOTO' | 'RECEIPT' = 'generic', expenseId?: string) => {
    setScanContext({ type, expenseId });
    setShowScanner(true);
  };

  const handleScanResult = (result: any) => {
    setAnalysisResult(result);
    setShowScanner(false);
    
    let docType: Document['type'] = 'Autre';
    let docName = 'Document Scanné';

    if (scanContext.type === 'BAE') {
        docType = 'BAE';
        docName = 'Bon à Enlever (BAE)';
    } else if (scanContext.type === 'TRUCK_PHOTO') {
        docType = 'Photo Camion';
        docName = `Chargement ${deliveryForm.truckPlate || ''}`;
    } else if (scanContext.type === 'RECEIPT') {
        docType = 'Quittance'; // Or Generic Receipt
        docName = `Reçu Paiement - ${scanContext.expenseId ? 'Dépense' : 'Douane'}`;
    } else {
        docType = (['DDI', 'BSC', 'Quittance', 'BAE', 'BAD'].includes(result.detectedType)) ? result.detectedType : 'Autre';
        docName = result.detectedType ? `Scan ${result.detectedType}` : 'Document';
    }

    const newDoc: Document = {
      id: Date.now().toString(),
      name: docName,
      type: docType,
      status: 'Verified',
      uploadDate: new Date().toISOString()
    };
    addDocument(shipmentId, newDoc);
    
    // Auto-trigger workflows based on scan
    if (docType === 'Quittance' && shipment.status === ShipmentStatus.CUSTOMS_LIQUIDATION) {
       // Confirmation of payment via receipt upload
       const res = payLiquidation(shipmentId);
       if (!res.success) setPaymentError(res.message);
       else setPaymentError(null);
    }
    
    if (docType === 'BAE' && shipment.status === ShipmentStatus.LIQUIDATION_PAID) {
        updateShipmentStatus(shipmentId, ShipmentStatus.BAE_GRANTED);
    }
  };

  const handlePaymentClick = () => {
      // Step 1: Check permission
      if (!canMakePayments) return;
      
      // Step 2: Attempt Payment Logic (Check Balance)
      const res = payLiquidation(shipmentId);
      
      if (!res.success) {
          setPaymentError(res.message);
      } else {
          setPaymentError(null);
          // Step 3: Require Receipt Upload immediately
          alert("Paiement Validé. Veuillez maintenant scanner la Quittance/Reçu.");
          openScanner('RECEIPT');
      }
  };
  
  // --- ACCOUNTANT ACTIONS ---
  const handleAddFinance = (type: 'PROVISION' | 'DISBURSEMENT') => {
      if(!financeForm.amount || !financeForm.description) return;
      
      addExpense(shipmentId, {
          id: Date.now().toString(),
          description: financeForm.description,
          amount: parseFloat(financeForm.amount),
          category: type === 'PROVISION' ? 'Autre' : 'Logistique', // Simple default
          paid: true,
          type: type,
          date: new Date().toISOString()
      });
      setShowFinanceInput(null);
      setFinanceForm({ amount: '', description: '' });
  };
  
  // --- TRACKING MANAGER EDIT ---
  const toggleEdit = () => {
      if (isEditing) {
          // Save
          if(updateShipmentDetails) updateShipmentDetails(shipmentId, editForm);
          setIsEditing(false);
      } else {
          setEditForm({
              blNumber: shipment.blNumber,
              containerNumber: shipment.containerNumber,
              shippingLine: shipment.shippingLine,
              origin: shipment.origin,
              destination: shipment.destination,
              eta: shipment.eta
          });
          setIsEditing(true);
      }
  };

  // --- WORKFLOW LOGIC ---
  const hasDDI = shipment.documents.some(d => d.type === 'DDI');
  const hasBSC = shipment.documents.some(d => d.type === 'BSC');
  const hasBAE = shipment.documents.some(d => d.type === 'BAE');
  const hasTruckPhoto = shipment.documents.some(d => d.type === 'Photo Camion');

  const handleStartPreClearance = () => updateShipmentStatus(shipmentId, ShipmentStatus.PRE_CLEARANCE);
  
  const handleDeclarationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(declForm.number && declForm.amount) {
       setDeclarationDetails(shipmentId, declForm.number, parseFloat(declForm.amount));
    }
  };
  
  const handleDeliverySubmit = () => {
     if(deliveryForm.driverName && deliveryForm.truckPlate) {
         updateShipmentStatus(shipmentId, ShipmentStatus.DELIVERED, {
             driverName: deliveryForm.driverName,
             truckPlate: deliveryForm.truckPlate,
             recipientName: deliveryForm.recipientName,
             deliveryDate: new Date().toISOString()
         });
     }
  };

  const getStatusIndex = (status: ShipmentStatus) => {
    const order = [
      ShipmentStatus.OPENED,
      ShipmentStatus.PRE_CLEARANCE,
      ShipmentStatus.CUSTOMS_LIQUIDATION,
      ShipmentStatus.LIQUIDATION_PAID,
      ShipmentStatus.BAE_GRANTED,
      ShipmentStatus.PORT_EXIT,
      ShipmentStatus.DELIVERED
    ];
    return order.indexOf(status);
  };
  
  const currentStatusIndex = getStatusIndex(shipment.status);

  const provisions = shipment.expenses.filter(e => e.type === 'PROVISION');
  const disbursements = shipment.expenses.filter(e => e.type === 'DISBURSEMENT' && e.paid);
  const totalProvisions = provisions.reduce((sum, e) => sum + e.amount, 0);
  const totalPaidDisbursements = disbursements.reduce((sum, e) => sum + e.amount, 0);
  const clientAvailableBalance = totalProvisions - totalPaidDisbursements;
  const formatGNF = (val: number) => new Intl.NumberFormat('fr-GN', { style: 'currency', currency: 'GNF', maximumFractionDigits: 0 }).format(val);

  // Define visible tabs based on role
  const visibleTabs = ['timeline', 'details', 'docs'];
  if (canViewFinance) visibleTabs.push('finance');

  // Helper for Timeline Steps
  const TimelineStep = ({ title, status, children, icon: Icon, isLast }: any) => (
      <div className={`relative pl-8 pb-10 ${!isLast ? 'border-l-2' : ''} ${status === 'completed' ? 'border-emerald-500' : status === 'current' ? 'border-blue-600' : 'border-slate-200'}`}>
          <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 transition-all duration-300 ${status === 'completed' ? 'bg-emerald-500 border-emerald-500' : status === 'current' ? 'bg-white border-blue-600 scale-125' : 'bg-slate-100 border-slate-300'}`}></div>
          <div className={`transition-all duration-300 ${status === 'pending' ? 'opacity-60 grayscale' : 'opacity-100'}`}>
              <h4 className={`font-bold text-sm flex items-center gap-2 mb-3 ${status === 'current' ? 'text-blue-600' : status === 'completed' ? 'text-emerald-700' : 'text-slate-700'}`}>
                  {Icon && <Icon size={16} />} {title}
                  {status === 'completed' && <CheckCircle2 size={14} className="text-emerald-500 ml-auto" />}
                  {status === 'pending' && <span className="ml-auto text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-400 font-medium">À venir</span>}
              </h4>
              <div>{children}</div>
          </div>
      </div>
  );

  return (
    <div className="bg-[#f8fafc] min-h-full flex flex-col relative animate-in slide-in-from-right duration-300">
      
      {/* 1. Immersive Header */}
      <div className="bg-[#0f172a] text-white p-5 pt-safe-top shadow-xl shadow-slate-900/10 rounded-b-[1.5rem] relative z-10">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onBack} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 backdrop-blur-md transition-all">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xs font-bold tracking-widest uppercase opacity-70">Détail Dossier</h1>
          <button onClick={handleWhatsAppShare} className="p-2 bg-emerald-500 rounded-xl text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 transition-all">
             <MessageCircle size={20} />
          </button>
        </div>
        
        <div className="mb-4">
           <div className="flex items-center gap-2 mb-2">
             <span className="bg-blue-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">{shipment.customsRegime}</span>
             <span className="bg-slate-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-slate-300">{shipment.commodityType}</span>
             <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${shipment.alerts.length > 0 ? 'bg-red-500 text-white animate-pulse' : 'hidden'}`}>Bloqué</span>
           </div>
           
           <div className="flex justify-between items-start relative">
             <div className="w-full">
               <h2 className="text-2xl font-bold tracking-tight mb-1">{shipment.trackingNumber}</h2>
               <p className="text-slate-400 text-sm font-medium">{shipment.clientName}</p>
             </div>
             {(role === Role.CREATION_AGENT || role === Role.DIRECTOR) && (
                 <button onClick={toggleEdit} className="p-2 rounded-full hover:bg-white/10 transition-colors absolute right-0 top-0">
                     {isEditing ? <Save size={20} className="text-emerald-400" /> : <PenLine size={20} className="text-slate-400" />}
                 </button>
             )}
           </div>
           
           {/* EDITABLE FIELDS (Overlay) */}
           {isEditing && (
               <div className="mt-4 bg-slate-800/90 border border-slate-700 p-4 rounded-xl space-y-3 shadow-2xl backdrop-blur-sm relative z-30">
                   <h3 className="text-xs font-bold text-slate-400 uppercase">Modification Rapide</h3>
                   <div className="grid grid-cols-2 gap-3">
                     <input 
                       value={editForm.blNumber || ''} 
                       onChange={e => setEditForm({...editForm, blNumber: e.target.value})}
                       placeholder="BL Number"
                       className="w-full bg-slate-900 text-white p-2 rounded border border-slate-600 text-xs" 
                     />
                     <input 
                       value={editForm.containerNumber || ''} 
                       onChange={e => setEditForm({...editForm, containerNumber: e.target.value})}
                       placeholder="Container Number"
                       className="w-full bg-slate-900 text-white p-2 rounded border border-slate-600 text-xs" 
                     />
                     <input 
                       value={editForm.origin || ''} 
                       onChange={e => setEditForm({...editForm, origin: e.target.value})}
                       placeholder="Origine"
                       className="w-full bg-slate-900 text-white p-2 rounded border border-slate-600 text-xs" 
                     />
                     <input 
                       type="date"
                       value={editForm.eta || ''} 
                       onChange={e => setEditForm({...editForm, eta: e.target.value})}
                       className="w-full bg-slate-900 text-white p-2 rounded border border-slate-600 text-xs" 
                     />
                   </div>
               </div>
           )}
        </div>
      </div>

      {/* 2. Floating Pill Tabs - Adjusted for proper sticking */}
      <div className="px-4 -mt-6 sticky top-0 z-20 flex-shrink-0">
        <div className="bg-white p-1.5 rounded-2xl shadow-lg shadow-slate-200/50 flex justify-between border border-slate-100 overflow-x-auto">
           {visibleTabs.map((tab) => (
             <button 
               key={tab}
               onClick={() => setActiveTab(tab as any)}
               className={`flex-1 min-w-[70px] py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all duration-300 ${activeTab === tab ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
             >
               {tab === 'timeline' ? 'Suivi' : tab === 'details' ? 'Infos' : tab === 'docs' ? 'Docs' : 'Compta'}
             </button>
           ))}
        </div>
      </div>

      {/* 3. CONTENT AREA - Fixed double scroll issue by removing internal scroll */}
      <div className="p-6 pb-40 space-y-6 mt-2">
        
        {/* TAB: DÉTAILS (NEW) */}
        {activeTab === 'details' && (
           <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
              
              {/* Route Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <MapPin size={14} /> Itinéraire
                 </h3>
                 <div className="flex items-center justify-between relative">
                    {/* Line */}
                    <div className="absolute top-1/2 left-10 right-10 h-0.5 bg-slate-100 -z-0"></div>
                    
                    <div className="text-center z-10 bg-white px-2">
                       <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-400">
                          <Anchor size={18} />
                       </div>
                       <p className="font-bold text-slate-900 text-sm">{shipment.origin}</p>
                       <p className="text-[10px] text-slate-500">Départ</p>
                    </div>

                    <div className="text-center z-10 bg-white px-2">
                       <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-2 text-blue-600">
                          <MapPin size={18} />
                       </div>
                       <p className="font-bold text-slate-900 text-sm">{shipment.destination}</p>
                       <p className="text-[10px] text-slate-500">Arrivée</p>
                    </div>
                 </div>
              </div>

              {/* Technical Data Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Info size={14} /> Données Logistiques
                 </h3>
                 <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                       <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">N° BL / LTA</p>
                       <p className="text-sm font-mono font-bold text-slate-800 break-all">{shipment.blNumber}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                       <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Compagnie</p>
                       <p className="text-sm font-bold text-slate-800">{shipment.shippingLine}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                       <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">N° Conteneur</p>
                       <p className="text-sm font-mono font-bold text-slate-800 break-all">{shipment.containerNumber || 'N/A'}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                       <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Type</p>
                       <p className="text-sm font-bold text-slate-800">{shipment.commodityType}</p>
                    </div>
                 </div>
                 <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-2">Description Marchandise</p>
                    <p className="text-sm text-slate-700 leading-relaxed font-medium bg-slate-50 p-3 rounded-lg border border-slate-100">
                       {shipment.description}
                    </p>
                 </div>
              </div>

              {/* Dates & Franchise Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Calendar size={14} /> Délais & Franchise
                 </h3>
                 <div className="space-y-3">
                    <div className="flex justify-between items-center p-2 rounded-lg hover:bg-slate-50">
                       <span className="text-sm text-slate-600 font-medium">ETA (Estimée)</span>
                       <span className="text-sm font-bold text-slate-900">{new Date(shipment.eta).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg hover:bg-slate-50">
                       <span className="text-sm text-slate-600 font-medium">Arrivée Réelle</span>
                       <span className="text-sm font-bold text-slate-900">{shipment.arrivalDate ? new Date(shipment.arrivalDate).toLocaleDateString() : 'Non arrivé'}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-orange-50 border border-orange-100">
                       <span className="text-sm text-orange-700 font-bold flex items-center gap-2"><Hourglass size={14}/> Franchise Restante</span>
                       <span className="text-sm font-bold text-orange-700">{shipment.freeDays} Jours</span>
                    </div>
                 </div>
              </div>
           </div>
        )}

        {/* TAB: TIMELINE */}
        {activeTab === 'timeline' && (
          <div className="mt-2 pl-2 animate-in fade-in slide-in-from-bottom-2">
             {/* 1. INITIALISATION */}
             <TimelineStep 
                title="Ouverture & Documents" 
                status={currentStatusIndex > 0 ? 'completed' : 'current'} 
                icon={FileText}
             >
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                   <p className="text-xs text-slate-500 mb-2">Réception des documents originaux.</p>
                   {currentStatusIndex === 0 && canEditOperations ? (
                       <button onClick={handleStartPreClearance} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-md transition-all flex items-center justify-center gap-2">
                           <PlayCircle size={16} /> Initier Pré-Dédouanement
                       </button>
                   ) : (
                       <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold bg-emerald-50 p-2 rounded-lg w-fit">
                          <CheckCircle2 size={14}/> Dossier initialisé
                       </div>
                   )}
                </div>
             </TimelineStep>

             {/* 2. PRÉ-DÉDOUANEMENT */}
             <TimelineStep 
                title="Pré-Dédouanement" 
                status={currentStatusIndex > 1 ? 'completed' : currentStatusIndex === 1 ? 'current' : 'pending'} 
                icon={ShieldCheck}
             >
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-3">
                    <p className="text-xs text-slate-500">Validation DDI et Bordereau de Suivi de Cargaison.</p>
                    <div className="flex gap-2">
                        <span className={`flex-1 py-2 text-center rounded-lg text-xs font-bold border transition-colors ${hasDDI ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                            {hasDDI ? '✓ DDI OK' : 'DDI Attente'}
                        </span>
                        <span className={`flex-1 py-2 text-center rounded-lg text-xs font-bold border transition-colors ${hasBSC ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                            {hasBSC ? '✓ BSC OK' : 'BSC Attente'}
                        </span>
                    </div>
                    
                    {currentStatusIndex === 1 && canEditOperations && (
                        <div className="space-y-2 pt-2 border-t border-slate-50">
                            {!hasDDI && <button onClick={() => openScanner('generic')} className="w-full py-2.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg">Scanner DDI</button>}
                            {!hasBSC && <button onClick={() => openScanner('generic')} className="w-full py-2.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg">Scanner BSC</button>}
                            {hasDDI && hasBSC && (
                                <button onClick={() => updateShipmentStatus(shipmentId, ShipmentStatus.CUSTOMS_LIQUIDATION)} className="w-full py-3 bg-slate-900 text-white text-xs font-bold rounded-lg shadow-lg mt-2">
                                    Valider & Passer en Liquidation
                                </button>
                            )}
                        </div>
                    )}
                </div>
             </TimelineStep>

             {/* 3. LIQUIDATION */}
             <TimelineStep 
                title="Douane & Paiement" 
                status={currentStatusIndex > 3 ? 'completed' : currentStatusIndex >= 2 ? 'current' : 'pending'} 
                icon={Calculator}
             >
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-3">
                     {!shipment.declarationNumber && canEditOperations && currentStatusIndex === 2 ? (
                        <form onSubmit={handleDeclarationSubmit} className="space-y-2">
                           <input required value={declForm.number} onChange={e => setDeclForm({...declForm, number: e.target.value})} placeholder="N° Déclaration Sydonia" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-xs font-bold" />
                           <input required type="number" value={declForm.amount} onChange={e => setDeclForm({...declForm, amount: e.target.value})} placeholder="Montant Liquidation (GNF)" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-xs font-bold" />
                           <button type="submit" className="w-full py-2.5 bg-blue-600 text-white text-xs font-bold rounded-lg">Enregistrer Déclaration</button>
                        </form>
                     ) : (
                         <div className="flex justify-between items-center text-xs p-2 bg-slate-50 rounded-lg">
                             <span className="text-slate-500 font-medium">Déclaration</span>
                             <span className="font-mono font-bold text-slate-800">{shipment.declarationNumber || 'En attente'}</span>
                         </div>
                     )}
                     
                     <div className={`p-3 rounded-lg border transition-colors ${shipment.status === ShipmentStatus.LIQUIDATION_PAID || currentStatusIndex > 3 ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                         <div className="flex justify-between items-center mb-2">
                             <span className={`text-xs font-bold ${shipment.status === ShipmentStatus.LIQUIDATION_PAID || currentStatusIndex > 3 ? 'text-emerald-700' : 'text-slate-500'}`}>
                                 {shipment.status === ShipmentStatus.LIQUIDATION_PAID || currentStatusIndex > 3 ? 'Liquidation Payée' : 'Paiement Requis'}
                             </span>
                             {(shipment.status === ShipmentStatus.LIQUIDATION_PAID || currentStatusIndex > 3) && <CheckCircle2 size={16} className="text-emerald-600"/>}
                         </div>
                         
                         {shipment.status === ShipmentStatus.CUSTOMS_LIQUIDATION && canMakePayments && shipment.declarationNumber && (
                             <div className="mt-2">
                                 <button onClick={handlePaymentClick} className="w-full py-2.5 bg-slate-900 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 shadow-sm">
                                     <Banknote size={14} /> Effectuer Paiement
                                 </button>
                                 {paymentError && <p className="text-[10px] text-red-500 mt-2 font-bold text-center bg-red-50 p-1 rounded border border-red-100">{paymentError}</p>}
                             </div>
                         )}
                     </div>
                </div>
             </TimelineStep>

             {/* 4. FINALISATION (BAE & Sortie) */}
             <TimelineStep 
                title="Sortie Portuaire" 
                status={currentStatusIndex > 5 ? 'completed' : currentStatusIndex >= 4 ? 'current' : 'pending'} 
                icon={Truck}
             >
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-2">
                    <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                        <span className="text-xs font-medium text-slate-600">Bon à Enlever (BAE)</span>
                        {hasBAE ? <CheckCircle2 size={16} className="text-emerald-500"/> : (role === Role.FIELD_AGENT && currentStatusIndex === 3 && <button onClick={()=>openScanner('BAE')} className="text-[10px] bg-blue-600 text-white px-2 py-1 rounded">Scanner</button>)}
                    </div>
                    <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                        <span className="text-xs font-medium text-slate-600">Chargement Camion</span>
                        {hasTruckPhoto ? <CheckCircle2 size={16} className="text-emerald-500"/> : (role === Role.FIELD_AGENT && currentStatusIndex >= 3 && <button onClick={()=>openScanner('TRUCK_PHOTO')} className="text-[10px] bg-blue-600 text-white px-2 py-1 rounded">Photo</button>)}
                    </div>
                    
                    {hasBAE && hasTruckPhoto && currentStatusIndex < 5 && canEditOperations && (
                         <button onClick={() => updateShipmentStatus(shipmentId, ShipmentStatus.PORT_EXIT)} className="w-full py-3 mt-2 bg-slate-900 text-white text-xs font-bold rounded-lg shadow-md">
                             Valider Sortie Port
                         </button>
                    )}
                    
                    {currentStatusIndex >= 5 && (
                         <div className="bg-blue-50 text-blue-700 text-xs font-bold p-3 rounded-lg text-center border border-blue-100">
                             Marchandise sortie du port.
                         </div>
                    )}
                </div>
             </TimelineStep>

             {/* 5. LIVRAISON FINALE */}
             <TimelineStep 
                title="Livraison Client" 
                status={shipment.status === ShipmentStatus.DELIVERED ? 'completed' : 'pending'} 
                icon={PackageCheck}
                isLast={true}
             >
                 {shipment.status === ShipmentStatus.PORT_EXIT && canEditOperations ? (
                     <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
                         <h5 className="text-xs font-bold text-slate-800 uppercase mb-3">Confirmer Réception</h5>
                         <div className="space-y-3">
                             <input value={deliveryForm.recipientName} onChange={e => setDeliveryForm({...deliveryForm, recipientName: e.target.value})} placeholder="Nom Réceptionnaire" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-xs" />
                             <input value={deliveryForm.driverName} onChange={e => setDeliveryForm({...deliveryForm, driverName: e.target.value})} placeholder="Chauffeur" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-xs" />
                             <input value={deliveryForm.truckPlate} onChange={e => setDeliveryForm({...deliveryForm, truckPlate: e.target.value})} placeholder="Plaque Camion" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-xs" />
                             <button onClick={handleDeliverySubmit} className="w-full py-3 bg-emerald-600 text-white font-bold rounded-lg shadow-lg hover:bg-emerald-500 transition-all">Valider Livraison Finale</button>
                         </div>
                     </div>
                 ) : shipment.status === ShipmentStatus.DELIVERED && shipment.deliveryInfo ? (
                     <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                         <div className="flex items-center gap-2 mb-3 text-emerald-800 font-bold text-sm">
                             <CheckCircle2 size={18} /> Livraison Effectuée
                         </div>
                         <div className="space-y-1 text-xs text-emerald-700">
                             <p>📅 Date: {new Date(shipment.deliveryInfo.deliveryDate).toLocaleDateString()} à {new Date(shipment.deliveryInfo.deliveryDate).toLocaleTimeString()}</p>
                             <p>👤 Reçu par: <span className="font-bold">{shipment.deliveryInfo.recipientName}</span></p>
                             <p>🚛 Transport: {shipment.deliveryInfo.driverName} ({shipment.deliveryInfo.truckPlate})</p>
                         </div>
                     </div>
                 ) : (
                     <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 text-center text-xs text-slate-400 font-medium">
                        Livraison finale en attente
                     </div>
                 )}
             </TimelineStep>
          </div>
        )}

        {/* TAB: DOCS */}
        {activeTab === 'docs' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex justify-between items-center px-1">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck size={18} className="text-blue-600" /> Coffre-fort Numérique
              </h3>
              {role !== Role.CLIENT && (
                <button onClick={() => openScanner('generic')} className="flex items-center gap-1 bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg shadow-slate-900/20 active:scale-95 transition-all">
                  <Plus size={16} /> SCAN
                </button>
              )}
            </div>
            {shipment.documents.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                    <FileText className="mx-auto text-slate-300 mb-2" size={32} />
                    <p className="text-sm text-slate-400 font-medium">Aucun document numérisé.</p>
                </div>
            ) : (
                shipment.documents.map((doc) => (
                  <div key={doc.id} className="group bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:border-blue-200 transition-all cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl transition-colors ${doc.type === 'Quittance' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'}`}>
                          {doc.type === 'Quittance' ? <Receipt size={20}/> : <FileText size={20} />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{doc.name}</p>
                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{doc.type} • {new Date(doc.uploadDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {doc.status === 'Verified' ? <CheckCircle2 size={20} className="text-emerald-500" /> : <div className="w-2 h-2 rounded-full bg-orange-400"></div>}
                  </div>
                ))
            )}
          </div>
        )}

        {/* TAB: FINANCE */}
        {activeTab === 'finance' && canViewFinance && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
             {/* Accountant Tools */}
             {canMakePayments && (
                 <div className="flex gap-2 mb-4">
                     <button onClick={() => setShowFinanceInput('PROVISION')} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95">
                         <Plus size={16} /> PROVISION
                     </button>
                     <button onClick={() => setShowFinanceInput('DISBURSEMENT')} className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl shadow-lg font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95">
                         <Plus size={16} /> DÉBOURS
                     </button>
                 </div>
             )}

             {/* Simple Modal for Finance Input */}
             {showFinanceInput && (
                 <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xl mb-4 animate-in zoom-in-95 duration-200">
                     <h4 className="font-bold text-slate-800 mb-3">{showFinanceInput === 'PROVISION' ? 'Nouvelle Entrée Client' : 'Nouveau Paiement'}</h4>
                     <input 
                        type="number" 
                        placeholder="Montant (GNF)" 
                        className="w-full p-3 mb-2 bg-slate-50 rounded-xl border border-slate-200 font-bold focus:ring-2 focus:ring-slate-900"
                        value={financeForm.amount}
                        onChange={e => setFinanceForm({...financeForm, amount: e.target.value})}
                     />
                     <input 
                        type="text" 
                        placeholder="Description / Motif" 
                        className="w-full p-3 mb-3 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-slate-900"
                        value={financeForm.description}
                        onChange={e => setFinanceForm({...financeForm, description: e.target.value})}
                     />
                     <div className="flex gap-2">
                         <button onClick={() => setShowFinanceInput(null)} className="flex-1 py-2.5 rounded-lg text-slate-500 font-bold text-sm bg-slate-100 hover:bg-slate-200 transition-colors">Annuler</button>
                         <button onClick={() => handleAddFinance(showFinanceInput)} className="flex-1 py-2.5 rounded-lg text-white font-bold text-sm bg-slate-900 hover:bg-slate-800 transition-colors">Valider</button>
                     </div>
                 </div>
             )}

             <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-[2rem] text-white shadow-xl shadow-slate-900/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-3xl opacity-20 -mr-10 -mt-10"></div>
                <p className="text-blue-200 text-[10px] font-bold uppercase tracking-widest mb-2">Solde Client (Compte Dossier)</p>
                <p className={`text-4xl font-bold tracking-tight ${clientAvailableBalance < 0 ? 'text-red-300' : 'text-white'}`}>{formatGNF(clientAvailableBalance)}</p>
                <div className="mt-8 flex gap-3">
                   <div className="flex-1 bg-white/5 p-3 rounded-2xl backdrop-blur-sm border border-white/10">
                      <span className="block text-[10px] text-emerald-300 uppercase font-bold mb-1">Entrées</span>
                      <span className="font-bold text-white text-sm flex items-center gap-1"><TrendingUp size={14} className="text-emerald-400"/> {formatGNF(totalProvisions)}</span>
                   </div>
                   <div className="flex-1 bg-white/5 p-3 rounded-2xl backdrop-blur-sm border border-white/10">
                      <span className="block text-[10px] text-red-300 uppercase font-bold mb-1">Sorties</span>
                      <span className="font-bold text-white text-sm flex items-center gap-1"><TrendingDown size={14} className="text-red-400"/> {formatGNF(totalPaidDisbursements)}</span>
                   </div>
                </div>
             </div>
             
             <div className="space-y-3">
                <h4 className="font-bold text-slate-800 px-1 mb-2 text-sm uppercase tracking-wide">Historique</h4>
                {[...shipment.expenses].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((exp) => (
                   <div key={exp.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-2 relative overflow-hidden">
                      {/* Decoration bar */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${exp.type === 'PROVISION' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                      
                      <div className="flex justify-between items-start pl-2">
                          <div className="flex items-start gap-3">
                            <div className={`mt-0.5 p-2 rounded-xl ${exp.type === 'PROVISION' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                                {exp.type === 'PROVISION' ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}
                            </div>
                            <div>
                                <p className="font-bold text-slate-800 text-sm">{exp.description}</p>
                                <p className="text-xs text-slate-400 font-medium mt-0.5">{new Date(exp.date).toLocaleDateString()} • <span className="uppercase">{exp.category}</span></p>
                            </div>
                          </div>
                          <span className={`font-bold text-sm ${exp.type === 'PROVISION' ? 'text-emerald-600' : 'text-slate-900'}`}>
                              {exp.type === 'PROVISION' ? '+' : '-'} {formatGNF(exp.amount)}
                          </span>
                      </div>
                      
                      {/* Add Receipt Proof Action for Disbursements */}
                      {exp.type === 'DISBURSEMENT' && (
                          <div className="flex justify-end pt-2 border-t border-slate-50 mt-1">
                              <button 
                                onClick={() => openScanner('RECEIPT', exp.id)}
                                className="text-xs flex items-center gap-1 text-slate-500 hover:text-blue-600 font-medium transition-colors px-2 py-1 rounded hover:bg-slate-50"
                              >
                                  <Upload size={12} />
                                  <span>Joindre Reçu</span>
                              </button>
                          </div>
                      )}
                   </div>
                ))}
             </div>
          </div>
        )}
      </div>

      {showScanner && <DocumentScanner onScanComplete={handleScanResult} onClose={() => setShowScanner(false)} />}
    </div>
  );
};
