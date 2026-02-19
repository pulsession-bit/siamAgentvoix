import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

if (!firebaseConfig.apiKey) {
  console.error("Firebase Config Error: VITE_FIREBASE_API_KEY is missing. Check .env.local and try restarting the server.");
  console.log("Current Env:", import.meta.env);
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};
export const createAccount = async (email, password) => {
  const { createUserWithEmailAndPassword } = await import("firebase/auth");
  return createUserWithEmailAndPassword(auth, email, password);
};

export const signInWithEmail = async (email, password) => {
  const { signInWithEmailAndPassword } = await import("firebase/auth");
  return signInWithEmailAndPassword(auth, email, password);
};

export const updateUserProfile = async (user, profile) => {
  const { updateProfile } = await import("firebase/auth");
  return updateProfile(user, profile);
};
