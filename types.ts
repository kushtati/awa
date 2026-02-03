
export enum Role {
  DIRECTOR = 'DG / Admin',
  CREATION_AGENT = 'Chargé de Création',
  ACCOUNTANT = 'Comptable',
  FIELD_AGENT = 'Agent de Terrain',
  CLIENT = 'Client / Importateur'
}

export enum ShipmentStatus {
  OPENED = 'Ouverture Dossier',
  PRE_CLEARANCE = 'Pré-Dédouanement (DDI & BSC)', // Étape 1 stricte
  CUSTOMS_LIQUIDATION = 'Liquidation Douane',
  LIQUIDATION_PAID = 'Liquidation Payée', // Étape 4 : Paiement validé
  BAE_GRANTED = 'BAE Obtenu',
  PORT_EXIT = 'Sortie Port',
  DELIVERED = 'Livré / Archivé'
}

export enum CommodityType {
  VEHICLE = 'Véhicule',
  CONTAINER = 'Conteneur',
  FOOD = 'Denrées Alimentaires',
  ELECTRONICS = 'Électroménager',
  BULK = 'Vrac',
  GENERAL = 'Divers'
}

export type DocumentStatus = 'Pending' | 'Verified' | 'Rejected';

export interface Document {
  id: string;
  name: string;
  type: 'BL' | 'Facture' | 'Packing List' | 'Certificat' | 'DDI' | 'BSC' | 'Quittance' | 'BAE' | 'BAD' | 'Photo Camion' | 'Autre';
  status: DocumentStatus;
  uploadDate: string;
  url?: string;
}

export type ExpenseType = 'PROVISION' | 'DISBURSEMENT' | 'FEE';

export interface Expense {
  id: string;
  description: string;
  amount: number; // In GNF
  paid: boolean; // For disbursements: true if paid to supplier. For provisions: true if received from client.
  category: 'Douane' | 'Port' | 'Logistique' | 'Agence' | 'Autre';
  type: ExpenseType; // PROVISION (Avance), DISBURSEMENT (Débours), FEE (Honoraire)
  date: string; // ISO Date String for accounting ledger
}

export interface DeliveryInfo {
  driverName: string;
  truckPlate: string;
  deliveryDate: string;
  recipientName: string;
}

export interface Shipment {
  id: string;
  trackingNumber: string;
  clientName: string;
  commodityType: CommodityType;
  description: string;
  origin: string;
  destination: string;
  status: ShipmentStatus;
  eta: string;
  arrivalDate?: string; // Date of actual arrival at port
  freeDays: number; // Demurrage free days allowed
  documents: Document[];
  expenses: Expense[];
  alerts: string[];
  
  // New Technical Fields for Realism
  blNumber: string;
  shippingLine: string; // e.g., 'Maersk', 'CMA CGM'
  containerNumber?: string;
  customsRegime: 'IM4' | 'IT' | 'AT' | 'Export';
  declarationNumber?: string; // Sydonia Declaration Number
  
  // Delivery Tracking
  deliveryInfo?: DeliveryInfo;
}

export interface TransitContextType {
  role: Role;
  setRole: (role: Role) => void;
  isOffline: boolean;
  toggleOffline: () => void;
  shipments: Shipment[];
  addDocument: (shipmentId: string, doc: Document) => void;
  addExpense: (shipmentId: string, expense: Expense) => void;
  addShipment: (shipment: Shipment) => void;
  updateShipmentStatus: (shipmentId: string, newStatus: ShipmentStatus, deliveryInfo?: DeliveryInfo) => void;
  setArrivalDate: (shipmentId: string, date: string) => void;
  setDeclarationDetails: (shipmentId: string, number: string, amount: number) => void;
  payLiquidation: (shipmentId: string) => { success: boolean; message: string };
  updateShipmentDetails: (shipmentId: string, updates: Partial<Shipment>) => void;
}
