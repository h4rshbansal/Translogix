import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  limit,
  Firestore
} from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { User, Job, Vehicle, ActivityLog, UserRole, Language, Theme } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyCsiM7WDaDGa7nv87nHbkKE6fsFDwMnNZA",
  authDomain: "logistics-70952.firebaseapp.com",
  projectId: "logistics-70952",
  storageBucket: "logistics-70952.firebasestorage.app",
  messagingSenderId: "626764813746",
  appId: "1:626764813746:web:0dc6f5a8f4ec6b964cc0ab",
  measurementId: "G-X38M823TQM"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let db: Firestore;
try {
  db = getFirestore(app);
} catch (e) {
  console.error("Firestore initialization failed. Attempting immediate retry...", e);
  // Manual registration check or re-initialization can sometimes clear service availability errors in ESM environments
  db = getFirestore(app);
}

const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

const INITIAL_USERS: User[] = [
  { id: '1', username: 'ishwar', password: 'ishwar@121', role: UserRole.ADMIN, status: 'Active', name: 'Ishwar Admin' },
];

export const storageService = {
  // --- User & Auth ---
  getUsers: async (): Promise<User[]> => {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const users: User[] = [];
      querySnapshot.forEach((doc) => {
        users.push({ ...doc.data(), id: doc.id } as User);
      });

      if (users.length === 0) {
        // Bootstrap initial user
        for (const user of INITIAL_USERS) {
          await setDoc(doc(db, "users", user.id), user);
          users.push(user);
        }
      }
      return users;
    } catch (error) {
      console.error("Error fetching users:", error);
      return [];
    }
  },

  saveUser: async (user: User) => {
    await setDoc(doc(db, "users", user.id), user);
  },

  deleteUser: async (id: string) => {
    await deleteDoc(doc(db, "users", id));
  },

  // --- Settings ---
  getAppSettings: async (): Promise<{ language: Language; theme: Theme } | null> => {
    try {
      const docSnap = await getDoc(doc(db, "app_config", "settings"));
      if (docSnap.exists()) {
        return docSnap.data() as { language: Language; theme: Theme };
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
    return null;
  },

  saveAppSettings: async (settings: { language: Language; theme: Theme }) => {
    await setDoc(doc(db, "app_config", "settings"), settings);
  },

  // --- Jobs ---
  getJobs: async (): Promise<Job[]> => {
    try {
      const querySnapshot = await getDocs(collection(db, "jobs"));
      const jobs: Job[] = [];
      querySnapshot.forEach((doc) => {
        jobs.push({ ...doc.data(), id: doc.id } as Job);
      });
      return jobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error("Error fetching jobs:", error);
      return [];
    }
  },

  saveJob: async (job: Job) => {
    await setDoc(doc(db, "jobs", job.id), job);
  },

  // --- Vehicles ---
  getVehicles: async (): Promise<Vehicle[]> => {
    try {
      const querySnapshot = await getDocs(collection(db, "vehicles"));
      const vehicles: Vehicle[] = [];
      querySnapshot.forEach((doc) => {
        vehicles.push({ ...doc.data(), id: doc.id } as Vehicle);
      });
      return vehicles;
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      return [];
    }
  },

  saveVehicle: async (vehicle: Vehicle) => {
    await setDoc(doc(db, "vehicles", vehicle.id), vehicle);
  },

  deleteVehicle: async (id: string) => {
    await deleteDoc(doc(db, "vehicles", id));
  },

  // --- Logs ---
  getLogs: async (): Promise<ActivityLog[]> => {
    try {
      const logsQuery = query(collection(db, "logs"), orderBy("timestamp", "desc"), limit(100));
      const querySnapshot = await getDocs(logsQuery);
      const logs: ActivityLog[] = [];
      querySnapshot.forEach((doc) => {
        logs.push({ ...doc.data(), id: doc.id } as ActivityLog);
      });
      return logs;
    } catch (error) {
      console.error("Error fetching logs:", error);
      return [];
    }
  },

  addLog: async (log: Omit<ActivityLog, 'id' | 'timestamp'>) => {
    const newLog = {
      ...log,
      timestamp: new Date().toISOString()
    };
    await addDoc(collection(db, "logs"), newLog);
  }
};