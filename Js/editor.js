// VelaBuild Editor
class EditorManager {
    constructor() {
        this.currentFile = null;
        this.isModified = false;
        this.projectStructure = this.getDefaultProject();
        this.init();
    }

    getDefaultProject() {
        return {
            name: 'pages',
            type: 'folder',
            expanded: true,
            children: [
                {
                    name: 'index',
                    type: 'folder',
                    expanded: true,
                    children: [
                        { 
                            name: 'index.ux', 
                            type: 'file', 
                            content: `<template>\n  <div class="page">\n    <text class="title">Hello World</text>\n  </div>\n</template>\n\n<style>\n  .page {\n    flex-direction: column;\n    justify-content: center;\n    align-items: center;\n    width: 100%;\n    height: 100%;\n    background-color: #000000;\n  }\n  .title {\n    font-size: 32px;\n    color: #ffffff;\n  }\n</style>\n\n<script>\n  export default {\n    data: {},\n    onInit() {\n      console.log('Index page loaded!')\n    }\n  }\n</script>` 
                        }
                    ]
                },
                {
                    name: 'about',
                    type: 'folder',
                    expanded: false,
                    children: [
                        { 
                            name: 'about.ux', 
                            type: 'file', 
                            content: `<template>\n  <div class="page">\n    <text class="title">About</text>\n  </div>\n</template>\n\n<style>\n  .page {\n    flex-direction: column;\n    justify-content: center;\n    align-items: center;\n    width: 100%;\n    height: 100%;\n    background-color: #000000;\n  }\n  .title {\n    font-size: 32px;\n    color: #ffffff;\n  }\n</style>\n\n<script>\n  export default {\n    data: {},\n    onInit() {\n      console.log('About page loaded!')\n    }\n  }\n</script>` 
                        }
                    ]
                }
            ]
        };
    }

    init() {
        this.renderFileTree();
        this.setupEditor();
        this.setupEventListeners();
    }

    renderFileTree() {
        const container = document.getElementById('fileTree');
        if (!container) return;
        
        container.innerHTML = '';
        this.renderTreeItem(this.projectStructure, container, 0);
    }

    renderTreeItem(item, container, depth) {
        const itemElement = document.createElement('div');
        itemElement.className = 'file-tree-item';
        itemElement.style.paddingLeft = `${depth * 20 + 8}px`;
        
        const icon = item.type === 'folder' ? 
            (item.expanded ? '📂' : '📁') : 
            this.getFileIcon(item.name);
        
        itemElement.innerHTML = `
            <span class="icon">${icon}</span>
            <span>${item.name}</span>
        `;
        
        if (item.type === 'folder') {
            itemElement.addEventListener('click', (e) => {
                e.stopPropagation();
                item.expanded = !item.expanded;
                this.renderFileTree();
            });
        } else {
            itemElement.addEventListener('click', () => {
                this.openFile(item);
            });
        }
        
        container.appendChild(itemElement);
        
        if (item.type === 'folder' && item.expanded && item.children) {
            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'file-tree-children';
            container.appendChild(childrenContainer);
            
            item.children.forEach(child => {
                this.renderTreeItem(child, childrenContainer, depth + 1);
            });
        }
    }

    getFileIcon(filename) {
        if (filename.endsWith('.ux')) return '📄';
        if (filename.endsWith('.json')) return '📋';
        if (filename.endsWith('.js')) return '📜';
        return '📄';
    }

    setupEditor() {
        const editor = document.getElementById('codeEditor');
        if (!editor) return;
        
        editor.addEventListener('input', () => {
            this.isModified = true;
            this.updateSaveStatus();
        });
        
        // Open first file by default
        if (this.projectStructure.children && this.projectStructure.children[0]?.children?.[0]) {
            this.openFile(this.projectStructure.children[0].children[0]);
        }
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.saveFile();
            }
        });
    }

    openFile(file) {
        if (this.isModified) {
            if (!confirm('You have unsaved changes. Do you want to discard them?')) {
                return;
            }
        }
        
        this.currentFile = file;
        const editor = document.getElementById('codeEditor');
        if (editor) {
            editor.value = file.content || '';
        }
        
        this.updateBreadcrumb(file);
        this.isModified = false;
        this.updateSaveStatus();
        this.highlightActiveFile(file);
    }

    updateBreadcrumb(file) {
        const breadcrumb = document.getElementById('breadcrumb');
        if (!breadcrumb) return;
        
        const fullPath = this.findPath(this.projectStructure, file);
        if (fullPath) {
            breadcrumb.innerHTML = fullPath.map((part, index) => {
                const isLast = index === fullPath.length - 1;
                if (isLast) {
                    return `<span class="breadcrumb-item current">${part}</span>`;
                } else {
                    return `
                        <a href="#" class="breadcrumb-item">${part}</a>
                        <span class="breadcrumb-separator">›</span>
                    `;
                }
            }).join('');
        }
    }

    findPath(items, target, currentPath = []) {
        if (items.name === target.name) {
            return [...currentPath, items.name];
        }
        if (items.children) {
            for (const child of items.children) {
                const result = this.findPath(child, target, [...currentPath, items.name]);
                if (result) return result;
            }
        }
        return null;
    }

    highlightActiveFile(file) {
        document.querySelectorAll('.file-tree-item').forEach(item => {
            item.classList.remove('active');
        });
        
        document.querySelectorAll('.file-tree-item').forEach(item => {
            if (item.textContent.includes(file.name)) {
                item.classList.add('active');
            }
        });
    }

    updateSaveStatus() {
        const dot = document.getElementById('saveStatus');
        const text = document.getElementById('saveStatusText');
        if (!dot || !text) return;
        
        if (this.isModified) {
            dot.className = 'status-dot unsaved';
            text.textContent = 'Unsaved changes';
        } else {
            dot.className = 'status-dot';
            text.textContent = 'All changes saved';
        }
    }

    saveFile() {
        if (this.currentFile) {
            const editor = document.getElementById('codeEditor');
            if (editor) {
                this.currentFile.content = editor.value;
                this.isModified = false;
                this.updateSaveStatus();
                this.showToast('✅ File saved successfully', 'success');
            }
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
    }

    async buildProject() {
        if (this.isModified) {
            this.saveFile();
        }
        
        // Show build modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.innerHTML = `
            <div class="modal">
                <div style="text-align: center;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">🔨</div>
                    <h3 style="margin-bottom: 1rem;">Building & Deploying...</h3>
                    <p class="text-secondary">Your app is being compiled and deployed</p>
                    <div style="margin-top: 1rem; width: 200px; height: 4px; background: var(--border); border-radius: 2px; overflow: hidden; margin: 1rem auto;">
                        <div style="width: 60%; height: 100%; background: var(--gradient-primary); animation: slideIn 1s ease-in-out infinite;"></div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Simulate build process
        setTimeout(() => {
            modal.innerHTML = `
                <div class="modal">
                    <div style="text-align: center;">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">✅</div>
                        <h3 style="margin-bottom: 1rem;">Build Complete!</h3>
                        <p class="text-secondary" style="margin-bottom: 1rem;">Your app has been deployed successfully</p>
                        <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove()">Close</button>
                    </div>
                </div>
            `;
        }, 3000);
    }
}

// Initialize editor
const editor = new EditorManager();