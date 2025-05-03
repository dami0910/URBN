// Admin sales module
// Handles sales reports functionality

/**
 * Initializes the sales report section
 */
export function initSalesReports() {
    loadSalesData();
    setupDateFilter();
}

/**
 * Sets up date filter functionality
 */
function setupDateFilter() {
    const filterBtn = document.getElementById('filterReportBtn');
    const dateFrom = document.getElementById('dateFrom');
    const dateTo = document.getElementById('dateTo');
    
    // Set default date values (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    dateFrom.valueAsDate = thirtyDaysAgo;
    dateTo.valueAsDate = today;
    
    // Filter button click handler
    filterBtn.addEventListener('click', function() {
        loadSalesData(dateFrom.value, dateTo.value);
    });
}

/**
 * Loads sales data from the server
 * @param {string} startDate - Optional start date for filtering (YYYY-MM-DD)
 * @param {string} endDate - Optional end date for filtering (YYYY-MM-DD)
 */
function loadSalesData(startDate, endDate) {
    // Show loading indicator
    const tbody = document.querySelector('#ventasTable tbody');
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Cargando ventas...</td></tr>';
    
    // Build API URL with date filters if provided
    let url = 'api/ventas.php';
    if (startDate && endDate) {
        url += `?start=${startDate}&end=${endDate}`;
    }
    
    // AJAX request to get sales data
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                displaySales(data.data);
                generateSalesReportChart(data.data);
            } else {
                throw new Error(data.message || 'Error fetching sales data');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            tbody.innerHTML = `<tr><td colspan="6" class="text-center">Error al cargar ventas: ${error.message}</td></tr>`;
            
            // Show placeholder chart
            document.querySelector('.report-container .chart-placeholder').style.display = 'flex';
            
            // Fallback to demo data if completely offline
            if (!navigator.onLine) {
                showDemoSalesData();
            }
        });
}

/**
 * Displays sales data in the sales table
 * @param {Array} ventas - Array of sales objects
 */
function displaySales(ventas) {
    const tbody = document.querySelector('#ventasTable tbody');
    tbody.innerHTML = '';
    
    if (ventas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay ventas en el período seleccionado</td></tr>';
        return;
    }
    
    ventas.forEach(venta => {
        const date = new Date(venta.fecha);
        const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${venta.id}</td>
            <td>${formattedDate}</td>
            <td>Cliente General</td>
            <td>$${parseFloat(venta.total).toFixed(2)}</td>
            <td>${venta.vendedor || 'Sistema'}</td>
            <td>
                <button class="btn btn-secondary view-sale-details" data-id="${venta.id}">Ver Detalles</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    // Set up event listeners for view details buttons
    setupViewDetailsEvents();
}

/**
 * Sets up event listeners for "Ver Detalles" buttons
 */
function setupViewDetailsEvents() {
    document.querySelectorAll('.view-sale-details').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            loadSaleDetails(id);
        });
    });
}

/**
 * Loads and displays details for a specific sale
 * @param {number} id - Sale ID
 */
function loadSaleDetails(id) {
    // Show loading button state
    const btn = document.querySelector(`.view-sale-details[data-id="${id}"]`);
    const originalText = btn.textContent;
    btn.textContent = 'Cargando...';
    btn.disabled = true;
    
    // Fetch sale details
    fetch(`api/ventas.php?id=${id}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showSaleDetailsModal(data.data);
            } else {
                throw new Error(data.message || 'Error loading sale details');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification(error.message, 'error');
        })
        .finally(() => {
            // Reset button state
            btn.textContent = originalText;
            btn.disabled = false;
        });
}

/**
 * Displays a modal with sale details
 * @param {Object} data - Sale details data
 */
function showSaleDetailsModal(data) {
    // Check if modal already exists, remove if it does
    let saleDetailsModal = document.getElementById('saleDetailsModal');
    if (saleDetailsModal) {
        document.body.removeChild(saleDetailsModal);
    }
    
    // Create new modal
    saleDetailsModal = document.createElement('div');
    saleDetailsModal.id = 'saleDetailsModal';
    saleDetailsModal.className = 'modal';
    
    const venta = data.venta;
    const detalles = data.detalles;
    const date = new Date(venta.fecha);
    const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    
    saleDetailsModal.innerHTML = `
        <div class="modal-content receipt">
            <span class="close">&times;</span>
            <h2>Detalles de la Venta #${venta.id}</h2>
            <div class="receipt-header">
                <p><strong>Fecha:</strong> ${formattedDate}</p>
                <p><strong>Vendedor:</strong> ${venta.vendedor || 'Sistema'}</p>
                <p><strong>Método de pago:</strong> ${venta.metodo_pago === 'efectivo' ? 'Efectivo' : 'Tarjeta'}</p>
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
                        ${detalles.map(item => `
                            <tr>
                                <td>${item.cantidad}</td>
                                <td>${item.nombre}</td>
                                <td>$${parseFloat(item.precio_unitario).toFixed(2)}</td>
                                <td>$${(parseFloat(item.precio_unitario) * parseInt(item.cantidad)).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div class="receipt-summary">
                <p><strong>Subtotal:</strong> $${parseFloat(venta.subtotal).toFixed(2)}</p>
                <p><strong>IVA (16%):</strong> $${parseFloat(venta.iva).toFixed(2)}</p>
                <p class="receipt-total"><strong>Total:</strong> $${parseFloat(venta.total).toFixed(2)}</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(saleDetailsModal);
    
    // Show the modal
    saleDetailsModal.style.display = 'block';
    
    // Close modal when clicking the X
    saleDetailsModal.querySelector('.close').addEventListener('click', function() {
        saleDetailsModal.style.display = 'none';
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === saleDetailsModal) {
            saleDetailsModal.style.display = 'none';
        }
    });
}

/**
 * Generates a chart for the sales report
 * @param {Array} ventas - Array of sales objects
 */
function generateSalesReportChart(ventas) {
    // Hide placeholder
    document.querySelector('.report-container .chart-placeholder').style.display = 'none';
    
    // Get chart container
    const chartContainer = document.querySelector('.report-container');
    
    // Check if canvas already exists, remove if it does
    let existingCanvas = chartContainer.querySelector('canvas');
    if (existingCanvas) {
        chartContainer.removeChild(existingCanvas);
    }
    
    // If no sales data, show message and return
    if (ventas.length === 0) {
        const noDataMsg = document.createElement('div');
        noDataMsg.textContent = 'No hay datos de ventas para mostrar';
        noDataMsg.style.textAlign = 'center';
        noDataMsg.style.padding = '20px';
        noDataMsg.style.color = '#666';
        chartContainer.insertBefore(noDataMsg, chartContainer.firstChild);
        return;
    }
    
    // Group and aggregate sales data by date
    const salesByDate = {};
    ventas.forEach(venta => {
        const date = new Date(venta.fecha).toLocaleDateString();
        if (!salesByDate[date]) {
            salesByDate[date] = 0;
        }
        salesByDate[date] += parseFloat(venta.total);
    });
    
    // Convert to arrays for the chart
    const labels = Object.keys(salesByDate);
    const data = Object.values(salesByDate);
    
    // Create canvas element
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 300;
    canvas.style.marginBottom = '20px';
    chartContainer.insertBefore(canvas, chartContainer.firstChild);
    
    // Draw chart directly using the canvas API
    const ctx = canvas.getContext('2d');
    
    // Set up chart dimensions
    const chartWidth = canvas.width - 60; // Left padding for y-axis
    const chartHeight = canvas.height - 40; // Bottom padding for x-axis
    const barWidth = Math.max(20, Math.min(40, chartWidth / labels.length - 10));
    const maxValue = Math.max(...data) * 1.1; // Add 10% padding at top
    
    // Draw chart background
    ctx.fillStyle = '#f9f9f9';
    ctx.fillRect(60, 0, chartWidth, chartHeight);
    
    // Draw y-axis
    ctx.beginPath();
    ctx.moveTo(60, 0);
    ctx.lineTo(60, chartHeight);
    ctx.strokeStyle = '#ccc';
    ctx.stroke();
    
    // Draw y-axis labels
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    const yLabelCount = 5;
    for (let i = 0; i <= yLabelCount; i++) {
        const value = (maxValue / yLabelCount) * i;
        const y = chartHeight - (chartHeight * (value / maxValue));
        ctx.fillText('$' + value.toFixed(2), 55, y + 4);
        
        // Draw horizontal grid line
        ctx.beginPath();
        ctx.moveTo(60, y);
        ctx.lineTo(60 + chartWidth, y);
        ctx.strokeStyle = '#eee';
        ctx.stroke();
    }
    
    // Draw bars and x-axis labels
    labels.forEach((label, i) => {
        const x = 60 + (i * (chartWidth / labels.length)) + ((chartWidth / labels.length - barWidth) / 2);
        const barHeight = (data[i] / maxValue) * chartHeight;
        const y = chartHeight - barHeight;
        
        // Draw bar
        const gradient = ctx.createLinearGradient(0, y, 0, chartHeight);
        gradient.addColorStop(0, '#6B4F4F');
        gradient.addColorStop(1, '#A99292');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // Add hover effect (we can't actually do this with canvas, but this is where we would)
        
        // Draw value above bar
        ctx.fillStyle = '#6B4F4F';
        ctx.textAlign = 'center';
        ctx.fillText('$' + data[i].toFixed(2), x + barWidth/2, y - 5);
        
        // Draw x-axis label
        ctx.fillStyle = '#666';
        ctx.fillText(label, x + barWidth/2, chartHeight + 20);
    });
    
    // Add chart title
    ctx.fillStyle = '#333';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Ventas por Fecha', canvas.width / 2, 20);
}

/**
 * Shows demo sales data when offline
 */
function showDemoSalesData() {
    const demoSales = [
        { id: 1, fecha: '2023-06-15 09:30:00', total: 150.75, metodo_pago: 'efectivo', vendedor: 'Empleado Demo' },
        { id: 2, fecha: '2023-06-15 11:45:00', total: 89.50, metodo_pago: 'tarjeta', vendedor: 'Empleado Demo' },
        { id: 3, fecha: '2023-06-16 14:20:00', total: 210.30, metodo_pago: 'efectivo', vendedor: 'Empleado Demo' },
        { id: 4, fecha: '2023-06-16 16:30:00', total: 45.00, metodo_pago: 'tarjeta', vendedor: 'Empleado Demo' },
        { id: 5, fecha: '2023-06-17 10:15:00', total: 132.80, metodo_pago: 'efectivo', vendedor: 'Empleado Demo' },
    ];
    
    displaySales(demoSales);
    generateSalesReportChart(demoSales);
    showNotification('Mostrando datos de demostración (modo sin conexión)', 'warning');
}

/**
 * Displays notification messages
 * @param {string} message - Message to display
 * @param {string} type - Notification type (success, error, warning)
 */
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
    notification.style.backgroundColor = 
        type === 'success' ? '#4CAF50' : 
        type === 'error' ? '#F44336' : 
        type === 'warning' ? '#FF9800' : '#2196F3';
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