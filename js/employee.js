// Employee (POS) page functionality - Main entry point
import { loadProductsForSale } from './employee/products.js';
import { initCart, setupCartEvents } from './employee/cart.js';
import { setupCheckout } from './employee/checkout.js';
import { setupCategoryFilters } from './employee/ui.js';

document.addEventListener('DOMContentLoaded', function() {
    // Check if this is the employee page
    if (document.querySelector('.empleado-page')) {
        initEmpleadoPage();
    }
});

function initEmpleadoPage() {
    // Display username from session data
    const currentUserElement = document.getElementById('currentUser');
    if (currentUserElement) {
        // Get user from localStorage as a fallback
        const localUser = JSON.parse(localStorage.getItem('currentUser'));
        if (localUser) {
            currentUserElement.textContent = localUser.nombre;
        }
        
        // Try to fetch current session info for most up-to-date data
        fetch('api/session_info.php', {
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success && data.user) {
                currentUserElement.textContent = data.user.nombre;
                // Update localStorage with latest data
                localStorage.setItem('currentUser', JSON.stringify(data.user));
            }
        })
        .catch(error => {
            console.error('Error fetching session info:', error);
        });
    }
    
    // Load products
    loadProductsForSale();
    
    // Initialize cart
    initCart();
    
    // Set up events
    setupEmployeeEvents();
}

function setupEmployeeEvents() {
    // Categories
    setupCategoryFilters();
    
    // Cart events
    setupCartEvents();
    
    // Checkout
    setupCheckout();
}