import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Firebase config — hardcoded to bypass Vercel env variable issues
const firebaseConfig = {
  apiKey:            "AIzaSyBQqFnI951dU-NX1AU_rR-zjCy7DEEGNIM",
  authDomain:        "my-all-projects-d3d6f.firebaseapp.com",
  projectId:         "my-all-projects-d3d6f",
  storageBucket:     "my-all-projects-d3d6f.firebasestorage.app",
  messagingSenderId: "2183565403",
  appId:             "1:2183565403:web:cced3de281e23b6293ef7e",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
