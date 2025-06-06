import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  where 
} from 'firebase/firestore';
import { db } from '../firebase/config';

interface PointageRecord {
  id?: string;
  ip: string;
  codePersonnel?: string; // Ajout du code personnel (optionnel pour compatibilité)
  nomAgent?: string;      // Ajout du nom de l'agent (optionnel pour compatibilité)
  latitude: number | null;
  longitude: number | null;
  address: string;
  timestamp: string;
  type: 'entree' | 'sortie';
  token: string;
  date: string;
}

interface AgentMapping {
  id?: string;
  ip: string;
  nom: string;
  codePersonnel: string; // Ajout du code personnel
  dateCreation: string;
}

const Admin = () => {
  const [pointageRecords, setPointageRecords] = useState<PointageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<AgentMapping[]>([]);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [newAgentIp, setNewAgentIp] = useState('');
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentCode, setNewAgentCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [editingAgent, setEditingAgent] = useState<AgentMapping | null>(null);
  const { logout, isAuthenticated, currentUser } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Vérifier l'authentification
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    // Récupérer les mappings d'agents depuis Firestore
    const fetchAgents = async () => {
      try {
        const agentsRef = collection(db, 'agents');
        const agentsSnapshot = await getDocs(agentsRef);
        const agentsList: AgentMapping[] = [];
        
        agentsSnapshot.forEach((doc) => {
          agentsList.push({
            id: doc.id,
            ...doc.data() as Omit<AgentMapping, 'id'>
          });
        });
        
        setAgents(agentsList);
      } catch (error) {
        console.error('Erreur lors de la récupération des agents:', error);
      }
    };
    
    // Récupérer toutes les entrées de pointage depuis Firestore
    const fetchPointageRecords = async () => {
      try {
        const pointagesRef = collection(db, 'pointages');
        const q = query(pointagesRef, orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const records: PointageRecord[] = [];
        querySnapshot.forEach((doc) => {
          records.push({
            id: doc.id,
            ...doc.data() as Omit<PointageRecord, 'id'>
          });
        });
        
        setPointageRecords(records);
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors de la récupération des pointages:', error);
        setLoading(false);
      }
    };
    
    fetchAgents();
    fetchPointageRecords();
    
    // Mettre à jour les données toutes les 30 secondes
    const interval = setInterval(() => {
      fetchPointageRecords();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated, navigate]);
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };
  
  const getAgentName = (ip: string, codePersonnel?: string) => {
    // Priorité au code personnel s'il existe
    if (codePersonnel) {
      const agentByCode = agents.find(a => a.codePersonnel === codePersonnel);
      if (agentByCode) return agentByCode.nom;
    }
    
    // Sinon, recherche par IP (pour compatibilité avec les anciens pointages)
    const agentByIp = agents.find(a => a.ip === ip);
    return agentByIp ? agentByIp.nom : ip;
  };

  // Génération d'un code personnel unique à 4 chiffres
  const generateUniqueCode = async () => {
    // Récupérer tous les codes existants
    const existingCodes = agents.map(agent => agent.codePersonnel);
    
    // Générer un nouveau code jusqu'à ce qu'il soit unique
    let newCode;
    do {
      // Générer un nombre aléatoire à 4 chiffres
      newCode = Math.floor(1000 + Math.random() * 9000).toString();
    } while (existingCodes.includes(newCode));
    
    return newCode;
  };

  // Vérification de l'unicité du code personnel
  const isCodeUnique = (code: string, excludeAgentId?: string) => {
    return !agents.some(agent => 
      agent.codePersonnel === code && agent.id !== excludeAgentId
    );
  };
  
  const handleAddAgent = async () => {
    if (!newAgentIp || !newAgentName) return;
    
    // Validation du code personnel
    if (!newAgentCode) {
      setCodeError('Le code personnel est requis.');
      return;
    }
    
    if (!/^\d{4}$/.test(newAgentCode)) {
      setCodeError('Le code personnel doit contenir exactement 4 chiffres.');
      return;
    }
    
    try {
      // Vérifier l'unicité du code (sauf pour l'agent en cours d'édition)
      if (!isCodeUnique(newAgentCode, editingAgent?.id)) {
        setCodeError('Ce code personnel est déjà utilisé par un autre agent.');
        return;
      }
      
      if (editingAgent && editingAgent.id) {
        // Mettre à jour l'agent existant
        const agentRef = doc(db, 'agents', editingAgent.id);
        await updateDoc(agentRef, {
          ip: newAgentIp,
          nom: newAgentName,
          codePersonnel: newAgentCode
        });
        
        // Mettre à jour l'état local
        setAgents(agents.map(agent => 
          agent.id === editingAgent.id 
            ? { ...agent, ip: newAgentIp, nom: newAgentName, codePersonnel: newAgentCode } 
            : agent
        ));
      } else {
        // Vérifier si l'IP existe déjà
        const agentsRef = collection(db, 'agents');
        const q = query(agentsRef, where('ip', '==', newAgentIp));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          // Mettre à jour l'agent existant
          const agentDoc = querySnapshot.docs[0];
          const agentRef = doc(db, 'agents', agentDoc.id);
          await updateDoc(agentRef, {
            nom: newAgentName,
            codePersonnel: newAgentCode
          });
          
          // Mettre à jour l'état local
          setAgents(agents.map(agent => 
            agent.id === agentDoc.id 
              ? { ...agent, nom: newAgentName, codePersonnel: newAgentCode } 
              : agent
          ));
        } else {
          // Ajouter un nouvel agent
          const docRef = await addDoc(collection(db, 'agents'), {
            ip: newAgentIp,
            nom: newAgentName,
            codePersonnel: newAgentCode,
            dateCreation: new Date().toISOString()
          });
          
          // Mettre à jour l'état local
          setAgents([...agents, { 
            id: docRef.id, 
            ip: newAgentIp, 
            nom: newAgentName,
            codePersonnel: newAgentCode,
            dateCreation: new Date().toISOString()
          }]);
        }
      }
      
      // Réinitialiser le formulaire
      setNewAgentIp('');
      setNewAgentName('');
      setNewAgentCode('');
      setCodeError(null);
      setEditingAgent(null);
      setShowAgentModal(false);
    } catch (error) {
      console.error('Erreur lors de l\'ajout/modification de l\'agent:', error);
    }
  };
  
  const handleEditAgent = (agent: AgentMapping) => {
    setEditingAgent(agent);
    setNewAgentIp(agent.ip);
    setNewAgentName(agent.nom);
    setNewAgentCode(agent.codePersonnel || '');
    setCodeError(null);
    setShowAgentModal(true);
  };
  
  const handleDeleteAgent = async (id: string | undefined) => {
    if (!id) return;
    
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet agent ?')) {
      try {
        // Supprimer l'agent de Firestore
        await deleteDoc(doc(db, 'agents', id));
        
        // Mettre à jour l'état local
        setAgents(agents.filter(a => a.id !== id));
      } catch (error) {
        console.error('Erreur lors de la suppression de l\'agent:', error);
      }
    }
  };

  const handleGenerateCode = async () => {
    try {
      const newCode = await generateUniqueCode();
      setNewAgentCode(newCode);
      setCodeError(null);
    } catch (error) {
      console.error('Erreur lors de la génération du code:', error);
    }
  };
  
  const exportToCSV = async () => {
    try {
      // Utiliser les utilitaires d'export optimisés pour Firebase
      const { exportAndDownloadPointages } = await import('../utils/exportUtils');
      await exportAndDownloadPointages();
    } catch (error) {
      console.error('Erreur lors de l\'export CSV:', error);
      alert('Une erreur est survenue lors de l\'export des données. Veuillez réessayer.');
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <img 
              src="/images/Logo_Noisy_Sec.svg" 
              alt="Logo Mairie de Noisy-le-Sec" 
              className="h-16 mr-4"
            />
            <h1 className="text-2xl font-bold text-blue-800">
              Administration du Système de Pointage
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            {currentUser && (
              <span className="text-gray-600">
                {currentUser.email}
              </span>
            )}
            <a href="/" className="text-blue-600 hover:text-blue-800">
              Accueil
            </a>
            <button 
              onClick={handleLogout}
              className="text-red-600 hover:text-red-800"
            >
              Déconnexion
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-blue-700">
              Gestion des Agents
            </h2>
            <button 
              onClick={() => {
                setEditingAgent(null);
                setNewAgentIp('');
                setNewAgentName('');
                setNewAgentCode('');
                setCodeError(null);
                setShowAgentModal(true);
              }}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Ajouter un agent
            </button>
          </div>
          
          {agents.length === 0 ? (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <p className="text-yellow-700">Aucun agent enregistré. Ajoutez des agents pour associer les adresses IP à des noms.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Nom de l'agent</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Code personnel</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Adresse IP</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {agents.map((agent, index) => (
                    <tr key={agent.id || index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="py-3 px-4 text-sm text-gray-700">{agent.nom}</td>
                      <td className="py-3 px-4 text-sm text-gray-700 font-mono">{agent.codePersonnel || '-'}</td>
                      <td className="py-3 px-4 text-sm text-gray-700">{agent.ip}</td>
                      <td className="py-3 px-4 text-sm">
                        <button 
                          onClick={() => handleEditAgent(agent)}
                          className="text-blue-600 hover:text-blue-800 mr-3"
                        >
                          Modifier
                        </button>
                        <button 
                          onClick={() => handleDeleteAgent(agent.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-blue-700">
              Tableau des Pointages
            </h2>
            <button 
              onClick={exportToCSV}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Exporter en CSV
            </button>
          </div>
          
          {loading ? (
            <div className="text-center p-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="mt-2 text-gray-600">Chargement des données...</p>
            </div>
          ) : pointageRecords.length === 0 ? (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <p className="text-yellow-700">Aucun pointage enregistré pour le moment.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-blue-100">
                  <tr>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-blue-800">Date</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-blue-800">Heure</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-blue-800">Type</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-blue-800">Agent</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-blue-800">Code</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-blue-800">IP</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-blue-800">Adresse</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pointageRecords.map((record, index) => {
                    const dateTime = new Date(record.timestamp);
                    const formattedDate = new Intl.DateTimeFormat('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    }).format(dateTime);
                    
                    const formattedTime = new Intl.DateTimeFormat('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    }).format(dateTime);
                    
                    return (
                      <tr key={record.id || index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="py-3 px-4 text-sm text-gray-700">{formattedDate}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{formattedTime}</td>
                        <td className="py-3 px-4 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            record.type === 'entree' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {record.type === 'entree' ? 'Entrée' : 'Sortie'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700 font-medium">
                          {record.nomAgent || getAgentName(record.ip, record.codePersonnel)}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700 font-mono">
                          {record.codePersonnel || '-'}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700">{record.ip}</td>
                        <td className="py-3 px-4 text-sm text-gray-700 truncate max-w-xs">
                          {record.address}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-blue-700 mb-4">
            Statistiques
          </h2>
          
          {loading ? (
            <div className="text-center p-4">
              <p className="text-gray-600">Chargement des statistiques...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <p className="text-sm text-gray-600">Total des pointages</p>
                <p className="text-2xl font-bold text-blue-800">{pointageRecords.length}</p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <p className="text-sm text-gray-600">Entrées</p>
                <p className="text-2xl font-bold text-green-800">
                  {pointageRecords.filter(r => r.type === 'entree').length}
                </p>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                <p className="text-sm text-gray-600">Sorties</p>
                <p className="text-2xl font-bold text-red-800">
                  {pointageRecords.filter(r => r.type === 'sortie').length}
                </p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                <p className="text-sm text-gray-600">Agents enregistrés</p>
                <p className="text-2xl font-bold text-purple-800">
                  {agents.length}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Modal d'ajout/modification d'agent */}
      {showAgentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-blue-700 mb-4">
              {editingAgent ? 'Modifier un agent' : 'Ajouter un agent'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="agentName" className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de l'agent
                </label>
                <input
                  type="text"
                  id="agentName"
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nom de l'agent"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="agentIp" className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse IP
                </label>
                <input
                  type="text"
                  id="agentIp"
                  value={newAgentIp}
                  onChange={(e) => setNewAgentIp(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="xxx.xxx.xxx.xxx"
                  required
                />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="agentCode" className="block text-sm font-medium text-gray-700">
                    Code personnel (4 chiffres)
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateCode}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Générer un code
                  </button>
                </div>
                <input
                  type="text"
                  id="agentCode"
                  value={newAgentCode}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d{0,4}$/.test(value)) {
                      setNewAgentCode(value);
                      setCodeError(null);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center font-mono text-lg tracking-widest"
                  placeholder="0000"
                  maxLength={4}
                  required
                />
                {codeError && (
                  <p className="mt-1 text-sm text-red-600">{codeError}</p>
                )}
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAgentModal(false);
                  setEditingAgent(null);
                  setNewAgentIp('');
                  setNewAgentName('');
                  setNewAgentCode('');
                  setCodeError(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleAddAgent}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {editingAgent ? 'Mettre à jour' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
