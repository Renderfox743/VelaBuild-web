// VelaBuild Download Manager
class DownloadManager {
  constructor() {
    this.projects = [];
    this.init();
  }
  
  async init() {
    await this.loadProjects();
    this.setupEventListeners();
  }
  
  async loadProjects() {
    // Check if user is logged in
    if (!auth.isLoggedIn()) {
      window.location.href = 'index.html';
      return;
    }
    
    try {
      const result = await auth.apiRequest('/list', {
        username: auth.session.username,
        password: auth.session.password || await this.promptPassword()
      });
      
      if (result.success && result.projects) {
        this.projects = result.projects;
        this.renderProjects();
      } else {
        this.showError('Failed to load projects');
      }
    } catch (error) {
      this.showError('Network error');
    }
  }
  
  async promptPassword() {
    // Simple password prompt
    const password = prompt('Enter your password:');
    return password || '';
  }
  
  renderProjects() {
    const container = document.getElementById('projectList');
    if (!container) return;
    
    if (this.projects.length === 0) {
      container.innerHTML = `
                <div class="card text-center">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📦</div>
                    <h3>No Projects Yet</h3>
                    <p class="text-secondary mb-2">Deploy your first project to see it here</p>
                    <a href="editor.html" class="btn btn-primary">Create Project</a>
                </div>
            `;
      return;
    }
    
    container.innerHTML = this.projects.map(project => `
            <div class="card project-card" data-project="${project.name}">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                        <h3>📁 ${project.name}</h3>
                        <p class="text-secondary mt-1">
                            ${project.hasRpk ? '📦 RPK available' : 'No RPK'} · 
                            ${project.hasSource ? '📁 Source available' : 'No source'}
                        </p>
                    </div>
                    <button class="btn btn-primary" onclick="downloadManager.showDownloadOptions('${project.name}')">
                        ⬇️ Download
                    </button>
                </div>
            </div>
        `).join('');
  }
  
  showDownloadOptions(projectName) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.innerHTML = `
            <div class="modal">
                <h3 style="margin-bottom: 1rem;">Download ${projectName}</h3>
                <div class="grid" style="gap: 0.5rem;">
                    <button class="btn btn-secondary" onclick="downloadManager.downloadProject('${projectName}', 'rpk')">
                        📦 RPK only
                    </button>
                    <button class="btn btn-secondary" onclick="downloadManager.downloadProject('${projectName}', 'source')">
                        📁 Full source
                    </button>
                    <button class="btn btn-secondary" onclick="downloadManager.downloadProject('${projectName}', 'certs')">
                        🔐 Certificates only
                    </button>
                    <button class="btn btn-secondary" onclick="downloadManager.downloadProject('${projectName}', 'startcode')">
                        📁 Start code (no certs)
                    </button>
                </div>
                <div style="margin-top: 1rem; text-align: right;">
                    <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                </div>
            </div>
        `;
    
    document.body.appendChild(modal);
  }
  
  async downloadProject(projectName, what) {
    const modal = document.querySelector('.modal-overlay');
    if (modal) modal.remove();
    
    const loadingToast = this.showToast('⬇️ Downloading...', 'info');
    
    try {
      const result = await auth.apiRequest('/download', {
        username: auth.session.username,
        password: auth.session.password || await this.promptPassword(),
        project: projectName,
        what: what
      });
      
      if (result.success && result.files) {
        // Create a zip file from the files
        this.createDownload(result.files, projectName);
        this.showToast('✅ Download complete!', 'success');
      } else {
        this.showError(result.error || 'Download failed');
      }
    } catch (error) {
      this.showError('Network error');
    }
  }
  
  createDownload(files, projectName) {
    // For demo purposes, just download each file individually
    Object.entries(files).forEach(([filePath, base64Content]) => {
      const blob = this.base64ToBlob(base64Content);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filePath.split('/').pop();
      a.click();
      URL.revokeObjectURL(url);
    });
  }
  
  base64ToBlob(base64) {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray]);
  }
  
  setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('searchProjects');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const cards = document.querySelectorAll('.project-card');
        cards.forEach(card => {
          const projectName = card.dataset.project.toLowerCase();
          card.style.display = projectName.includes(searchTerm) ? 'block' : 'none';
        });
      });
    }
  }
  
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 2000);
    
    return toast;
  }
  
  showError(message) {
    this.showToast(message, 'error');
  }
}

// Initialize download manager
const downloadManager = new DownloadManager();