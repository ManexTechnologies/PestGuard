import { login as apiLogin, signup as apiSignup, logout as apiLogout, getPestHistory } from './api';

export interface User {
  id: number;
  email: string;
}

export interface FarmerProfile {
  id: number;
  user_id: number;
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
const API_BASE_URL = 'http://localhost/pestguard/backend/api';

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

  const result = await apiSignup({
    email,
    password,
    full_name: fullName,
    farm_name: farmName,
    farm_location: farmLocation,
    province,
    crops_grown: cropsGrown,
    phone,
  });

  if (!result || !result.success) {
    throw new Error(result?.error || 'Signup failed');
  }

  const user = { id: result.user_id, email: result.email || '' };
  const profile = {
    id: result.user_id,
    user_id: result.user_id,
    full_name: fullName,
    farm_name: farmName || null,
    farm_location: farmLocation || null,
    province: province || null,
    crops_grown: cropsGrown || [],
    phone: phone || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  storeSession(result.token);

  return {
    user,
    profile,
    sessionToken: result.token,
  };
}

export async function login(
  email: string,
  password: string
): Promise<{ user: User; profile: FarmerProfile; sessionToken: string }> {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  const result = await apiLogin(email, password);
  if (!result || !result.success) {
    throw new Error(result?.error || 'Login failed');
  }

  const user = { id: result.user_id, email: result.email };
  const profile = {
    id: result.user_id,
    user_id: result.user_id,
    full_name: '',
    farm_name: null,
    farm_location: null,
    province: null,
    crops_grown: [],
    phone: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  storeSession(result.token);

  return {
    user,
    profile,
    sessionToken: result.token,
  };
}

async function safeJson(response: Response): Promise<any> {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    console.error('Invalid JSON response', { status: response.status, text });
    return null;
  }
}

export async function verifySession(token: string): Promise<{ user: User; profile: FarmerProfile } | null> {
  if (!token) return null;

  try {
    const result = await fetch(API_BASE_URL + '/auth.php/verify-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!result.ok) {
      clearSession();
      return null;
    }
    
    const data = await safeJson(result);
    if (!data) {
      clearSession();
      return null;
    }
    return data as { user: User; profile: FarmerProfile };
  } catch (error) {
    clearSession();
    return null;
  }
}

export async function updateProfile(
  token: string,
  updates: Partial<Omit<FarmerProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<FarmerProfile> {
  const response = await fetch(API_BASE_URL + '/auth.php/update-profile', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const err = await safeJson(response);
    throw new Error(err?.error || 'Profile update failed');
  }

  const updated = await safeJson(response);
  if (!updated) {
    throw new Error('Profile update failed: empty response');
  }
  return updated as FarmerProfile;
}

export async function logout(token: string | null) {
  clearSession();
  try {
    await apiLogout();
  } catch (error) {
    console.error('Logout error:', error);
  }
}
