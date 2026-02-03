
import React, { useContext, useState, useMemo } from 'react';
import { TransitContext } from '../App';
import { Role } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown, Calendar, Wallet, PieChart, ArrowUpRight, ArrowDownRight, Filter, Download } from 'lucide-react';

export const AccountingView: React.FC = () => {
  const { shipments } = useContext(TransitContext);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('month');

  // 1. Flatten all expenses from all shipments into a single transaction ledger
  const allTransactions = useMemo(() => {
    return shipments.flatMap(s => 
      s.expenses.map(e => ({
        ...e,
        shipmentRef: s.trackingNumber,
        client: s.clientName,
        dateObj: new Date(e.date)
      }))
    ).sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
  }, [shipments]);

  // 2. Filter transactions based on selected Time Range
  const filteredData = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Helper to get start of week (Monday)
    const getStartOfWeek = (d: Date) => {
      const date = new Date(d);
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      return new Date(date.setDate(diff));
    };

    let startDate: Date;

    switch (timeRange) {
      case 'day':
        startDate = startOfDay;
        break;
      case 'week':
        startDate = getStartOfWeek(now);
        startDate.setHours(0,0,0,0);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(0);
    }

    return allTransactions.filter(t => t.dateObj >= startDate && t.dateObj <= now);
  }, [allTransactions, timeRange]);

  // 3. Calculate Totals
  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    
    filteredData.forEach(t => {
      if (t.type === 'PROVISION' && t.paid) income += t.amount;
      if ((t.type === 'DISBURSEMENT' || t.type === 'FEE') && t.paid) expense += t.amount;
    });

    return { income, expense, balance: income - expense };
  }, [filteredData]);

  // 4. Prepare Chart Data
  const chartData = useMemo(() => {
    // Group by date/period
    const groups: Record<string, { name: string, in: number, out: number }> = {};
    
    filteredData.forEach(t => {
        let key = '';
        if (timeRange === 'day') key = t.dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        else if (timeRange === 'year') key = t.dateObj.toLocaleDateString('fr-FR', { month: 'short' });
        else key = t.dateObj.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });

        if (!groups[key]) groups[key] = { name: key, in: 0, out: 0 };
        
        if (t.type === 'PROVISION' && t.paid) groups[key].in += t.amount;
        if ((t.type === 'DISBURSEMENT' || t.type === 'FEE') && t.paid) groups[key].out += t.amount;
    });

    // Sort chronologically if needed, here simple object values might be unordered
    // Ideally we sort keys based on time. For simplicity in mock:
    return Object.values(groups).reverse(); 
  }, [filteredData, timeRange]);

  const formatGNF = (val: number) => new Intl.NumberFormat('fr-GN', { style: 'currency', currency: 'GNF', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="p-5 max-w-5xl mx-auto space-y-6 animate-in fade-in pb-24">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-slate-200 pb-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
             <PieChart className="text-blue-600" /> Bilan Financier
           </h2>
           <p className="text-slate-500 text-sm">Supervision de la trésorerie et des flux.</p>
        </div>
        
        {/* Time Filters */}
        <div className="bg-white p-1 rounded-xl border border-slate-200 flex shadow-sm">
           {['day', 'week', 'month', 'year'].map((range) => (
             <button
               key={range}
               onClick={() => setTimeRange(range as any)}
               className={`px-4 py-2 text-xs font-bold uppercase rounded-lg transition-all ${timeRange === range ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
             >
               {range === 'day' ? 'Jour' : range === 'week' ? 'Hebdo' : range === 'month' ? 'Mois' : 'Annuel'}
             </button>
           ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         {/* Income */}
         <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <TrendingUp size={48} className="text-emerald-600" />
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Entrées (Provisions)</p>
            <h3 className="text-2xl font-bold text-slate-900">{formatGNF(totals.income)}</h3>
            <div className="mt-2 flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded">
               <ArrowUpRight size={14} className="mr-1" /> Encaissé
            </div>
         </div>

         {/* Expense */}
         <div className="bg-white p-5 rounded-2xl border border-red-100 shadow-sm relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <TrendingDown size={48} className="text-red-600" />
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Sorties (Débours)</p>
            <h3 className="text-2xl font-bold text-slate-900">{formatGNF(totals.expense)}</h3>
            <div className="mt-2 flex items-center text-xs font-medium text-red-600 bg-red-50 w-fit px-2 py-1 rounded">
               <ArrowDownRight size={14} className="mr-1" /> Décaissé
            </div>
         </div>

         {/* Balance */}
         <div className="bg-slate-900 p-5 rounded-2xl text-white shadow-lg shadow-slate-900/20 relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500 rounded-full blur-2xl opacity-20"></div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Bilan Net (Trésorerie)</p>
            <h3 className={`text-3xl font-bold tracking-tight ${totals.balance < 0 ? 'text-red-300' : 'text-emerald-300'}`}>
               {totals.balance > 0 ? '+' : ''}{formatGNF(totals.balance)}
            </h3>
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
               <Wallet size={12} /> Solde période sélectionnée
            </p>
         </div>
      </div>

      {/* Charts */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm h-80">
         <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800 text-sm">Évolution Financière</h3>
            <button className="text-xs flex items-center gap-1 text-slate-500 hover:text-blue-600">
               <Download size={14} /> Export Rapport
            </button>
         </div>
         <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
               <defs>
                  <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                     <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                     <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
               </defs>
               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
               <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} dy={10} />
               <YAxis hide />
               <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}}
                  formatter={(value: number) => formatGNF(value)}
               />
               <Area type="monotone" dataKey="in" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorIn)" name="Entrées" />
               <Area type="monotone" dataKey="out" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorOut)" name="Sorties" />
            </AreaChart>
         </ResponsiveContainer>
      </div>

      {/* Transaction Ledger */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
         <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
               <Filter size={16} /> Journal des Opérations
            </h3>
            <span className="text-xs font-bold text-slate-400">{filteredData.length} écritures</span>
         </div>
         <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {filteredData.length === 0 ? (
               <div className="p-8 text-center text-slate-400 text-sm">Aucune opération sur cette période.</div>
            ) : (
               filteredData.map((t, idx) => (
                  <div key={`${t.id}-${idx}`} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                     <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === 'PROVISION' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                           {t.type === 'PROVISION' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                        </div>
                        <div>
                           <p className="font-bold text-slate-800 text-sm">{t.description}</p>
                           <p className="text-xs text-slate-400 mt-0.5">
                              {t.dateObj.toLocaleDateString()} • {t.shipmentRef} • <span className="uppercase font-semibold">{t.category}</span>
                           </p>
                        </div>
                     </div>
                     <div className="text-right">
                        <span className={`block font-bold text-sm ${t.type === 'PROVISION' ? 'text-emerald-600' : 'text-slate-900'}`}>
                           {t.type === 'PROVISION' ? '+' : '-'}{formatGNF(t.amount)}
                        </span>
                        {t.client && <span className="text-[10px] text-slate-400 font-medium truncate max-w-[100px] block">{t.client}</span>}
                     </div>
                  </div>
               ))
            )}
         </div>
      </div>
    </div>
  );
};
