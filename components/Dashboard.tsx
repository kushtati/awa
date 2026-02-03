
import React, { useContext, useState, useMemo } from 'react';
import { TransitContext } from '../App';
import { Role, ShipmentStatus } from '../types';
import { 
  Search, Plus, Filter, ArrowRight, MoreHorizontal, 
  Clock, CheckCircle2, AlertCircle, Package, Truck, Anchor, 
  AlertTriangle
} from 'lucide-react';

interface DashboardProps {
  onViewShipment: (id: string) => void;
  onCreateShipment: () => void;
}

type FilterMode = 'ALL' | 'TRANSIT' | 'CUSTOMS' | 'ALERTS' | 'ATTENTION' | 'COMPLETED';

export const Dashboard: React.FC<DashboardProps> = ({ onViewShipment, onCreateShipment }) => {
  const { shipments, role } = useContext(TransitContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('ALL');

  // --- STATS CALCULATION ---
  const stats = useMemo(() => {
    const active = shipments.filter(s => s.status !== ShipmentStatus.DELIVERED);
    return {
      total: active.length,
      blocked: active.filter(s => s.alerts.length > 0).length,
      customs: active.filter(s => s.status === ShipmentStatus.CUSTOMS_LIQUIDATION || s.status === ShipmentStatus.LIQUIDATION_PAID).length,
      transit: active.filter(s => s.status === ShipmentStatus.OPENED || s.status === ShipmentStatus.PRE_CLEARANCE).length
    };
  }, [shipments]);

  // --- FILTERING ---
  const filteredShipments = useMemo(() => {
    let data = shipments;

    switch (filterMode) {
      case 'ALL':
        data = data.filter(s => s.status !== ShipmentStatus.DELIVERED);
        break;
      case 'TRANSIT':
        data = data.filter(s => s.status === ShipmentStatus.OPENED || s.status === ShipmentStatus.PRE_CLEARANCE);
        break;
      case 'CUSTOMS':
        data = data.filter(s => s.status === ShipmentStatus.CUSTOMS_LIQUIDATION || s.status === ShipmentStatus.LIQUIDATION_PAID);
        break;
      case 'ALERTS':
        data = data.filter(s => s.alerts.length > 0);
        break;
      case 'ATTENTION':
        // Tab logic: Alerts or Customs actions needed
        data = data.filter(s => s.alerts.length > 0 || s.status === ShipmentStatus.CUSTOMS_LIQUIDATION);
        break;
      case 'COMPLETED':
        data = data.filter(s => s.status === ShipmentStatus.DELIVERED);
        break;
    }

    // Search Filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(s => 
        s.trackingNumber.toLowerCase().includes(q) || 
        s.clientName.toLowerCase().includes(q) ||
        s.blNumber.toLowerCase().includes(q)
      );
    }
    return data;
  }, [shipments, searchQuery, filterMode]);

  const canCreate = role === Role.DIRECTOR || role === Role.CREATION_AGENT;

  // --- UI HELPERS ---
  const StatusBadge = ({ status, alerts }: { status: ShipmentStatus, alerts: string[] }) => {
    if (alerts.length > 0) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-100">
          <AlertCircle size={12} /> Bloqué
        </span>
      );
    }
    
    switch (status) {
      case ShipmentStatus.OPENED:
      case ShipmentStatus.PRE_CLEARANCE:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200"><Clock size={12}/> En Transit</span>;
      case ShipmentStatus.CUSTOMS_LIQUIDATION:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-100"><Anchor size={12}/> Douane</span>;
      case ShipmentStatus.LIQUIDATION_PAID:
      case ShipmentStatus.BAE_GRANTED:
      case ShipmentStatus.PORT_EXIT:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100"><Truck size={12}/> Logistique</span>;
      case ShipmentStatus.DELIVERED:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-50 text-gray-500 border border-gray-200"><CheckCircle2 size={12}/> Terminé</span>;
      default:
        return null;
    }
  };

  const KPICard = ({ 
    title, count, label, color, mode, activeMode, icon: Icon 
  }: { 
    title: string, count: number, label: string, color: string, mode: FilterMode, activeMode: FilterMode, icon?: any 
  }) => {
    const isActive = activeMode === mode;
    const baseClasses = "p-5 rounded-xl border transition-all cursor-pointer relative overflow-hidden text-left w-full";
    const activeClasses = isActive ? "ring-2 ring-slate-900 border-slate-900 bg-slate-50 shadow-md" : "bg-white border-slate-200 shadow-subtle hover:border-slate-300 hover:shadow-md";
    
    // Color mapping
    const textColors: Record<string, string> = {
      'slate': 'text-slate-900',
      'blue': 'text-blue-600',
      'red': 'text-red-600',
    };

    return (
      <button 
        onClick={() => setFilterMode(mode)}
        className={`${baseClasses} ${activeClasses}`}
      >
        <p className={`${color === 'red' ? 'text-red-500' : 'text-slate-500'} text-xs font-semibold uppercase tracking-wider mb-2 flex justify-between items-center`}>
           {title}
           {isActive && <CheckCircle2 size={14} className="text-slate-900" />}
        </p>
        <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-bold ${textColors[color]}`}>{count}</span>
            <span className={`text-xs font-medium ${color === 'red' ? 'text-red-400' : 'text-slate-400'}`}>{label}</span>
        </div>
        {color === 'blue' && <div className="absolute right-0 top-0 h-full w-1 bg-blue-600 opacity-20"></div>}
        {color === 'red' && count > 0 && <div className="absolute right-4 top-4 w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>}
      </button>
    );
  };

  return (
    <div className="max-w-6xl mx-auto pb-24 animate-in fade-in duration-500">
      
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pt-4">
        <div>
           <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Vue d'ensemble</h1>
           <p className="text-slate-500 text-sm mt-1">Gérez vos opérations de transit en temps réel.</p>
        </div>
        <div className="flex gap-3">
           <div className="relative">
             <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
             <input 
               type="text" 
               placeholder="Rechercher un dossier..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-slate-400 transition-all w-full md:w-64 shadow-sm"
             />
           </div>
           {canCreate && (
             <button 
               onClick={onCreateShipment}
               className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm flex items-center gap-2 transition-all active:scale-95"
             >
               <Plus size={16} /> <span className="hidden md:inline">Nouveau Dossier</span>
             </button>
           )}
        </div>
      </div>

      {/* 2. INTERACTIVE KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
         <KPICard 
           title="Total Actifs" 
           count={stats.total} 
           label="dossiers" 
           color="slate" 
           mode="ALL" 
           activeMode={filterMode} 
         />
         <KPICard 
           title="En Transit" 
           count={stats.transit} 
           label="navire / quai" 
           color="slate" 
           mode="TRANSIT" 
           activeMode={filterMode} 
         />
         <KPICard 
           title="Douane" 
           count={stats.customs} 
           label="en cours" 
           color="blue" 
           mode="CUSTOMS" 
           activeMode={filterMode} 
         />
         <KPICard 
           title="Alertes" 
           count={stats.blocked} 
           label="bloqués" 
           color="red" 
           mode="ALERTS" 
           activeMode={filterMode} 
         />
      </div>

      {/* 3. TABS NAVIGATION */}
      <div className="flex items-center gap-6 border-b border-slate-200 mb-6 overflow-x-auto">
         <button 
           onClick={() => setFilterMode('ALL')}
           className={`pb-3 text-sm font-medium transition-all relative whitespace-nowrap ${filterMode === 'ALL' || filterMode === 'TRANSIT' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
         >
           Tous les dossiers
           {(filterMode === 'ALL' || filterMode === 'TRANSIT') && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 rounded-t-full"></div>}
         </button>
         <button 
           onClick={() => setFilterMode('ATTENTION')}
           className={`pb-3 text-sm font-medium transition-all relative whitespace-nowrap ${(filterMode === 'ATTENTION' || filterMode === 'ALERTS' || filterMode === 'CUSTOMS') ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
         >
           À traiter
           {(filterMode === 'ATTENTION' || filterMode === 'ALERTS' || filterMode === 'CUSTOMS') && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 rounded-t-full"></div>}
         </button>
         <button 
           onClick={() => setFilterMode('COMPLETED')}
           className={`pb-3 text-sm font-medium transition-all relative whitespace-nowrap ${filterMode === 'COMPLETED' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
         >
           Historique
           {filterMode === 'COMPLETED' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 rounded-t-full"></div>}
         </button>
      </div>

      {/* 4. SHIPMENT LIST (Data Grid Style) */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-subtle overflow-hidden min-h-[300px]">
        {filteredShipments.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
               <Filter size={20} />
            </div>
            <p className="text-slate-900 font-medium">Aucun résultat trouvé</p>
            <p className="text-slate-500 text-sm">
               {filterMode === 'ALERTS' ? "Aucune alerte en cours. Tout va bien !" : "Modifiez vos filtres ou créez un nouveau dossier."}
            </p>
            {filterMode !== 'ALL' && (
               <button onClick={() => setFilterMode('ALL')} className="mt-4 text-xs font-bold text-blue-600 hover:underline">
                  Voir tous les dossiers
               </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
             {/* Header Row (Hidden on mobile) */}
             <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-slate-50/50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <div className="col-span-4">Dossier / Client</div>
                <div className="col-span-3">Détails</div>
                <div className="col-span-3">Statut</div>
                <div className="col-span-2 text-right">Action</div>
             </div>

             {/* Rows */}
             {filteredShipments.map((shipment) => (
                <div 
                  key={shipment.id}
                  onClick={() => onViewShipment(shipment.id)}
                  className="group md:grid md:grid-cols-12 gap-4 p-4 items-center hover:bg-slate-50 transition-colors cursor-pointer"
                >
                   {/* Col 1: ID & Client */}
                   <div className="col-span-4 mb-2 md:mb-0">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0">
                            <Package size={18} strokeWidth={1.5} />
                         </div>
                         <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                               {shipment.trackingNumber}
                            </p>
                            <p className="text-xs text-slate-500 font-medium truncate">{shipment.clientName}</p>
                         </div>
                      </div>
                   </div>

                   {/* Col 2: Metadata */}
                   <div className="col-span-3 mb-2 md:mb-0">
                      <p className="text-xs text-slate-700 font-medium flex items-center gap-1.5">
                         <span className="text-slate-400">BL:</span> {shipment.blNumber}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate pr-4">
                         {shipment.description}
                      </p>
                   </div>

                   {/* Col 3: Status */}
                   <div className="col-span-3 mb-2 md:mb-0">
                      <StatusBadge status={shipment.status} alerts={shipment.alerts} />
                      <p className="text-[10px] text-slate-400 mt-1.5 pl-1">
                         Maj: {new Date().toLocaleDateString()}
                      </p>
                   </div>

                   {/* Col 4: Action */}
                   <div className="col-span-2 flex justify-end">
                      <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-lg transition-all">
                         <ArrowRight size={18} />
                      </button>
                   </div>
                </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
};
