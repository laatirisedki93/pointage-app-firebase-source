// Utilitaires pour l'export CSV des données de pointage
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';

// Interface pour les données de pointage
interface PointageRecord {
  id?: string;
  ip: string;
  latitude: number | null;
  longitude: number | null;
  address: string;
  timestamp: string;
  type: 'entree' | 'sortie';
  token: string;
  date: string;
}

// Interface pour les agents
interface AgentMapping {
  id?: string;
  ip: string;
  nom: string;
}

// Fonction pour récupérer tous les pointages
export const getAllPointages = async (): Promise<PointageRecord[]> => {
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
    
    return records;
  } catch (error) {
    console.error('Erreur lors de la récupération des pointages:', error);
    throw error;
  }
};

// Fonction pour récupérer tous les agents
export const getAllAgents = async (): Promise<AgentMapping[]> => {
  try {
    const agentsRef = collection(db, 'agents');
    const querySnapshot = await getDocs(agentsRef);
    
    const agents: AgentMapping[] = [];
    querySnapshot.forEach((doc) => {
      agents.push({
        id: doc.id,
        ...doc.data() as Omit<AgentMapping, 'id'>
      });
    });
    
    return agents;
  } catch (error) {
    console.error('Erreur lors de la récupération des agents:', error);
    throw error;
  }
};

// Fonction pour obtenir le nom d'un agent à partir de son IP
export const getAgentNameByIp = (agents: AgentMapping[], ip: string): string => {
  const agent = agents.find(a => a.ip === ip);
  return agent ? agent.nom : ip;
};

// Fonction pour exporter les données au format CSV
export const exportToCSV = (pointages: PointageRecord[], agents: AgentMapping[]): string => {
  // En-tête
  const csvRows = [];
  csvRows.push(['Date', 'Heure', 'Type', 'Agent', 'IP', 'Adresse', 'Coordonnées GPS'].join(','));
  
  // Données
  pointages.forEach(record => {
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
    
    const agentName = getAgentNameByIp(agents, record.ip);
    const type = record.type === 'entree' ? 'Entrée' : 'Sortie';
    const coords = record.latitude && record.longitude 
      ? `${record.latitude.toFixed(6)}, ${record.longitude.toFixed(6)}` 
      : 'Non disponible';
    
    // Échapper les virgules dans les champs texte
    const escapeCsv = (text: string) => `"${text.replace(/"/g, '""')}"`;
    
    csvRows.push([
      formattedDate,
      formattedTime,
      type,
      escapeCsv(agentName),
      record.ip,
      escapeCsv(record.address),
      coords
    ].join(','));
  });
  
  return csvRows.join('\n');
};

// Fonction pour télécharger le CSV
export const downloadCSV = (csvContent: string, filename: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Fonction pour exporter et télécharger les données de pointage
export const exportAndDownloadPointages = async (): Promise<void> => {
  try {
    const [pointages, agents] = await Promise.all([
      getAllPointages(),
      getAllAgents()
    ]);
    
    const csvContent = exportToCSV(pointages, agents);
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    downloadCSV(csvContent, `pointages_${dateStr}.csv`);
  } catch (error) {
    console.error('Erreur lors de l\'export des pointages:', error);
    throw error;
  }
};
