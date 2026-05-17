// Debug version of API calls
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

console.log('API Base URL:', API_BASE_URL);

export async function debugLogin(email: string, password: string) {
    const url = `${API_BASE_URL}/auth.php/login`;
    console.log('Attempting login to:', url);
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);
        return data;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}
