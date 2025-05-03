// Admin page main module
// This file serves as an entry point for admin functionality

// Import admin modules
import { initAdminDashboard } from './admin/dashboard.js';
import { setupAdminNavigation } from './admin/navigation.js';
import { initProductsManager } from './admin/products.js';
import { initUsersManager } from './admin/users.js';
import { initSalesReports } from './admin/sales.js';

// Admin page specific functionality
function initAdminPage() {
    // Display username from session data
    const currentUserElement = document.getElementById('currentUser');
    const sidebarUserName = document.getElementById('sidebarUserName');
    
    if (currentUserElement) {
        // Get user from localStorage as a fallback
        const localUser = JSON.parse(localStorage.getItem('currentUser'));
        if (localUser) {
            currentUserElement.textContent = localUser.nombre;
            if (sidebarUserName) {
                sidebarUserName.textContent = localUser.nombre;
            }
        }
        
        // Try to fetch current session info for most up-to-date data
        fetch('api/session_info.php', {
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success && data.user) {
                currentUserElement.textContent = data.user.nombre;
                if (sidebarUserName) {
                    sidebarUserName.textContent = data.user.nombre;
                }
                // Update localStorage with latest data
                localStorage.setItem('currentUser', JSON.stringify(data.user));
            }
        })
        .catch(error => {
            console.error('Error fetching session info:', error);
        });
    }
    
    // Initialize admin components
    setupAdminNavigation();
    initAdminDashboard();
    initProductsManager();
    initUsersManager();
    initSalesReports(); // Initialize the sales reports section
}

// Initialize the page
document.addEventListener('DOMContentLoaded', initAdminPage);

// The logout functionality is now handled in the auth.js file directly