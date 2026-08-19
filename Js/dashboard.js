// js/dashboard.js - Fixed version
class DashboardManager {
  constructor() {
    this.init();
  }
  
  async init() {
    if (!auth.isLoggedIn()) {
      window.location.href = 'index.html';
      return;
    }
    
    this.loadUserInfo();
    await this.loadProjects();
    this.setupEventListeners();
  }
  
  loadUserInfo() {
    const usernameElement = document.getElementById('username');
    if (usernameElement && auth.session) {
      usernameElement.textContent = auth.session.username;
    }
  }
  
  async loadProjects() {
    const container = document.getElementById('recentProjects');
    if (!container) return;
    
    // Show loading state
    container.innerHTML = `
            <div class="card text-center text-secondary">
                <span class="spinner"></span>
                <p>Loading projects...</p>
            </div>
        `;
    
    // Get password - either from session or prompt
    let password = auth.session.password;
    if (!password) {
      password = await this.promptPassword();
      if (!password) {
        container.innerHTML = `
                    <div class="card text-center">
                        <p class="text-secondary">Password required to load projects</p>
                        <button class="btn btn-primary mt-2" onclick="dashboard.loadProjects()">Retry</button>
                    </div>
                `;
        return;
      }
    }
    
    try {
      const result = await auth.apiRequest('/list', {
        username: auth.session.username,
        password: password
      });
      
      if (result.success && result.projects) {
        this.updateStats(result.projects);
        this.renderProjects(result.projects, container);
      } else {
        container.innerHTML = `
                    <div class="card text-center">
                        <p class="text-error">${result.error || 'Failed to load projects'}</p>
                        <button class="btn btn-primary mt-2" onclick="dashboard.loadProjects()">Retry</button>
                    </div>
                `;
      }
    } catch (error) {
      container.innerHTML = `
                <div class="card text-center">
                    <p class="text-error">Network error</p>
                    <button class="btn btn-primary mt-2" onclick="dashboard.loadProjects()">Retry</button>
                </div>
            `;
    }
  }
  
  async promptPassword() {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'modal-overlay active';
      modal.innerHTML = `
                <div class="modal">
                    <h3>Enter Password</h3>
                    <p class="text-secondary mb-2">Please enter your password to load your projects</p>
                    <div class="form-group">
                        <input type="password" id="modalPassword" class="form-input" placeholder="Password">
                    </div>
                    <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove(); resolvePassword(null)">Cancel</button>
                        <button class="btn btn-primary" onclick="resolvePassword(document.getElementById('modalPassword').value)">Submit</button>
                    </div>
                </div>
            `;
      document.body.appendChild(modal);
      
      window.resolvePassword = (password) => {
        modal.remove();
        resolve(password);
      };
    });
  }
  
  updateStats(projects) {
    const projectCount = projects.length;
    const rpkCount = projects.filter(p => p.hasRpk).length;
    const buildCount = projects.filter(p => p.hasRpk || p.hasSource).length;
    
    document.getElementById('projectCount').textContent = projectCount;
    document.getElementById('rpkCount').textContent = rpkCount;
    document.getElementById('buildCount').textContent = buildCount;
  }
  
  renderProjects(projects, container) {
    if (projects.length === 0) {
      container.innerHTML = `
                <div class="card text-center">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📦</div>
                    <h3>No Projects Yet</h3>
                    <p class="text-secondary mb-2">Create your first Mi Band 9 app</p>
                    <a href="editor.html" class="btn btn-primary">Create Project</a>
                </div>
            `;
      return;
    }
    
    container.innerHTML = projects.map(project => `
            <div class="card">
                <h3>📁 ${project.name}</h3>
                <p class="text-secondary mt-1">
                    ${project.hasRpk ? '📦 RPK available' : 'No RPK'} · 
                    ${project.hasSource ? '📁 Source available' : 'No source'}
                </p>
                <div class="mt-2">
                    <button class="btn btn-primary" onclick="window.location.href='editor.html?project=${project.name}'">Open</button>
                    <button class="btn btn-secondary" onclick="window.location.href='download.html?project=${project.name}'">Download</button>
                </div>
            </div>
        `).join('');
  }
  
  setupEventListeners() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        await auth.logout();
        window.location.href = 'index.html';
      });
    }
  }
}

// Initialize dashboard
const dashboard = new DashboardManager();