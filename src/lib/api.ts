// src/lib/api.ts
const API_BASE_URL = 'http://localhost/pestguard';

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
  user_id?: number;
  user_name?: string;
  user_email?: string;
  status?: string;
  crop_affected?: string;
}

// Get all pest sightings/reports
export async function getAllPestSightings(): Promise<{ success: boolean; data: PestSighting[]; error?: string }> {
  try {
    const url = API_BASE_URL + '/get_reports_api.php';
    const response = await fetch(url);
    const result = await response.json();
    
    if (result.success) {
      return { success: true, data: result.reports || [] };
    } else {
      return { success: false, data: [], error: result.message || 'Failed to fetch reports' };
    }
  } catch (error) {
    console.error('Error fetching reports:', error);
    return { success: false, data: [], error: 'Network error - make sure XAMPP is running' };
  }
}

// Record a new pest sighting/report
export async function recordPestSighting(reportData: any): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    const url = API_BASE_URL + '/add_report_api.php';
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportData)
    });
    const result = await response.json();
    return { success: result.success, error: result.error, data: result.data };
  } catch (error) {
    console.error('Error recording pest sighting:', error);
    return { success: false, error: 'Network error' };
  }
}

// Record pest history effectiveness rating
export async function recordPestHistory(data: {
  user_id: number;
  sighting_id: number;
  effectiveness: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const url = API_BASE_URL + '/record_effectiveness.php';
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    return { success: result.success, error: result.error };
  } catch (error) {
    console.error('Error recording effectiveness:', error);
    return { success: false, error: 'Network error' };
  }
}

// Login function
export async function login(email: string, password: string): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    const url = API_BASE_URL + '/login_api.php';
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const result = await response.json();
    return { success: result.success, user: result.user, error: result.error };
  } catch (error) {
    console.error('Error logging in:', error);
    return { success: false, error: 'Network error' };
  }
}

// Signup function
export async function signup(userData: any): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    const url = API_BASE_URL + '/signup_api.php';
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const result = await response.json();
    return { success: result.success, user: result.user, error: result.error };
  } catch (error) {
    console.error('Error signing up:', error);
    return { success: false, error: 'Network error' };
  }
}

// Logout function
export async function logout(): Promise<{ success: boolean; error?: string }> {
  try {
    // Clear any client-side session storage
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    return { success: true };
  } catch (error) {
    console.error('Error logging out:', error);
    return { success: false, error: 'Error during logout' };
  }
}

// Get user profile
export async function getUserProfile(userId: number): Promise<{ success: boolean; profile?: any; error?: string }> {
  try {
    const url = API_BASE_URL + '/get_profile_api.php?user_id=' + userId;
    const response = await fetch(url);
    const result = await response.json();
    return { success: result.success, profile: result.profile, error: result.error };
  } catch (error) {
    console.error('Error fetching profile:', error);
    return { success: false, error: 'Network error' };
  }
}

// Update user profile
export async function updateUserProfile(userId: number, profileData: any): Promise<{ success: boolean; error?: string }> {
  try {
    const url = API_BASE_URL + '/update_profile_api.php';
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, ...profileData })
    });
    const result = await response.json();
    return { success: result.success, error: result.error };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { success: false, error: 'Network error' };
  }
}