// API client for communicating with PHP backend via XAMPP
// Cast `import.meta` to `any` to avoid missing `env` typings in this project setup
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost/pestguard/backend/api';

interface SignupData {
  email: string;
  password: string;
  full_name?: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface PestSighting {
  user_id: number;
  pest_name: string;
  pest_type?: string;
  severity?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  image_url?: string;
  description?: string;
}

interface PestHistoryItem {
  user_id: number;
  sighting_id?: number;
  action_taken?: string;
  treatment_used?: string;
  effectiveness?: string;
  result?: string;
  treated_at?: string;
}

// Helper function to make API calls
async function apiCall(endpoint: string, method: string = 'GET', data?: unknown) {
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `HTTP error! status: ${response.status}`);
    }

    return result;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Authentication functions
export async function signup(signupData: SignupData) {
  return apiCall('/auth.php/signup', 'POST', signupData);
}

export async function login(loginData: LoginData) {
  return apiCall('/auth.php/login', 'POST', loginData);
}

export async function logout() {
  return apiCall('/auth.php/logout', 'POST');
}

// Pest sighting functions
export async function recordPestSighting(sightingData: PestSighting) {
  return apiCall('/pest.php/pest-sightings', 'POST', sightingData);
}

export async function getPestSightings(userId: number) {
  return apiCall(`/pest.php/pest-sightings?user_id=${userId}`);
}

export async function getAllPestSightings() {
  return apiCall(`/pest.php/pest-sightings?all=true`);
}

// Pest history functions
export async function recordPestHistory(historyData: PestHistoryItem) {
  return apiCall('/pest.php/pest-history', 'POST', historyData);
}

export async function getPestHistory(userId: number) {
  return apiCall(`/pest.php/pest-history?user_id=${userId}`);
}

// Knowledge base functions
export async function getKnowledgeBase(filters?: { pest_type?: string; search?: string }) {
  let query = '/knowledge-base.php/knowledge-base';
  const params = new URLSearchParams();

  if (filters?.pest_type) {
    params.append('pest_type', filters.pest_type);
  }
  if (filters?.search) {
    params.append('search', filters.search);
  }

  if (params.toString()) {
    query += `?${params.toString()}`;
  }

  return apiCall(query);
}

export async function createKnowledgeBaseArticle(articleData: unknown) {
  return apiCall('/knowledge-base.php/knowledge-base', 'POST', articleData);
}

export default {
  signup,
  login,
  logout,
  recordPestSighting,
  getPestSightings,
  recordPestHistory,
  getPestHistory,
  getKnowledgeBase,
  createKnowledgeBaseArticle,
};
