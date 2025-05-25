import { useState, useEffect } from 'react';
import QRCode from 'qrcode';

const QrAdmin = () => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [qrType, setQrType] = useState<'entree' | 'sortie'>('entree');
  const [currentDate, setCurrentDate] = useState<string>('');
  
  // Fonction pour déterminer si c'est l'heure de sortie
  const isExitTime = () => {
    const now = new Date();
    const day = now.getDay(); // 0 = dimanche, 1 = lundi, ..., 5 = vendredi
    const hours = now.getHours();
    const minutes = now.getMinutes();
    
    // Vendredi (jour 5) après 15h00
    if (day === 5 && (hours > 15 || (hours === 15 && minutes >= 0))) {
      return true;
    }
    
    // Lundi à jeudi (jours 1-4) après 16h30
    if (day >= 1 && day <= 4 && (hours > 16 || (hours === 16 && minutes >= 30))) {
      return true;
    }
    
    return false;
  };
  
  // Fonction pour générer le QR code
  const generateQRCode = () => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0]; // Format YYYY-MM-DD
    setCurrentDate(dateStr);
    
    // Déterminer le type de QR code (entrée ou sortie)
    const type = isExitTime() ? 'sortie' : 'entree';
    setQrType(type);
    
    // Générer l'URL pour le QR code
    const qrUrl = `${window.location.origin}/pointage?token=QR-${dateStr}&type=${type}`;
    
    // Générer l'image du QR code
    QRCode.toDataURL(qrUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#003366', // Couleur des points du QR code
        light: '#ffffff' // Couleur de fond
      }
    })
    .then(url => {
      setQrCodeUrl(url);
    })
    .catch(err => {
      console.error('Erreur lors de la génération du QR code:', err);
    });
  };
  
  // Générer le QR code au chargement et toutes les minutes
  useEffect(() => {
    generateQRCode();
    
    // Mettre à jour le QR code toutes les minutes pour vérifier si l'heure de sortie est atteinte
    const interval = setInterval(() => {
      generateQRCode();
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
        <div className="flex justify-center mb-6">
          <img 
            src="/images/Logo_Noisy_Sec.svg" 
            alt="Logo Mairie de Noisy-le-Sec" 
            className="h-24"
          />
        </div>
        
        <h1 className="text-2xl font-bold text-center text-blue-800 mb-2">
          Mairie de Noisy-le-Sec
        </h1>
        
        <h2 className="text-xl font-semibold text-center text-blue-600 mb-6">
          Système de Pointage - {qrType === 'entree' ? 'ENTRÉE' : 'SORTIE'}
        </h2>
        
        <div className="flex justify-center mb-6">
          {qrCodeUrl && (
            <div className="border-4 border-blue-800 p-2 rounded-lg">
              <img src={qrCodeUrl} alt="QR Code de pointage" />
            </div>
          )}
        </div>
        
        <div className="text-center mb-4">
          <p className="text-lg font-medium text-gray-700">
            Date: <span className="font-bold">{currentDate}</span>
          </p>
          <p className="text-lg font-medium text-gray-700">
            Type: <span className="font-bold text-blue-700">{qrType === 'entree' ? 'Entrée' : 'Sortie'}</span>
          </p>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-700 mb-2">
            <strong>Instructions:</strong>
          </p>
          <p className="text-sm text-gray-600 mb-1">
            1. Scannez ce QR code avec votre téléphone pour enregistrer votre {qrType}.
          </p>
          <p className="text-sm text-gray-600 mb-1">
            2. Le QR code change automatiquement:
          </p>
          <p className="text-sm text-gray-600 ml-4 mb-1">
            • QR de sortie à 16h30 (lundi au jeudi)
          </p>
          <p className="text-sm text-gray-600 ml-4">
            • QR de sortie à 15h00 (vendredi)
          </p>
        </div>
      </div>
      
      <div className="mt-6 text-center">
        <a href="/" className="text-blue-600 hover:text-blue-800">
          Retour à l'accueil
        </a>
      </div>
      
      <div className="mt-6 text-sm text-gray-500">
        © {new Date().getFullYear()} - Ville de Noisy-le-Sec - Tous droits réservés
      </div>
    </div>
  );
};

export default QrAdmin;
