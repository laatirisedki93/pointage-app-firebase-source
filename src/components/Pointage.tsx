import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

interface PointageData {
  ip: string;
  codePersonnel: string; // Ajout du code personnel
  nomAgent: string;      // Ajout du nom de l'agent
  latitude: number | null;
  longitude: number | null;
  address: string;
  timestamp: string;
  type: 'entree' | 'sortie';
  token: string;
}

const Pointage = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(false);
  const [pointageData, setPointageData] = useState<PointageData | null>(null);
  const [codePersonnel, setCodePersonnel] = useState('');
  const [showCodeForm, setShowCodeForm] = useState(true);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [agentInfo, setAgentInfo] = useState<{ nom: string } | null>(null);
  
  // Récupérer les paramètres du QR code
  const token = searchParams.get('token');
  const type = searchParams.get('type') as 'entree' | 'sortie';
  
  // Empêcher la navigation arrière
  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
    };
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Validation du code personnel (4 chiffres)
  const isValidCode = (code: string) => {
    return /^\d{4}$/.test(code);
  };

  // Vérification du code personnel dans la base de données
  const verifyCodePersonnel = async (code: string) => {
    try {
      // Vérifier si le code existe dans la collection agents
      const agentsRef = collection(db, 'agents');
      const q = query(agentsRef, where('codePersonnel', '==', code));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setCodeError('Code personnel invalide. Veuillez réessayer.');
        return false;
      }
      
      // Récupérer les informations de l'agent
      const agentData = querySnapshot.docs[0].data();
      setAgentInfo({ nom: agentData.nom });
      return true;
    } catch (error) {
      console.error('Erreur lors de la vérification du code:', error);
      setCodeError('Erreur lors de la vérification du code. Veuillez réessayer.');
      return false;
    }
  };

  // Gestion de la soumission du code personnel
  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCodeError(null);
    
    // Vérifier le format du code
    if (!isValidCode(codePersonnel)) {
      setCodeError('Le code personnel doit contenir 4 chiffres.');
      return;
    }
    
    // Vérifier le code dans la base de données
    const isValid = await verifyCodePersonnel(codePersonnel);
    
    if (isValid) {
      setShowCodeForm(false);
      processPointage();
    }
  };
  
  const processPointage = async () => {
    try {
      setLoading(true);
      
      // Vérifier si les paramètres sont valides
      if (!token || !type || (type !== 'entree' && type !== 'sortie')) {
        throw new Error('Paramètres de pointage invalides');
      }
      
      // Vérifier si le token correspond au format attendu (QR-YYYY-MM-DD)
      const tokenRegex = /^QR-\d{4}-\d{2}-\d{2}$/;
      if (!tokenRegex.test(token)) {
        throw new Error('Format de token invalide');
      }
      
      // Récupérer l'IP publique
      const ipResponse = await axios.get('https://api.ipify.org?format=json');
      const ip = ipResponse.data.ip;
      
      // Extraire la date du token
      const tokenDate = token.substring(3); // Enlever "QR-"
      
      // Vérifier si l'agent a déjà pointé aujourd'hui pour ce type (avec son code personnel)
      const pointagesRef = collection(db, 'pointages');
      const q = query(
        pointagesRef, 
        where('codePersonnel', '==', codePersonnel),
        where('date', '==', tokenDate),
        where('type', '==', type)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // L'agent a déjà pointé aujourd'hui pour ce type
        setAlreadyCheckedIn(true);
        setPointageData(querySnapshot.docs[0].data() as PointageData);
        setLoading(false);
        return;
      }
      
      // Récupérer la position GPS (si disponible)
      let latitude: number | null = null;
      let longitude: number | null = null;
      let address = 'Adresse non disponible';
      
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000, // Augmentation du délai à 10 secondes
            maximumAge: 0
          });
        });
        
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
        
        // Géocodage inverse pour obtenir l'adresse
        if (latitude && longitude) {
          const geocodeResponse = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          
          if (geocodeResponse.data && geocodeResponse.data.display_name) {
            address = geocodeResponse.data.display_name;
          }
        }
      } catch (geoError) {
        console.error('Erreur de géolocalisation:', geoError);
        // Continuer sans géolocalisation
      }
      
      // Créer l'objet de données de pointage
      const newPointageData: PointageData = {
        ip,
        codePersonnel,
        nomAgent: agentInfo?.nom || 'Agent inconnu',
        latitude,
        longitude,
        address,
        timestamp: new Date().toISOString(),
        type,
        token
      };
      
      // Enregistrer le pointage dans Firestore
      await addDoc(collection(db, 'pointages'), {
        ...newPointageData,
        date: tokenDate, // Ajouter la date extraite du token pour faciliter les requêtes
        createdAt: new Date().toISOString()
      });
      
      // Mettre à jour l'état
      setPointageData(newPointageData);
      setSuccess(true);
      
    } catch (err) {
      console.error('Erreur lors du pointage:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };
  
  // Formater la date et l'heure pour l'affichage
  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
        <div className="flex justify-center mb-6">
          <img 
            src="/images/Logo_Noisy_Sec.svg" 
            alt="Logo Mairie de Noisy-le-Sec" 
            className="h-20"
          />
        </div>
        
        <h1 className="text-2xl font-bold text-center text-blue-800 mb-6">
          Système de Pointage
        </h1>
        
        {/* Formulaire de saisie du code personnel */}
        {showCodeForm && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-blue-700 mb-4 text-center">
              Veuillez saisir votre code personnel
            </h2>
            
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <div>
                <label htmlFor="codePersonnel" className="block text-sm font-medium text-gray-700 mb-1">
                  Code personnel (4 chiffres)
                </label>
                <input
                  type="text"
                  id="codePersonnel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={codePersonnel}
                  onChange={(e) => setCodePersonnel(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl tracking-widest"
                  placeholder="0000"
                  required
                />
                {codeError && (
                  <p className="mt-2 text-sm text-red-600">{codeError}</p>
                )}
              </div>
              
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Valider
              </button>
            </form>
          </div>
        )}
        
        {loading && !showCodeForm && (
          <div className="text-center p-4">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-2 text-gray-600">Traitement en cours...</p>
          </div>
        )}
        
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
            <p className="font-bold">Erreur</p>
            <p>{error}</p>
          </div>
        )}
        
        {!loading && !error && alreadyCheckedIn && pointageData && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
            <p className="font-bold">Pointage déjà effectué</p>
            <p>Vous avez déjà enregistré votre {pointageData.type === 'entree' ? 'entrée' : 'sortie'} aujourd'hui à {formatDateTime(pointageData.timestamp)}.</p>
          </div>
        )}
        
        {!loading && !error && success && pointageData && !alreadyCheckedIn && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4">
            <p className="font-bold">Pointage réussi !</p>
            <p>Votre {pointageData.type === 'entree' ? 'entrée' : 'sortie'} a été enregistrée avec succès.</p>
          </div>
        )}
        
        {!loading && !error && pointageData && (
          <div className="mt-4">
            <h2 className="text-lg font-semibold text-blue-700 mb-2">Détails du pointage :</h2>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-700 mb-2">
                <span className="font-semibold">Agent :</span> {pointageData.nomAgent}
              </p>
              <p className="text-sm text-gray-700 mb-2">
                <span className="font-semibold">Date et heure :</span> {formatDateTime(pointageData.timestamp)}
              </p>
              <p className="text-sm text-gray-700 mb-2">
                <span className="font-semibold">Type :</span> {pointageData.type === 'entree' ? 'Entrée' : 'Sortie'}
              </p>
              <p className="text-sm text-gray-700 mb-2">
                <span className="font-semibold">Adresse IP :</span> {pointageData.ip}
              </p>
              {pointageData.latitude && pointageData.longitude && (
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-semibold">Coordonnées GPS :</span> {pointageData.latitude.toFixed(6)}, {pointageData.longitude.toFixed(6)}
                </p>
              )}
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Adresse :</span> {pointageData.address}
              </p>
            </div>
          </div>
        )}
        
        {/* Suppression des liens de navigation comme demandé */}
      </div>
      
      <div className="mt-6 text-sm text-gray-500">
        © {new Date().getFullYear()} - Ville de Noisy-le-Sec - Tous droits réservés
      </div>
    </div>
  );
};

export default Pointage;
