// VelaBuild Authentication
const API_URL = 'https://rdfxvelaapi.share.zrok.io';

class AuthManager {
  constructor() {
    this.session = this.getSession();
  }
  
  getSession() {
    const session = localStorage.getItem('velabuild_session');
    return session ? JSON.parse(session) : null;
  }
  
  saveSession(username, password = null, remember = false) {
    const session = {
      username,
      loggedAt: new Date().toISOString(),
      rememberPassword: remember,
      password: remember ? password : null
    };
    localStorage.setItem('velabuild_session', JSON.stringify(session));
    this.session = session;
  }
  
  clearSession() {
    localStorage.removeItem('velabuild_session');
    this.session = null;
  }
  
  isLoggedIn() {
    return this.session !== null;
  }
  
  async apiRequest(endpoint, data) {
    const url = `${API_URL}${endpoint}`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Network error', log: error.message };
    }
  }
  
  validatePassword(password) {
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return 'Password must contain at least one symbol';
    return null;
  }
  
  async login(username, password, remember = false) {
    return await this.apiRequest('/login', { username, password });
  }
  
  async signup(username, password, remember = false) {
    return await this.apiRequest('/signup', { username, password });
  }
  
  async logout() {
    this.clearSession();
    return { success: true };
  }
}

// Initialize auth manager
const auth = new AuthManager();