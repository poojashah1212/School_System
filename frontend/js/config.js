/**
 * Environment Configuration for School System
 * Automatically detects environment and provides appropriate URLs
 */

class EnvironmentConfig {
    constructor() {
        this.isProduction = this.detectProductionEnvironment();
        this.config = this.getEnvironmentConfig();
    }

    /**
     * Detect if we're running in production environment
     */
    detectProductionEnvironment() {
        // Check if we're on the production domain
        const hostname = window.location.hostname;
        return hostname.includes('smartschool-je18.onrender.com') || 
               hostname !== 'localhost' && 
               hostname !== '127.0.0.1' &&
               !hostname.includes('.local');
    }

    /**
     * Get environment-specific configuration
     */
    getEnvironmentConfig() {
        if (this.isProduction) {
            return {
                apiBaseUrl: 'https://smartschool-je18.onrender.com/api',
                frontendBaseUrl: 'https://smartschool-je18.onrender.com',
                loginUrl: 'https://smartschool-je18.onrender.com/html/login.html',
                studentDashboardUrl: 'https://smartschool-je18.onrender.com/html/studentDashboard.html',
                teacherDashboardUrl: 'https://smartschool-je18.onrender.com/html/teacherDashboard.html'
            };
        } else {
            return {
                apiBaseUrl: 'http://localhost:5000/api',
                frontendBaseUrl: 'http://localhost:5001',
                loginUrl: 'http://localhost:5001/html/login.html',
                studentDashboardUrl: 'http://localhost:5001/html/studentDashboard.html',
                teacherDashboardUrl: 'http://localhost:5001/html/teacherDashboard.html'
            };
        }
    }

    /**
     * Get API base URL
     */
    getApiBaseUrl() {
        return this.config.apiBaseUrl;
    }

    /**
     * Get frontend base URL
     */
    getFrontendBaseUrl() {
        return this.config.frontendBaseUrl;
    }

    /**
     * Get login URL
     */
    getLoginUrl() {
        return this.config.loginUrl;
    }

    /**
     * Get student dashboard URL
     */
    getStudentDashboardUrl() {
        return this.config.studentDashboardUrl;
    }

    /**
     * Get teacher dashboard URL
     */
    getTeacherDashboardUrl() {
        return this.config.teacherDashboardUrl;
    }

    /**
     * Log current environment (for debugging)
     */
    logEnvironment() {
        console.log('Environment:', this.isProduction ? 'Production' : 'Development');
        console.log('API Base URL:', this.config.apiBaseUrl);
        console.log('Frontend Base URL:', this.config.frontendBaseUrl);
    }
}

// Create singleton instance
const envConfig = new EnvironmentConfig();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = envConfig;
} else {
    window.envConfig = envConfig;
}
