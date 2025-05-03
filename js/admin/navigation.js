// Admin navigation module
// Handles sidebar navigation functionality

/**
 * Sets up the navigation sidebar in the admin panel
 */
export function setupAdminNavigation() {
    const navButtons = document.querySelectorAll('.sidebar-btn');
    const views = document.querySelectorAll('.view');
    
    navButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all buttons and views
            navButtons.forEach(b => b.classList.remove('active'));
            views.forEach(v => v.classList.remove('active'));
            
            // Add active class to selected button
            this.classList.add('active');
            
            // Show corresponding view
            const viewId = this.getAttribute('data-view');
            document.getElementById(viewId).classList.add('active');
        });
    });
}