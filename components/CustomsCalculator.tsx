import React, { useState } from 'react';
import { Calculator, RefreshCcw, Info, CircleDollarSign } from 'lucide-react';

export const CustomsCalculator: React.FC = () => {
  const [valueFOB, setValueFOB] = useState<number>(0);
  const [freight, setFreight] = useState<number>(0);
  const [insurance, setInsurance] = useState<number>(0);
  
  const RATE_RTL = 0.02; 
  const RATE_RDL = 0.015; 
  const RATE_TVS = 0.18; 
  const RATE_DD = 0.20; 
  
  const valueCAF = valueFOB + freight + insurance;
  const rtl = valueCAF * RATE_RTL;
  const rdl = valueCAF * RATE_RDL;
  const dd = valueCAF * RATE_DD;
  const fiscalValue = valueCAF + dd + rtl + rdl;
  const tvs = fiscalValue * RATE_TVS;
  const totalDuties = rtl + rdl + dd + tvs;

  const formatGNF = (val: number) => new Intl.NumberFormat('fr-GN', { style: 'currency', currency: 'GNF', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
      <div className="bg-slate-900 p-8 text-white text-center relative overflow-hidden">
         <div className="relative z-10">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Total Estimé</p>
            <h2 className="text-4xl font-bold tracking-tight">{formatGNF(totalDuties)}</h2>
            <div className="mt-4 flex justify-center gap-4 text-xs font-medium text-slate-300">
               <span>CAF: {formatGNF(valueCAF)}</span>
            </div>
         </div>
         {/* Decorative circle */}
         <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-600 rounded-full blur-3xl opacity-20"></div>
      </div>

      <div className="p-6 space-y-6">
        <div className="space-y-4">
          {[
            { label: 'Valeur FOB', val: valueFOB, set: setValueFOB },
            { label: 'Fret', val: freight, set: setFreight },
            { label: 'Assurance', val: insurance, set: setInsurance }
          ].map((item, i) => (
             <div key={i}>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">{item.label}</label>
                <div className="relative">
                   <input 
                     type="number" 
                     value={item.val || ''} 
                     onChange={e => item.set(Number(e.target.value))}
                     className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold text-slate-900 placeholder:text-slate-300"
                     placeholder="0"
                   />
                   <span className="absolute right-4 top-4 text-xs font-bold text-slate-400">GNF</span>
                </div>
             </div>
          ))}
        </div>

        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
           <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Info size={14} className="text-blue-500" /> Détails Taxes
           </h4>
           <div className="space-y-2 text-sm">
             <div className="flex justify-between text-slate-500"><span>Douane (DD)</span> <span className="font-bold text-slate-700">{formatGNF(dd)}</span></div>
             <div className="flex justify-between text-slate-500"><span>RTL</span> <span className="font-bold text-slate-700">{formatGNF(rtl)}</span></div>
             <div className="flex justify-between text-slate-500"><span>RDL</span> <span className="font-bold text-slate-700">{formatGNF(rdl)}</span></div>
             <div className="flex justify-between text-slate-500"><span>TVS (TVA)</span> <span className="font-bold text-slate-700">{formatGNF(tvs)}</span></div>
           </div>
        </div>

        <button 
          onClick={() => {setValueFOB(0); setFreight(0); setInsurance(0);}}
          className="w-full py-4 rounded-xl text-slate-500 font-bold text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
        >
          <RefreshCcw size={16} /> Réinitialiser
        </button>
      </div>
    </div>
  );
};