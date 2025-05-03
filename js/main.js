// Core initialization and utility functions
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    initApp();
});

function initApp() {
    // Check current page
    const currentPage = window.location.pathname.split('/').pop();
    
    // Initialize demo data if it doesn't exist
    initDemoData();
    
    // Load functionality based on the page
    switch(currentPage) {
        case 'index.html':
            if (typeof initLoginPage === 'function') {
                initLoginPage();
            }
            break;
        case 'admin.html':
            if (typeof initAdminPage === 'function') {
                initAdminPage();
            }
            break;
        case 'empleado.html':
            if (typeof initEmpleadoPage === 'function') {
                initEmpleadoPage();
            }
            break;
        default:
            // Redirect to login if page not recognized
            window.location.href = 'index.html';
    }
}

// Initialize demo data
function initDemoData() {
    // Check if data already exists
    if (!localStorage.getItem('usuarios')) {
        // Create default admin user
        const usuarios = [
            {
                id: 1,
                nombre: 'Administrador',
                usuario: 'admin',
                password: 'admin123',
                rol: 'admin'
            },
            {
                id: 2,
                nombre: 'Empleado Demo',
                usuario: 'empleado',
                password: 'empleado123',
                rol: 'empleado'
            }
        ];
        localStorage.setItem('usuarios', JSON.stringify(usuarios));
    }
    
    if (!localStorage.getItem('productos')) {
        // Create sample products
        const productos = [
            {
                id: 1,
                nombre: 'Café Americano',
                precio: 25.00,
                categoria: 'cafe',
                imagen: 'img/default.png'
            },
            {
                id: 2,
                nombre: 'Cappuccino',
                precio: 35.00,
                categoria: 'cafe',
                imagen: 'img/default.png'
            },
            {
                id: 3,
                nombre: 'Sandwich de Jamón',
                precio: 45.00,
                categoria: 'comida',
                imagen: 'img/default.png'
            },
            {
                id: 4,
                nombre: 'Pastel de Chocolate',
                precio: 40.00,
                categoria: 'postre',
                imagen: 'img/default.png'
            }
        ];
        localStorage.setItem('productos', JSON.stringify(productos));
    }
    
    if (!localStorage.getItem('ventas')) {
        // Create empty sales array
        localStorage.setItem('ventas', JSON.stringify([]));
    }
}