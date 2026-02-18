import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { auth, db } from './firebase';

export interface User {
  id: string;
  email: string;
}

export interface FarmerProfile {
  id: string;
  user_id: string;
  full_name: string;
  farm_name: string | null;
  farm_location: string | null;
  province: string | null;
  crops_grown: string[];
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  profile: FarmerProfile | null;
  loading: boolean;
}

const SESSION_KEY = 'pestguard_session';

function storeSession(token: string) {
  try {
    localStorage.setItem(SESSION_KEY, token);
  } catch {}
}

function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {}
}

export function getStoredSession(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

export async function signup(params: {
  email: string;
  password: string;
  fullName: string;
  farmName?: string;
  farmLocation?: string;
  province?: string;
  cropsGrown?: string[];
  phone?: string;
}): Promise<{ user: User; profile: FarmerProfile; sessionToken: string }> {
  const { email, password, fullName, farmName, farmLocation, province, cropsGrown, phone } = params;

  if (!email || !password || !fullName) {
    throw new Error('Email, password, and full name are required');
  }
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  const emailLower = email.toLowerCase().trim();

  // Create user with Firebase Auth (Firebase will check for duplicate emails)
  const userCredential = await createUserWithEmailAndPassword(auth, emailLower, password);
  const firebaseUser = userCredential.user;

  // Create user document in Firestore
  const userData = {
    email: emailLower,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await setDoc(doc(db, 'users', firebaseUser.uid), userData);

  // Create farmer profile
  const profileData: any = {
    user_id: firebaseUser.uid,
    full_name: fullName,
    farm_name: farmName || null,
    farm_location: farmLocation || null,
    province: province || null,
    crops_grown: cropsGrown || [],
    phone: phone || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const profileDocId = `profile_${firebaseUser.uid}`;
  await setDoc(doc(db, 'farmer_profiles', profileDocId), profileData);

  // Get ID token for session
  const idToken = await firebaseUser.getIdToken();
  storeSession(idToken);

  // Get profile data to return
  const profileDoc = await getDoc(doc(db, 'farmer_profiles', profileDocId));
  const profile = { id: profileDocId, ...profileDoc.data() } as FarmerProfile;

  return {
    user: { id: firebaseUser.uid, email: firebaseUser.email! },
    profile,
    sessionToken: idToken,
  };
}

export async function login(email: string, password: string): Promise<{ user: User; profile: FarmerProfile; sessionToken: string }> {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  const emailLower = email.toLowerCase().trim();

  // Sign in with Firebase Auth
  const userCredential = await signInWithEmailAndPassword(auth, emailLower, password);
  const firebaseUser = userCredential.user;

  // Get user document
  const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
  if (!userDoc.exists()) {
    throw new Error('User data not found');
  }

  // Get farmer profile
  const profilesRef = collection(db, 'farmer_profiles');
  const q = query(profilesRef, where('user_id', '==', firebaseUser.uid));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    throw new Error('Farmer profile not found');
  }

  const profileDoc = querySnapshot.docs[0];
  const profile = { id: profileDoc.id, ...profileDoc.data() } as FarmerProfile;

  // Get ID token for session
  const idToken = await firebaseUser.getIdToken();
  storeSession(idToken);

  return {
    user: { id: firebaseUser.uid, email: firebaseUser.email! },
    profile,
    sessionToken: idToken,
  };
}

export async function verifySession(token: string): Promise<{ user: User; profile: FarmerProfile } | null> {
  if (!token) return null;

  try {
    // Verify token with Firebase Auth
    const currentUser = auth.currentUser;
    if (!currentUser) {
      clearSession();
      return null;
    }

    // Get user document
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    if (!userDoc.exists()) {
      clearSession();
      return null;
    }

    // Get farmer profile
    const profilesRef = collection(db, 'farmer_profiles');
    const q = query(profilesRef, where('user_id', '==', currentUser.uid));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      clearSession();
      return null;
    }

    const profileDoc = querySnapshot.docs[0];
    const profile = { id: profileDoc.id, ...profileDoc.data() } as FarmerProfile;

    return {
      user: { id: currentUser.uid, email: currentUser.email! },
      profile,
    };
  } catch (error) {
    clearSession();
    return null;
  }
}

export async function updateProfile(
  token: string,
  updates: Partial<Omit<FarmerProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<FarmerProfile> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Not authenticated');

  // Get farmer profile
  const profilesRef = collection(db, 'farmer_profiles');
  const q = query(profilesRef, where('user_id', '==', currentUser.uid));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) throw new Error('Profile not found');

  const profileDoc = querySnapshot.docs[0];
  const profileRef = doc(db, 'farmer_profiles', profileDoc.id);

  // Update profile
  const updateData = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  await updateDoc(profileRef, updateData);

  // Get updated profile
  const updatedDoc = await getDoc(profileRef);
  const profile = { id: updatedDoc.id, ...updatedDoc.data() } as FarmerProfile;

  return profile;
}

export async function logout(token: string | null) {
  clearSession();
  await signOut(auth);
}

export function onAuthStateChangedListener(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

