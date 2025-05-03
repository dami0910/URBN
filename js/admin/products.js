// Admin products module
// Handles product management functionality

/**
 * Initializes the products management section
 */
export function initProductsManager() {
    loadProductsData();
    setupProductModals();
}

/**
 * Loads product data from the server
 */
function loadProductsData() {
    // Show loading indicator
    const tbody = document.querySelector('#productosTable tbody');
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Cargando productos...</td></tr>';
    
    // AJAX request to get products
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
                throw new Error(data.message || 'Error fetching products');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            tbody.innerHTML = `<tr><td colspan="6" class="text-center">Error al cargar productos: ${error.message}</td></tr>`;
            
            // Fallback to local data if available
            const productos = JSON.parse(localStorage.getItem('productos')) || [];
            if (productos.length > 0) {
                displayProducts(productos);
            }
        });
}

/**
 * Displays products data in the products table
 * @param {Array} productos - Array of product objects
 */
function displayProducts(productos) {
    const tbody = document.querySelector('#productosTable tbody');
    tbody.innerHTML = '';
    
    productos.forEach(producto => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${producto.id}</td>
            <td>
                <div class="product-img-small">
                    <img src="${producto.imagen}" alt="${producto.nombre}" class="product-thumbnail">
                </div>
            </td>
            <td>${producto.nombre}</td>
            <td>$${parseFloat(producto.precio).toFixed(2)}</td>
            <td>${producto.categoria.charAt(0).toUpperCase() + producto.categoria.slice(1)}</td>
            <td>
                <button class="btn btn-secondary edit-product" data-id="${producto.id}">Editar</button>
                <button class="btn btn-secondary delete-product" data-id="${producto.id}">Eliminar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

/**
 * Sets up product modals and related event handlers
 */
function setupProductModals() {
    // Set up product modal
    const productModal = document.getElementById('productModal');
    const productForm = document.getElementById('productForm');
    const closeProductBtn = productModal.querySelector('.close');
    const productImage = document.getElementById('productImage');
    const imagePreview = document.querySelector('.image-preview');
    
    // Handle image preview
    productImage.addEventListener('change', function(e) {
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview" class="preview-img">`;
            }
            reader.readAsDataURL(this.files[0]);
        }
    });
    
    document.getElementById('addProductBtn').addEventListener('click', function() {
        // Reset form
        productForm.reset();
        productForm.dataset.mode = 'add';
        productForm.dataset.id = '';
        productModal.querySelector('h2').textContent = 'Agregar Producto';
        imagePreview.innerHTML = `
            <svg width="100" height="100" viewBox="0 0 100 100">
                <rect width="100" height="100" fill="#E0E0E0" />
                <text x="50%" y="50%" font-size="12" text-anchor="middle" dominant-baseline="middle" fill="#9E9E9E">Vista previa</text>
            </svg>
        `;
        
        // Show modal
        productModal.style.display = 'block';
    });
    
    closeProductBtn.addEventListener('click', function() {
        productModal.style.display = 'none';
    });
    
    productForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Show loading/processing message
        const submitBtn = productForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;
        submitBtn.textContent = 'Guardando...';
        submitBtn.disabled = true;
        
        // Form data
        const formData = new FormData(this);
        
        // Add form fields explicitly to ensure they're included correctly
        formData.set('nombre', document.getElementById('productName').value);
        formData.set('precio', document.getElementById('productPrice').value);
        formData.set('categoria', document.getElementById('productCategory').value);
        
        let url = 'api/productos.php';
        let method = 'POST';
        
        if (this.dataset.mode === 'edit') {
            const id = parseInt(this.dataset.id);
            url += `?id=${id}`;
            // We'll handle PUT through POST with URL parameters
        }
        
        // AJAX request to save product
        fetch(url, {
            method: method,
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.message || 'Error del servidor');
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                loadProductsData(); // Refresh products table
                productModal.style.display = 'none';
                showNotification(data.message, 'success');
            } else {
                throw new Error(data.message || 'Error al guardar producto');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification(error.message, 'error');
            
            // Fallback to localStorage for demo only if network is completely unavailable
            if (!navigator.onLine) {
                handleLocalProductSave(this.dataset.mode, this.dataset.id);
            }
        })
        .finally(() => {
            // Reset button
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
        });
    });
    
    // Set up edit/delete product events using event delegation
    document.querySelector('#productosTable').addEventListener('click', function(e) {
        // Edit product
        if (e.target.classList.contains('edit-product')) {
            const id = parseInt(e.target.dataset.id);
            
            // Show loading indicator
            e.target.textContent = 'Cargando...';
            e.target.disabled = true;
            
            // AJAX request to get product details
            fetch(`api/productos.php?id=${id}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.success) {
                        fillProductForm(data.data, id);
                    } else {
                        throw new Error(data.message || 'Error al obtener producto');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    showNotification(error.message, 'error');
                    
                    // Reset button
                    e.target.textContent = 'Editar';
                    e.target.disabled = false;
                    
                    // Fallback to local data if available
                    const productos = JSON.parse(localStorage.getItem('productos')) || [];
                    const producto = productos.find(p => p.id === id);
                    if (producto) {
                        fillProductForm(producto, id);
                    }
                });
        }
        
        // Delete product
        if (e.target.classList.contains('delete-product')) {
            const id = parseInt(e.target.dataset.id);
            if (confirm('¿Está seguro de eliminar este producto?')) {
                // Show loading indicator
                e.target.textContent = 'Eliminando...';
                e.target.disabled = true;
                
                // AJAX request to delete product
                fetch(`api/productos.php?id=${id}`, {
                    method: 'DELETE'
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.success) {
                        loadProductsData(); // Refresh products table
                        showNotification(data.message, 'success');
                    } else {
                        throw new Error(data.message || 'Error al eliminar producto');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    showNotification(error.message, 'error');
                    
                    // Reset button
                    e.target.textContent = 'Eliminar';
                    e.target.disabled = false;
                    
                    // Fallback to localStorage if completely offline
                    if (!navigator.onLine) {
                        const productos = JSON.parse(localStorage.getItem('productos')) || [];
                        const index = productos.findIndex(p => p.id === id);
                        if (index !== -1) {
                            productos.splice(index, 1);
                            localStorage.setItem('productos', JSON.stringify(productos));
                            loadProductsData();
                            showNotification('Producto eliminado correctamente', 'success');
                        }
                    }
                });
            }
        }
    });
}

// Helper function for notifications
function showNotification(message, type) {
    // Check if notification container exists, create if not
    let notifContainer = document.getElementById('notificationContainer');
    if (!notifContainer) {
        notifContainer = document.createElement('div');
        notifContainer.id = 'notificationContainer';
        notifContainer.style.position = 'fixed';
        notifContainer.style.top = '20px';
        notifContainer.style.right = '20px';
        notifContainer.style.zIndex = '1000';
        document.body.appendChild(notifContainer);
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Style notification
    notification.style.backgroundColor = type === 'success' ? '#4CAF50' : '#F44336';
    notification.style.color = 'white';
    notification.style.padding = '12px 20px';
    notification.style.marginBottom = '10px';
    notification.style.borderRadius = '4px';
    notification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    notification.style.animation = 'fadeIn 0.3s ease';
    
    // Add to container
    notifContainer.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
            notifContainer.removeChild(notification);
        }, 300);
    }, 3000);
}

/**
 * Fills the product form with existing product data for editing
 * @param {Object} producto - Product object to edit
 * @param {number} id - Product ID
 */
function fillProductForm(producto, id) {
    document.getElementById('productName').value = producto.nombre;
    document.getElementById('productPrice').value = producto.precio;
    document.getElementById('productCategory').value = producto.categoria;
    
    // Set the image preview
    const imagePreview = document.querySelector('.image-preview');
    if (producto.imagen && producto.imagen !== 'img/default.png') {
        imagePreview.innerHTML = `<img src="${producto.imagen}" alt="${producto.nombre}" class="preview-img">`;
    } else {
        imagePreview.innerHTML = `
            <svg width="100" height="100" viewBox="0 0 100 100">
                <rect width="100" height="100" fill="#E0E0E0" />
                <text x="50%" y="50%" font-size="12" text-anchor="middle" dominant-baseline="middle" fill="#9E9E9E">Vista previa</text>
            </svg>
        `;
    }
    
    const productForm = document.getElementById('productForm');
    const productModal = document.getElementById('productModal');
    
    productForm.dataset.mode = 'edit';
    productForm.dataset.id = id;
    productModal.querySelector('h2').textContent = 'Editar Producto';
    
    productModal.style.display = 'block';
}

/**
 * Handles local product save when the API fails
 * @param {string} mode - 'add' or 'edit'
 * @param {string} id - Product ID for edit mode
 */
function handleLocalProductSave(mode, id) {
    const name = document.getElementById('productName').value;
    const price = parseFloat(document.getElementById('productPrice').value);
    const category = document.getElementById('productCategory').value;
    
    const productos = JSON.parse(localStorage.getItem('productos')) || [];
    
    if (mode === 'add') {
        // Add new product
        const newId = productos.length > 0 ? Math.max(...productos.map(p => p.id)) + 1 : 1;
        productos.push({
            id: newId,
            nombre: name,
            precio: price,
            categoria: category,
            imagen: 'img/default.png'
        });
    } else {
        // Edit existing product
        const idInt = parseInt(id);
        const index = productos.findIndex(p => p.id === idInt);
        if (index !== -1) {
            productos[index].nombre = name;
            productos[index].precio = price;
            productos[index].categoria = category;
        }
    }
    
    localStorage.setItem('productos', JSON.stringify(productos));
    loadProductsData();
    document.getElementById('productModal').style.display = 'none';
    showNotification(mode === 'add' ? 'Producto agregado correctamente' : 'Producto actualizado correctamente', 'success');
}