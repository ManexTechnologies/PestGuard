// src/lib/api.ts
const API_BASE_URL = "http://localhost/pestguard/backend/api";

// Token helpers
function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

function setToken(token: string): void {
  localStorage.setItem('auth_token', token);
}

function clearToken(): void {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function safeJson(response: Response): Promise<any> {
  const text = await response.text();
  if (!text) {
    return { success: false, error: `Empty response body (${response.status})` };
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    
    return { success: false, error: `Invalid JSON response (${response.status})` };
  }
}

export interface PestSighting {
  id: number;
  pest_name: string;
  pest_type?: string;
  severity?: string;
  location?: string;
  latitude?: string;
  longitude?: string;
  description?: string;
  image_url?: string;
  created_at: string;
  identified_at?: string;
  user_id?: number;
  user_name?: string;
  user_email?: string;
  status?: string;
  crop_affected?: string;
}

// Login - FIXED: accepts either (email, password) or ({email, password})
export async function login(
  emailOrObject: string | { email: string; password: string },
  password?: string
): Promise<{ success: boolean; user?: any; token?: string; error?: string }> {
  // Extract email and password from either format
  let email: string;
  let pwd: string;
  
  if (typeof emailOrObject === 'object' && emailOrObject !== null) {
    email = emailOrObject.email;
    pwd = emailOrObject.password;
  } else {
    email = emailOrObject as string;
    pwd = password || '';
  }
  
  
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth.php/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pwd }),
    });

    const result = await safeJson(response);

    if (result.success && result.token) {
      setToken(result.token);
      localStorage.setItem('user', JSON.stringify({ id: result.user_id, email: result.email }));
    }

    return {
      success: result.success ?? false,
      user: result.user_id ? { id: result.user_id, email: result.email } : undefined,
      token: result.token,
      error: result.error,
    };
  } catch (error: any) {
    
    return { success: false, error: error?.message || 'Network error' };
  }
}

// Signup - FIXED: accepts either (userData) or (email, password, full_name)
export async function signup(
  userDataOrEmail: string | { email: string; password: string; full_name?: string },
  password?: string,
  full_name?: string
): Promise<{ success: boolean; user?: any; token?: string; error?: string }> {
  let userData: { email: string; password: string; full_name?: string };
  
  if (typeof userDataOrEmail === 'object' && userDataOrEmail !== null) {
    userData = userDataOrEmail;
  } else {
    userData = {
      email: userDataOrEmail as string,
      password: password || '',
      full_name: full_name
    };
  }
  
  
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth.php/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    const result = await safeJson(response);

    if (result.success && result.token) {
      setToken(result.token);
      localStorage.setItem('user', JSON.stringify({ id: result.user_id, email: userData.email }));
    }

    return {
      success: result.success ?? false,
      user: result.user_id ? { id: result.user_id, email: userData.email } : undefined,
      token: result.token,
      error: result.error,
    };
  } catch (error: any) {
    
    return { success: false, error: error?.message || 'Network error' };
  }
}

// Logout
export async function logout(): Promise<{ success: boolean; error?: string }> {
  try {
    await fetch(`${API_BASE_URL}/auth.php/logout`, {
      method: 'POST',
      headers: authHeaders(),
    });
  } catch (_) {
    // Ignore network errors on logout
  }
  clearToken();
  return { success: true };
}

// Verify session / get current user + profile
export async function verifySession(): Promise<{
  success: boolean;
  user?: any;
  profile?: any;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth.php/verify-session`, {
      method: 'POST',
      headers: authHeaders(),
    });

    const result = await safeJson(response);

    if (result.user && result.profile) {
      return { success: true, user: result.user, profile: result.profile };
    }

    return { success: false, error: result.error || 'Session invalid' };
  } catch (error: any) {
    
    return { success: false, error: error?.message || 'Network error' };
  }
}

// Get user profile (wraps verify-session)
export async function getUserProfile(
  _userId?: number
): Promise<{ success: boolean; profile?: any; error?: string }> {
  const result = await verifySession();
  return { success: result.success, profile: result.profile, error: result.error };
}

// Update user profile
export async function updateUserProfile(
  _userId: number,
  profileData: {
    full_name?: string;
    farm_name?: string;
    farm_location?: string;
    province?: string;
    phone?: string;
    crops_grown?: string[];
  }
): Promise<{ success: boolean; profile?: any; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth.php/update-profile`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(profileData),
    });

    const result = await safeJson(response);

    if (result.error) {
      return { success: false, error: result.error };
    }

    return { success: true, profile: result };
  } catch (error: any) {
    
    return { success: false, error: error?.message || 'Network error' };
  }
}

// Get all pest sightings
export async function getAllPestSightings(): Promise<{
  success: boolean;
  data: PestSighting[];
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/pest.php/pest-sightings?all=true`, {
      headers: authHeaders(),
    });

    const result = await safeJson(response);

    if (result.success) {
      return { success: true, data: result.data || [] };
    }

    return { success: false, data: [], error: result.error || 'Failed to fetch sightings' };
  } catch (error: any) {
    
    return { success: false, data: [], error: error?.message || 'Network error' };
  }
}

// Get pest sightings for a specific user
export async function getUserPestSightings(userId: number): Promise<{
  success: boolean;
  data: PestSighting[];
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/pest.php/pest-sightings?user_id=${userId}`, {
      headers: authHeaders(),
    });

    const result = await safeJson(response);

    if (result.success) {
      return { success: true, data: result.data || [] };
    }

    return { success: false, data: [], error: result.error || 'Failed to fetch sightings' };
  } catch (error: any) {
    
    return { success: false, data: [], error: error?.message || 'Network error' };
  }
}

// Record a new pest sighting
export async function recordPestSighting(reportData: {
  user_id: number;
  pest_name: string;
  pest_type?: string;
  severity?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  image_url?: string;
  description?: string;
}): Promise<{ success: boolean; sighting_id?: number; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/pest.php/pest-sightings`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(reportData),
    });

    const result = await safeJson(response);
    return {
      success: result.success ?? false,
      sighting_id: result.sighting_id,
      error: result.error,
    };
  } catch (error: any) {
    
    return { success: false, error: error?.message || 'Network error' };
  }
}

// Record pest history / treatment effectiveness
export async function recordPestHistory(data: {
  user_id: number;
  sighting_id?: number;
  action_taken?: string;
  treatment_used?: string;
  effectiveness?: string;
  result?: string;
  treated_at?: string;
}): Promise<{ success: boolean; history_id?: number; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/pest.php/pest-history`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data),
    });

    const result = await safeJson(response); 
    return {
      success: result.success ?? false,
      history_id: result.history_id,
      error: result.error,
    };
  } catch (error: any) {
    
    return { success: false, error: error?.message || 'Network error' };
  }
}

// Get pest history for a user
export async function getPestHistory(userId: number): Promise<{
  success: boolean;
  data: any[];
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/pest.php/pest-history?user_id=${userId}`, {
      headers: authHeaders(),
    });

    const result = await safeJson(response);
    return { success: result.success ?? false, data: result.data || [], error: result.error };
  } catch (error: any) {
    
    return { success: false, data: [], error: error?.message || 'Network error' };
  }
}

// Identify pest from image (OpenAI vision)
export async function identifyPest(imageBase64OrUrl: string): Promise<{
  success: boolean;
  pest_name?: string;
  confidence?: number;
  description?: string;
  treatment?: string;
  error?: string;
}> {
  try {
    const isUrl = imageBase64OrUrl.startsWith('http');
    const response = await fetch(`${API_BASE_URL}/pest.php/identify-pest`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(
        isUrl ? { imageUrl: imageBase64OrUrl } : { imageBase64: imageBase64OrUrl }
      ),
    });

    const result = await safeJson(response);

    if (result.pest_name) {
      return { success: true, ...result };
    }

    return { success: false, error: result.error || 'Identification failed' };
  } catch (error: any) {
    
    return { success: false, error: error?.message || 'Network error' };
  }
}

