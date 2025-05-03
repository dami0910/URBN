// Employee cart module - Handles shopping cart functionality
import { showNotification } from './ui.js';

/**
 * Initializes the shopping cart
 */
export function initCart() {
    // Initialize empty cart
    if (!localStorage.getItem('currentCart')) {
        localStorage.setItem('currentCart', JSON.stringify([]));
    }
    
    updateCartDisplay();
}

/**
 * Adds a product to the cart
 * @param {Object} producto - Product to add to cart
 */
export function addToCart(producto) {
    const cart = JSON.parse(localStorage.getItem('currentCart'));
    const existingItem = cart.find(item => item.id === producto.id);
    
    if (existingItem) {
        existingItem.cantidad += 1;
    } else {
        cart.push({
            id: producto.id,
            nombre: producto.nombre,
            precio: parseFloat(producto.precio),
            cantidad: 1
        });
    }
    
    localStorage.setItem('currentCart', JSON.stringify(cart));
    updateCartDisplay();
    
    // Add visual feedback
    showAddedToCartFeedback();
}

/**
 * Shows a brief feedback message when a product is added to cart
 */
function showAddedToCartFeedback() {
    // Create and show a brief "Added to cart" message
    const feedback = document.createElement('div');
    feedback.className = 'cart-feedback';
    feedback.textContent = 'Agregado al carrito';
    document.body.appendChild(feedback);
    
    // Remove after animation
    setTimeout(() => {
        feedback.classList.add('fade-out');
        setTimeout(() => {
            document.body.removeChild(feedback);
        }, 300);
    }, 700);
}

/**
 * Updates the cart display with current items
 */
export function updateCartDisplay() {
    const cart = JSON.parse(localStorage.getItem('currentCart'));
    const cartItemsEl = document.getElementById('cartItems');
    const subtotalEl = document.getElementById('subtotal');
    const ivaEl = document.getElementById('iva');
    const totalEl = document.getElementById('total');
    
    // Clear cart
    cartItemsEl.innerHTML = '';
    
    if (cart.length === 0) {
        cartItemsEl.innerHTML = `
            <div class="empty-cart">
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                <p>No hay productos en el carrito</p>
                <small>Selecciona productos para comenzar</small>
            </div>`;
        subtotalEl.textContent = '$0.00';
        ivaEl.textContent = '$0.00';
        totalEl.textContent = '$0.00';
        return;
    }
    
    let subtotal = 0;
    
    cart.forEach(item => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="cart-item-details">
                <div class="cart-item-name">${item.nombre}</div>
                <div class="cart-item-price">$${item.precio.toFixed(2)} x ${item.cantidad}</div>
            </div>
            <div class="cart-item-controls">
                <button class="btn btn-icon decrease-qty" data-id="${item.id}">-</button>
                <span class="cart-item-quantity">${item.cantidad}</span>
                <button class="btn btn-icon increase-qty" data-id="${item.id}">+</button>
                <button class="btn btn-icon remove-item" data-id="${item.id}">×</button>
            </div>
        `;
        cartItemsEl.appendChild(cartItem);
        
        subtotal += item.precio * item.cantidad;
    });
    
    const iva = subtotal * 0.16;
    const total = subtotal + iva;
    
    // Add animation to totals
    subtotalEl.textContent = '$0.00';
    ivaEl.textContent = '$0.00';
    totalEl.textContent = '$0.00';
    
    setTimeout(() => {
        subtotalEl.textContent = '$' + subtotal.toFixed(2);
        subtotalEl.classList.add('highlight');
        
        setTimeout(() => {
            ivaEl.textContent = '$' + iva.toFixed(2);
            ivaEl.classList.add('highlight');
            
            setTimeout(() => {
                totalEl.textContent = '$' + total.toFixed(2);
                totalEl.classList.add('highlight');
                
                setTimeout(() => {
                    subtotalEl.classList.remove('highlight');
                    ivaEl.classList.remove('highlight');
                    totalEl.classList.remove('highlight');
                }, 500);
            }, 100);
        }, 100);
    }, 100);
}

/**
 * Sets up cart event handlers
 */
export function setupCartEvents() {
    // Cart events delegation
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('increase-qty')) {
            const id = parseInt(e.target.dataset.id);
            updateCartItemQuantity(id, 1);
        }
        
        if (e.target.classList.contains('decrease-qty')) {
            const id = parseInt(e.target.dataset.id);
            updateCartItemQuantity(id, -1);
        }
        
        if (e.target.classList.contains('remove-item')) {
            const id = parseInt(e.target.dataset.id);
            removeCartItem(id);
        }
    });
    
    // Cancel order button
    document.getElementById('cancelOrderBtn').addEventListener('click', function() {
        if (confirm('¿Está seguro de cancelar la orden actual?')) {
            localStorage.setItem('currentCart', JSON.stringify([]));
            updateCartDisplay();
        }
    });
}

/**
 * Updates the quantity of an item in the cart
 * @param {number} id - Product ID
 * @param {number} change - Amount to change (positive or negative)
 */
function updateCartItemQuantity(id, change) {
    const cart = JSON.parse(localStorage.getItem('currentCart'));
    const itemIndex = cart.findIndex(item => item.id === id);
    
    if (itemIndex !== -1) {
        cart[itemIndex].cantidad += change;
        
        if (cart[itemIndex].cantidad <= 0) {
            cart.splice(itemIndex, 1);
        }
        
        localStorage.setItem('currentCart', JSON.stringify(cart));
        updateCartDisplay();
    }
}

/**
 * Removes an item from the cart
 * @param {number} id - Product ID to remove
 */
function removeCartItem(id) {
    const cart = JSON.parse(localStorage.getItem('currentCart'));
    const itemIndex = cart.findIndex(item => item.id === id);
    
    if (itemIndex !== -1) {
        cart.splice(itemIndex, 1);
        localStorage.setItem('currentCart', JSON.stringify(cart));
        updateCartDisplay();
    }
}