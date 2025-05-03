// Import necessary modules
import { initAuth } from './auth.js';
import { initAdminPage } from './admin.js';
import { initEmpleadoPage } from './employee.js';

// Configuración inicial
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar la aplicación
    initApp();
});

function initApp() {
    // Inicializar autenticación
    initAuth();

    // Comprobar la página actual
    const currentPage = window.location.pathname.split('/').pop();
    
    // Cargar la funcionalidad según la página
    switch(currentPage) {
        case 'index.html':
            break;
        case 'admin.html':
            initAdminPage();
            break;
        case 'empleado.html':
            initEmpleadoPage();
            break;
        default:
            // Redireccionar a login si la página no es reconocida
            window.location.href = 'index.html';
    }
}