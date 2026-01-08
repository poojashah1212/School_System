// Component Loader for Dashboard
class ComponentLoader {
    constructor() {
        this.componentsPath = '../components/';
    }

    async loadComponent(componentName) {
        try {
            const response = await fetch(`${this.componentsPath}${componentName}.html`);
            if (!response.ok) {
                throw new Error(`Failed to load ${componentName} component`);
            }
            return await response.text();
        } catch (error) {
            console.error(`Error loading component ${componentName}:`, error);
            return '';
        }
    }

    async loadSidebar(type = 'teacher') {
        const sidebarComponent = type === 'student' ? 'studentSidebar' : 'sidebar';
        const sidebarHTML = await this.loadComponent(sidebarComponent);
        const sidebarContainer = document.querySelector('.dashboard');
        if (sidebarContainer && sidebarHTML) {
            // Insert sidebar at the beginning of dashboard
            sidebarContainer.insertAdjacentHTML('afterbegin', sidebarHTML);
        }
    }

    async loadHeader(type = 'teacher') {
        const headerComponent = type === 'student' ? 'studentHeader' : 'header';
        const headerHTML = await this.loadComponent(headerComponent);
        const mainElement = document.querySelector('.main');
        if (mainElement && headerHTML) {
            // Insert header at the beginning of main
            mainElement.insertAdjacentHTML('afterbegin', headerHTML);
        }
    }

    async loadAllComponents(type = 'teacher') {
        await Promise.all([
            this.loadSidebar(type),
            this.loadHeader(type)
        ]);
        
        // Re-initialize event listeners after components are loaded
        if (type === 'teacher' && window.teacherDashboard) {
            window.teacherDashboard.setupEventListeners();
        } else if (type === 'student' && window.studentDashboard) {
            window.studentDashboard.setupEventListeners();
        }
    }
}

// Export for use in other files
window.ComponentLoader = ComponentLoader;
