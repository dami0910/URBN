// Employee checkout module - Handles checkout and payment processing
import { updateCartDisplay } from './cart.js';
import { showNotification } from './ui.js';

/**
 * Sets up checkout functionality and event handlers
 */
export function setupCheckout() {
    const checkoutModal = document.getElementById('checkoutModal');
    const closeCheckoutBtn = checkoutModal.querySelector('.close');
    const cashPaymentSection = document.getElementById('cashPaymentSection');
    const paymentMethodSelect = document.getElementById('paymentMethod');
    const cashAmountInput = document.getElementById('cashAmount');
    const cashChangeInput = document.getElementById('cashChange');
    const checkoutForm = document.getElementById('checkoutForm');
    
    document.getElementById('checkoutBtn').addEventListener('click', function() {
        const cart = JSON.parse(localStorage.getItem('currentCart'));
        
        if (cart.length === 0) {
            alert('No hay productos en el carrito');
            return;
        }
        
        // Show purchase summary
        const checkoutItems = document.getElementById('checkoutItems');
        const checkoutTotal = document.getElementById('checkoutTotal');
        
        checkoutItems.innerHTML = '';
        
        let subtotal = 0;
        
        cart.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'checkout-item';
            itemEl.innerHTML = `
                <span>${item.cantidad} x ${item.nombre}</span>
                <span>$${(item.precio * item.cantidad).toFixed(2)}</span>
            `;
            checkoutItems.appendChild(itemEl);
            
            subtotal += item.precio * item.cantidad;
        });
        
        // Add VAT
        const iva = subtotal * 0.16;
        const totalConIva = subtotal + iva;
        
        const ivaEl = document.createElement('div');
        ivaEl.className = 'checkout-item';
        ivaEl.innerHTML = `
            <span>IVA (16%)</span>
            <span>$${iva.toFixed(2)}</span>
        `;
        checkoutItems.appendChild(ivaEl);
        
        checkoutTotal.textContent = '$' + totalConIva.toFixed(2);
        
        // Reset form
        checkoutForm.reset();
        cashChangeInput.value = '';
        
        // Show modal
        checkoutModal.style.display = 'block';
    });
    
    closeCheckoutBtn.addEventListener('click', function() {
        checkoutModal.style.display = 'none';
    });
    
    paymentMethodSelect.addEventListener('change', function() {
        if (this.value === 'efectivo') {
            cashPaymentSection.style.display = 'block';
        } else {
            cashPaymentSection.style.display = 'none';
        }
    });
    
    cashAmountInput.addEventListener('input', function() {
        const amount = parseFloat(this.value) || 0;
        const total = parseFloat(document.getElementById('checkoutTotal').textContent.replace('$', ''));
        
        if (amount >= total) {
            const change = amount - total;
            cashChangeInput.value = '$' + change.toFixed(2);
        } else {
            cashChangeInput.value = 'Cantidad insuficiente';
        }
    });
    
    checkoutForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const paymentMethod = paymentMethodSelect.value;
        
        if (paymentMethod === 'efectivo') {
            const amount = parseFloat(cashAmountInput.value) || 0;
            const total = parseFloat(document.getElementById('checkoutTotal').textContent.replace('$', ''));
            
            if (amount < total) {
                alert('El monto recibido es insuficiente');
                return;
            }
        }
        
        // Process sale
        processSale(paymentMethod);
    });
}

/**
 * Processes a sale/completes the checkout
 * @param {string} paymentMethod - Method of payment ('efectivo' or 'tarjeta')
 */
function processSale(paymentMethod) {
    const cart = JSON.parse(localStorage.getItem('currentCart'));
    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || { id: 0, nombre: 'Empleado' };
    
    // Calculate total
    let subtotal = 0;
    cart.forEach(item => {
        subtotal += item.precio * item.cantidad;
    });
    const iva = subtotal * 0.16;
    const total = subtotal + iva;
    
    // Create sale object
    const venta = {
        items: cart,
        subtotal: subtotal,
        iva: iva,
        total: total,
        metodoPago: paymentMethod,
        vendedor: {
            id: currentUser.id,
            nombre: currentUser.nombre
        },
        fecha: new Date().toISOString()
    };
    
    // Show loading indicator
    const submitBtn = document.querySelector('#checkoutForm button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = 'Procesando...';
    submitBtn.disabled = true;
    
    // Send sale data to the server using AJAX
    fetch('api/ventas.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(venta)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Update venta with server-assigned ID
            venta.id = data.data.id;
            
            // Clear cart
            localStorage.setItem('currentCart', JSON.stringify([]));
            
            // Close modal
            document.getElementById('checkoutModal').style.display = 'none';
            
            // Update cart
            updateCartDisplay();
            
            // Show receipt or success message
            showReceipt(venta);
        } else {
            throw new Error(data.message || 'Error al procesar la venta');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        
        // Show error notification
        showNotification(error.message, 'error');
        
        // Fallback for demo/offline mode: save locally
        if (!navigator.onLine) {
            // Assign local ID
            venta.id = Date.now();
            
            // Save sale to storage
            const ventas = JSON.parse(localStorage.getItem('ventas')) || [];
            ventas.push(venta);
            localStorage.setItem('ventas', JSON.stringify(ventas));
            
            // Clear cart
            localStorage.setItem('currentCart', JSON.stringify([]));
            
            // Close modal
            document.getElementById('checkoutModal').style.display = 'none';
            
            // Update cart
            updateCartDisplay();
            
            // Show receipt or success message
            showReceipt(venta);
        }
    })
    .finally(() => {
        // Reset button
        submitBtn.textContent = originalBtnText;
        submitBtn.disabled = false;
    });
}

/**
 * Displays a receipt/invoice for the completed sale
 * @param {Object} venta - Sale object with all sale data
 */
function showReceipt(venta) {
    // Create receipt modal with enhanced styling
    const receiptModal = document.createElement('div');
    receiptModal.className = 'modal';
    receiptModal.id = 'receiptModal';
    
    const receiptContent = document.createElement('div');
    receiptContent.className = 'modal-content receipt';
    
    // Format date
    const date = new Date(venta.fecha);
    const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    
    receiptContent.innerHTML = `
        <span class="close">&times;</span>
        <div class="receipt-header">
            <div class="receipt-logo">
                <img src="logo_URBN.png" alt="URBN Logo" width="60">
                <h2>PUNTO URBN</h2>
            </div>
            <h3>Comprobante de Venta</h3>
            <p><strong>Fecha:</strong> ${formattedDate}</p>
            <p><strong>Vendedor:</strong> ${venta.vendedor.nombre}</p>
            <p><strong>Folio:</strong> #${venta.id.toString().padStart(6, '0')}</p>
            <p><strong>Método de pago:</strong> ${venta.metodoPago === 'efectivo' ? 'Efectivo' : 'Tarjeta'}</p>
        </div>
        <div class="receipt-items">
            <h3>Productos</h3>
            <table>
                <thead>
                    <tr>
                        <th>Cant.</th>
                        <th>Producto</th>
                        <th>Precio Unit.</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${venta.items.map(item => `
                        <tr>
                            <td>${item.cantidad}</td>
                            <td>${item.nombre}</td>
                            <td>$${item.precio.toFixed(2)}</td>
                            <td>$${(item.precio * item.cantidad).toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        <div class="receipt-summary">
            <p><strong>Subtotal:</strong> $${venta.subtotal.toFixed(2)}</p>
            <p><strong>IVA (16%):</strong> $${venta.iva.toFixed(2)}</p>
            <p class="receipt-total"><strong>Total:</strong> $${venta.total.toFixed(2)}</p>
        </div>
        <div class="receipt-footer">
            <p>¡Gracias por su compra!</p>
            <div class="barcode">
                <svg width="200" height="40" viewBox="0 0 200 40">
                    <!-- Simplified barcode visualization -->
                    ${Array.from({length: 30}, (_, i) => 
                        `<rect x="${i * 6}" y="0" width="${Math.random() > 0.5 ? 2 : 4}" height="40" fill="#000"/>`
                    ).join('')}
                </svg>
                <div class="barcode-number">${Math.floor(Math.random() * 10000000000).toString().padStart(10, '0')}</div>
            </div>
            <div class="receipt-actions">
                <button class="btn btn-primary" id="printReceiptBtn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="6 9 6 2 18 2 18 9"></polyline>
                        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                        <rect x="6" y="14" width="12" height="8"></rect>
                    </svg>
                    Imprimir
                </button>
                <button class="btn btn-secondary" id="closeReceiptBtn">Cerrar</button>
            </div>
        </div>
    `;
    
    receiptModal.appendChild(receiptContent);
    document.body.appendChild(receiptModal);
    
    // Show modal with animation
    setTimeout(() => {
        receiptModal.style.display = 'block';
        receiptContent.classList.add('bounce-in');
        
        // Confetti effect for successful sale
        createConfetti();
    }, 100);
    
    // Close receipt modal
    const closeReceiptBtn = receiptModal.querySelector('.close');
    closeReceiptBtn.addEventListener('click', function() {
        receiptContent.classList.add('bounce-out');
        setTimeout(() => {
            document.body.removeChild(receiptModal);
        }, 300);
    });
    
    document.getElementById('closeReceiptBtn').addEventListener('click', function() {
        receiptContent.classList.add('bounce-out');
        setTimeout(() => {
            document.body.removeChild(receiptModal);
        }, 300);
    });
    
    document.getElementById('printReceiptBtn').addEventListener('click', function() {
        window.print();
    });
}

// Add confetti effect for successful sales
function createConfetti() {
    const confettiContainer = document.createElement('div');
    confettiContainer.className = 'confetti-container';
    document.body.appendChild(confettiContainer);
    
    // Create confetti pieces
    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.animationDelay = Math.random() * 3 + 's';
        confetti.style.backgroundColor = ['#FFD700', '#6B4F4F', '#FFFFFF'][Math.floor(Math.random() * 3)];
        confettiContainer.appendChild(confetti);
    }
    
    // Remove after animation completes
    setTimeout(() => {
        document.body.removeChild(confettiContainer);
    }, 6000);
}