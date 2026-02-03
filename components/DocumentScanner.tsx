import React, { useState } from 'react';
import { Camera, Upload, CheckCircle, Loader2, FileText, AlertTriangle } from 'lucide-react';

interface DocumentScannerProps {
  onScanComplete: (analysis: any) => void;
  onClose: () => void;
}

export const DocumentScanner: React.FC<DocumentScannerProps> = ({ onScanComplete, onClose }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mockFile, setMockFile] = useState<File | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setMockFile(file);
      setIsAnalyzing(true);

      // Simulation: extraction de données de base du document
      // Dans une vraie application, utiliser un service sécurisé d'OCR/analyse
      
      const mockContent = `Document import pour ${file.name}. Conteneur 40 pieds, Riz importé de Thaïlande. Poids 25 tonnes. Arrivée prévue Conakry le 15.`;
      
      try {
        // Simulation de résultat d'analyse
        const result = {
          detectedType: 'Facture Commerciale',
          summary: 'Import de marchandises',
          potentialHsCodes: ['1006.30', '1006.40'],
          riskAnalysis: 'Documents complets'
        };
        onScanComplete(result);
      } catch (err) {
        console.error(err);
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
          <h3 className="font-semibold flex items-center gap-2">
            <Camera size={20} />
            Scanner Intelligent
          </h3>
          <button onClick={onClose} className="text-gray-300 hover:text-white">&times;</button>
        </div>

        <div className="p-6 text-center">
          {!isAnalyzing && !mockFile && (
            <div className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:bg-gray-50 transition-colors">
                <input 
                  type="file" 
                  id="doc-upload" 
                  className="hidden" 
                  onChange={handleFileUpload}
                  accept="image/*,.pdf"
                />
                <label htmlFor="doc-upload" className="cursor-pointer flex flex-col items-center gap-3">
                  <div className="bg-blue-100 p-4 rounded-full text-blue-600">
                    <Upload size={32} />
                  </div>
                  <span className="text-slate-600 font-medium">Télécharger une photo ou PDF</span>
                  <span className="text-xs text-gray-400">Factures, BL, Certificats</span>
                </label>
              </div>
              <p className="text-sm text-gray-500 bg-blue-50 p-3 rounded text-left flex gap-2">
                <FileText className="flex-shrink-0 text-blue-500" size={16} />
                Le système analysera automatiquement le document pour extraire les codes SH et détecter les anomalies.
              </p>
            </div>
          )}

          {isAnalyzing && (
            <div className="py-12 flex flex-col items-center">
              <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
              <p className="text-slate-700 font-medium">Analyse intelligente en cours...</p>
              <p className="text-xs text-gray-500 mt-2">Extraction des données clés</p>
            </div>
          )}

          {!isAnalyzing && mockFile && (
            <div className="py-8">
              <CheckCircle className="text-green-500 mx-auto mb-4" size={48} />
              <p className="font-semibold text-slate-800">Scan terminé !</p>
              <p className="text-sm text-gray-500 mb-6">{mockFile.name}</p>
              <button 
                onClick={onClose}
                className="bg-slate-900 text-white px-6 py-2 rounded-lg w-full font-medium"
              >
                Voir les résultats
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
