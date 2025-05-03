// Employee products module - Handles loading and displaying products

/**
 * Loads products from the API for the POS interface
 */
export function loadProductsForSale() {
    // Show loading indicator
    const productsGrid = document.getElementById('productsGrid');
    productsGrid.innerHTML = '<div class="loading-indicator">Cargando productos...</div>';
    
    // Try to fetch products from API
    fetch('api/productos.php')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                displayProducts(data.data);
            } else {
                throw new Error(data.message || 'Error loading products');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            productsGrid.innerHTML = `<div class="error-message">Error al cargar productos: ${error.message}</div>`;
            
            // Fallback to local storage if available
            const productos = JSON.parse(localStorage.getItem('productos')) || [];
            if (productos.length > 0) {
                displayProducts(productos);
            }
        });
}

/**
 * Displays products in the product grid
 * @param {Array} productos - Array of product objects
 */
function displayProducts(productos) {
    const productsGrid = document.getElementById('productsGrid');
    
    productsGrid.innerHTML = '';
    
    productos.forEach(producto => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.dataset.id = producto.id;
        productCard.dataset.category = producto.categoria;
        
        // Get category icon
        let categoryIcon = '';
        switch(producto.categoria) {
            case 'cafe':
                categoryIcon = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>';
                break;
            case 'comida':
                categoryIcon = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 10h10v8a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-8z"></path><path d="M7 10a6 5 0 0 1 10 0"></path><line x1="12" y1="15" x2="12" y2="18"></line></svg>';
                break;
            case 'postre':
                categoryIcon = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>';
                break;
        }
        
        productCard.innerHTML = `
            <div class="product-badge">${categoryIcon}</div>
            <div class="product-img">
                <img src="${producto.imagen}" alt="${producto.nombre}" class="product-image">
            </div>
            <div class="product-name">${producto.nombre}</div>
            <div class="product-price">$${parseFloat(producto.precio).toFixed(2)}</div>
            <button class="add-to-cart-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                Agregar
            </button>
        `;
        
        // Add to cart on click
        productCard.addEventListener('click', function() {
            // Add animation effect
            this.classList.add('pulse-effect');
            setTimeout(() => this.classList.remove('pulse-effect'), 300);
            
            // Import here to avoid circular dependency
            import('./cart.js').then(module => {
                module.addToCart(producto);
            });
        });
        
        productsGrid.appendChild(productCard);
    });
}

/**
 * Filters displayed products by category
 * @param {string} category - Category to filter by, or 'all' for all products
 */
export function filterProductsByCategory(category) {
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
        if (category === 'all' || card.dataset.category === category) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}