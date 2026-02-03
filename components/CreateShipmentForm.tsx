
import React, { useState } from 'react';
import { CommodityType, Shipment, ShipmentStatus } from '../types';
import { Package, MapPin, Calendar, User, Save, X, Truck, Anchor, FileText, Settings, AlertCircle } from 'lucide-react';
import { CreateShipmentSchema, CreateShipmentInput } from '../utils/validation';
import { logger } from '../services/logger';

interface Props {
  onSubmit: (shipment: Shipment) => void;
  onCancel: () => void;
}

export const CreateShipmentForm: React.FC<Props> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<CreateShipmentInput>({
    clientName: '',
    commodityType: CommodityType.CONTAINER,
    description: '',
    origin: '',
    destination: 'Conakry, GN',
    eta: '',
    blNumber: '',
    shippingLine: 'Maersk',
    containerNumber: '',
    customsRegime: 'IM4'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    // Clear error when user types
    if (errors[e.target.name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[e.target.name];
        return newErrors;
      });
    }
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Validation Zod (Gardien)
    const result = CreateShipmentSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      // ZodError issues property contains the list of validation errors
      result.error.issues.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(fieldErrors);
      logger.warn('Tentative création dossier échouée (Validation)', fieldErrors);
      return;
    }

    // 2. Traitement si valide
    logger.audit('CREATION_DOSSIER_INIT', { client: formData.clientName, bl: formData.blNumber });
    
    // Auto-generate realistic tracking number based on regime
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const trackingNumber = `${formData.customsRegime}-${randomNum}-GN`;

    const newShipment: Shipment = {
      id: Date.now().toString(),
      trackingNumber,
      clientName: formData.clientName,
      commodityType: formData.commodityType,
      description: formData.description,
      origin: formData.origin,
      destination: formData.destination,
      status: ShipmentStatus.OPENED,
      eta: formData.eta,
      freeDays: 7, // Default
      documents: [],
      expenses: [],
      alerts: [],
      blNumber: formData.blNumber.toUpperCase(),
      shippingLine: formData.shippingLine,
      containerNumber: formData.containerNumber ? formData.containerNumber.toUpperCase() : undefined,
      customsRegime: formData.customsRegime
    };

    onSubmit(newShipment);
  };

  return (
    <div className="bg-white min-h-full p-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Ouverture Dossier</h2>
          <p className="text-sm text-slate-500">Enregistrement technique sécurisé (Validation Zod)</p>
        </div>
        <button onClick={onCancel} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:bg-slate-100 transition-colors">
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl mx-auto pb-10">
        
        {/* Error Summary if any */}
        {Object.keys(errors).length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
             <AlertCircle className="text-red-500 mt-0.5" size={18} />
             <div>
               <h4 className="text-sm font-bold text-red-800">Erreurs de validation</h4>
               <ul className="list-disc list-inside text-xs text-red-600 mt-1">
                 {Object.values(errors).map((err, i) => <li key={i}>{err}</li>)}
               </ul>
             </div>
          </div>
        )}

        {/* Section 1: Client & Régime */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <User size={14} /> Identification
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Client / Importateur</label>
                <input
                  name="clientName"
                  value={formData.clientName}
                  onChange={handleChange}
                  className={`w-full p-3 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm font-semibold ${errors.clientName ? 'border-red-300 ring-1 ring-red-200' : 'border-slate-200'}`}
                  placeholder="Société ou Particulier"
                />
                {errors.clientName && <span className="text-[10px] text-red-500 font-bold">{errors.clientName}</span>}
             </div>
             <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Régime Douanier</label>
                <select
                  name="customsRegime"
                  value={formData.customsRegime}
                  onChange={handleChange}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm font-semibold"
                >
                  <option value="IM4">IM4 - Consommation</option>
                  <option value="IT">IT - Transit</option>
                  <option value="AT">AT - Adm. Temporaire</option>
                  <option value="Export">Export</option>
                </select>
             </div>
          </div>
        </div>

        {/* Section 2: Détails Maritimes */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Anchor size={14} /> Transport Maritime
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">N° Connaissement (BL)</label>
              <div className="relative">
                <FileText className="absolute left-3 top-3.5 text-slate-400" size={16} />
                <input
                  name="blNumber"
                  value={formData.blNumber}
                  onChange={handleChange}
                  className={`w-full pl-10 p-3 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm font-mono font-bold uppercase placeholder:font-sans placeholder:font-normal ${errors.blNumber ? 'border-red-300' : 'border-slate-200'}`}
                  placeholder="Ex: MEDU1234567"
                />
              </div>
              {errors.blNumber && <span className="text-[10px] text-red-500 font-bold">{errors.blNumber}</span>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Compagnie Maritime</label>
              <select
                name="shippingLine"
                value={formData.shippingLine}
                onChange={handleChange}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm font-semibold"
              >
                <option value="Maersk">Maersk Line</option>
                <option value="CMA CGM">CMA CGM</option>
                <option value="MSC">MSC</option>
                <option value="Grimaldi">Grimaldi</option>
                <option value="Hapag-Lloyd">Hapag-Lloyd</option>
                <option value="Autre">Autre / Affrètement</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Marchandise & Logistique */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Package size={14} /> Marchandise & Traçage
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Type Conteneur / Colis</label>
                <select
                  name="commodityType"
                  value={formData.commodityType}
                  onChange={handleChange}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm font-semibold"
                >
                  {Object.values(CommodityType).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
             </div>
             <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">N° Conteneur / Châssis</label>
                <input
                  name="containerNumber"
                  value={formData.containerNumber || ''}
                  onChange={handleChange}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm font-mono font-bold uppercase placeholder:font-sans placeholder:font-normal"
                  placeholder="Ex: MSKU1234567"
                />
             </div>
             <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Description Marchandise</label>
                <input
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className={`w-full p-3 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm font-semibold ${errors.description ? 'border-red-300' : 'border-slate-200'}`}
                  placeholder="Ex: Pièces détachées, Huile moteur..."
                />
                {errors.description && <span className="text-[10px] text-red-500 font-bold">{errors.description}</span>}
             </div>
          </div>
        </div>

        {/* Section 4: Route */}
        <div className="space-y-4">
           <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <MapPin size={14} /> Itinéraire
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Port de Chargement (POL)</label>
                <input
                  name="origin"
                  value={formData.origin}
                  onChange={handleChange}
                  className={`w-full p-3 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm font-semibold ${errors.origin ? 'border-red-300' : 'border-slate-200'}`}
                  placeholder="Ex: Anvers, Dubai"
                />
                {errors.origin && <span className="text-[10px] text-red-500 font-bold">{errors.origin}</span>}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">ETA Conakry (POD)</label>
                <input
                  type="date"
                  name="eta"
                  value={formData.eta}
                  onChange={handleChange}
                  className={`w-full p-3 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm font-semibold ${errors.eta ? 'border-red-300' : 'border-slate-200'}`}
                />
                {errors.eta && <span className="text-[10px] text-red-500 font-bold">{errors.eta}</span>}
              </div>
           </div>
        </div>

        <div className="pt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="flex-[2] py-3.5 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20"
          >
            <Save size={18} /> Enregistrer Dossier
          </button>
        </div>

      </form>
    </div>
  );
};
