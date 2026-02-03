
import { z } from 'zod';
import { CommodityType, ShipmentStatus } from '../types';

// Schéma strict pour la création d'un dossier
// Cela garantit que les données envoyées à la base de données PostgreSQL seront propres.
export const CreateShipmentSchema = z.object({
  clientName: z.string().min(3, "Le nom du client doit contenir au moins 3 caractères").max(100),
  commodityType: z.nativeEnum(CommodityType),
  description: z.string().min(5, "La description doit être détaillée (min 5 car.)"),
  origin: z.string().min(2, "L'origine est requise"),
  destination: z.string().default('Conakry, GN'),
  eta: z.string().refine((date) => new Date(date).toString() !== 'Invalid Date', { message: "Date ETA invalide" }),
  blNumber: z.string().min(5, "Numéro BL invalide").regex(/^[A-Z0-9]+$/, "Le BL ne doit contenir que des majuscules et chiffres"),
  shippingLine: z.string().min(2, "Compagnie maritime requise"),
  containerNumber: z.string().optional(), // Optionnel car peut être RORO/Vrac
  customsRegime: z.enum(['IM4', 'IT', 'AT', 'Export'])
});

// Schéma pour les transactions financières (Anti-erreur comptable)
export const ExpenseSchema = z.object({
  description: z.string().min(3, "Description requise"),
  amount: z.number().positive("Le montant doit être positif"),
  category: z.enum(['Douane', 'Port', 'Logistique', 'Agence', 'Autre']),
  type: z.enum(['PROVISION', 'DISBURSEMENT', 'FEE'])
});

// Type inféré pour utilisation dans les composants
export type CreateShipmentInput = z.infer<typeof CreateShipmentSchema>;
