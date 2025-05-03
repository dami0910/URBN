// Admin dashboard module
// Handles dashboard data loading and display

/**
 * Initializes the admin dashboard with data
 */
export function initAdminDashboard() {
    loadDashboardData();
    loadSalesAnalysis();
    loadInventoryData();
    
    // Setup refresh button if it exists
    const refreshBtn = document.getElementById('refreshDashboardBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            loadDashboardData();
            loadSalesAnalysis();
            loadInventoryData();
        });
    }
}

/**
 * Loads dashboard data from the server or falls back to local storage
 */
function loadDashboardData() {
    // AJAX request to get dashboard data
    fetch('api/ventas.php?action=dashboard_summary')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Update executive summary
                document.getElementById('totalSales').textContent = '$' + formatNumber(data.data.totalSales || 0);
                document.getElementById('totalOrders').textContent = formatNumber(data.data.totalOrders || 0);
                document.getElementById('activeCustomers').textContent = formatNumber(data.data.activeCustomers || 0);
                document.getElementById('averageOrderValue').textContent = '$' + formatNumber(data.data.averageOrderValue || 0);
            }
        })
        .catch(error => {
            console.error('Error loading dashboard summary:', error);
            // Fallback to demo data
            const demoData = {
                totalSales: 25890.50,
                totalOrders: 342,
                activeCustomers: 78,
                averageOrderValue: 75.70
            };
            
            document.getElementById('totalSales').textContent = '$' + formatNumber(demoData.totalSales);
            document.getElementById('totalOrders').textContent = formatNumber(demoData.totalOrders);
            document.getElementById('activeCustomers').textContent = formatNumber(demoData.activeCustomers);
            document.getElementById('averageOrderValue').textContent = '$' + formatNumber(demoData.averageOrderValue);
        });
}

/**
 * Loads sales analysis data and renders charts
 */
function loadSalesAnalysis() {
    // Load data for sales by category
    fetch('api/ventas.php?action=sales_by_category')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                renderCategoryChart(data.data);
            }
        })
        .catch(error => {
            console.error('Error loading sales by category:', error);
            // Fallback to demo data
            const demoData = [
                {category: 'Café', sales: 12500},
                {category: 'Comida', sales: 8350},
                {category: 'Postre', sales: 5040}
            ];
            renderCategoryChart(demoData);
        });
    
    // Load data for sales trend
    fetch('api/ventas.php?action=sales_trend')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                renderSalesTrendChart(data.data);
            }
        })
        .catch(error => {
            console.error('Error loading sales trend:', error);
            // Fallback to demo data
            const demoData = [
                {month: 'Ene', sales: 3200},
                {month: 'Feb', sales: 3500},
                {month: 'Mar', sales: 3800},
                {month: 'Abr', sales: 4100},
                {month: 'May', sales: 4500},
                {month: 'Jun', sales: 4800}
            ];
            renderSalesTrendChart(demoData);
        });
    
    // Load top products
    fetch('api/ventas.php?action=top_products')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                renderTopProducts(data.data);
            }
        })
        .catch(error => {
            console.error('Error loading top products:', error);
            // Fallback to demo data
            const demoData = [
                {name: 'Café Americano', quantity: 380, amount: 9500},
                {name: 'Cappuccino', quantity: 310, amount: 10850},
                {name: 'Latte', quantity: 250, amount: 8000},
                {name: 'Sandwich de Jamón', quantity: 180, amount: 8100},
                {name: 'Pastel de Chocolate', quantity: 150, amount: 6000}
            ];
            renderTopProducts(demoData);
        });
}

/**
 * Loads inventory data
 */
function loadInventoryData() {
    fetch('api/productos.php?action=inventory')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                renderInventoryTable(data.data);
            }
        })
        .catch(error => {
            console.error('Error loading inventory data:', error);
            // Fallback to demo data
            const demoData = [
                {name: 'Café Americano', category: 'Café', stock: 120, status: 'normal', rotation: 'alta'},
                {name: 'Cappuccino', category: 'Café', stock: 80, status: 'normal', rotation: 'alta'},
                {name: 'Latte', category: 'Café', stock: 65, status: 'normal', rotation: 'alta'},
                {name: 'Muffin de Arándanos', category: 'Postre', stock: 12, status: 'bajo', rotation: 'media'},
                {name: 'Croissant', category: 'Comida', stock: 8, status: 'crítico', rotation: 'alta'},
                {name: 'Sandwich de Jamón', category: 'Comida', stock: 25, status: 'normal', rotation: 'media'},
                {name: 'Pastel de Chocolate', category: 'Postre', stock: 18, status: 'bajo', rotation: 'alta'}
            ];
            renderInventoryTable(demoData);
        });
}

/**
 * Renders the category sales chart
 * @param {Array} data - Category sales data
 */
function renderCategoryChart(data) {
    const chartContainer = document.getElementById('categoryChart');
    
    // Clear previous content
    chartContainer.innerHTML = '';
    
    // Simple visual chart (bar chart)
    const maxSales = Math.max(...data.map(item => item.sales));
    
    const chartHtml = `
        <div class="simple-bar-chart">
            ${data.map(item => `
                <div class="chart-item">
                    <div class="chart-label">${item.category}</div>
                    <div class="chart-bar" style="width: ${(item.sales / maxSales * 100)}%;">
                        <span class="chart-value">$${formatNumber(item.sales)}</span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    chartContainer.innerHTML = chartHtml;
}

/**
 * Renders the sales trend chart
 * @param {Array} data - Monthly sales data
 */
function renderSalesTrendChart(data) {
    const chartContainer = document.getElementById('salesTrendChart');
    
    // Clear previous content
    chartContainer.innerHTML = '';
    
    // Calculate dimensions
    const containerWidth = chartContainer.clientWidth || 400;
    const containerHeight = 200;
    const paddingX = 40;
    const paddingY = 40;
    const chartWidth = containerWidth - (paddingX * 2);
    const chartHeight = containerHeight - (paddingY * 2);
    
    // Create SVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', containerWidth);
    svg.setAttribute('height', containerHeight);
    
    // Calculate scales
    const maxSales = Math.max(...data.map(item => item.sales));
    const points = data.map((item, index) => {
        const x = paddingX + (index / (data.length - 1)) * chartWidth;
        const y = paddingY + chartHeight - (item.sales / maxSales * chartHeight);
        return `${x},${y}`;
    }).join(' ');
    
    // Draw line
    const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    polyline.setAttribute('points', points);
    polyline.setAttribute('fill', 'none');
    polyline.setAttribute('stroke', '#6B4F4F');
    polyline.setAttribute('stroke-width', '3');
    svg.appendChild(polyline);
    
    // Draw dots
    data.forEach((item, index) => {
        const x = paddingX + (index / (data.length - 1)) * chartWidth;
        const y = paddingY + chartHeight - (item.sales / maxSales * chartHeight);
        
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', x);
        circle.setAttribute('cy', y);
        circle.setAttribute('r', '5');
        circle.setAttribute('fill', '#FFD700');
        circle.setAttribute('stroke', '#6B4F4F');
        circle.setAttribute('stroke-width', '2');
        
        // Tooltip
        const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        title.textContent = `${item.month}: $${formatNumber(item.sales)}`;
        circle.appendChild(title);
        
        svg.appendChild(circle);
        
        // Draw month label
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x);
        text.setAttribute('y', containerHeight - 10);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '12');
        text.textContent = item.month;
        svg.appendChild(text);
    });
    
    // Draw y-axis labels
    const yLabels = [0, maxSales / 2, maxSales];
    yLabels.forEach((value, index) => {
        const y = paddingY + chartHeight - (index / (yLabels.length - 1)) * chartHeight;
        
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', paddingX - 5);
        text.setAttribute('y', y + 5);
        text.setAttribute('text-anchor', 'end');
        text.setAttribute('font-size', '12');
        text.textContent = `$${formatNumber(value)}`;
        svg.appendChild(text);
    });
    
    chartContainer.appendChild(svg);
}

/**
 * Renders the top products list
 * @param {Array} data - Top products data
 */
function renderTopProducts(data) {
    const listElement = document.getElementById('topProductsList');
    
    // Clear previous content
    listElement.innerHTML = '';
    
    if (data.length === 0) {
        listElement.innerHTML = '<li class="placeholder-item">No hay datos disponibles</li>';
        return;
    }
    
    data.forEach((product, index) => {
        const li = document.createElement('li');
        li.className = 'top-product-item';
        li.innerHTML = `
            <div class="rank">${index + 1}</div>
            <div class="product-info">
                <div class="product-name">${product.name}</div>
                <div class="product-stats">
                    <span class="quantity">${product.quantity} unidades</span>
                    <span class="amount">$${formatNumber(product.amount)}</span>
                </div>
            </div>
        `;
        listElement.appendChild(li);
    });
}

/**
 * Renders the inventory table
 * @param {Array} data - Inventory data
 */
function renderInventoryTable(data) {
    const tableBody = document.querySelector('#inventoryTable tbody');
    
    // Clear previous content
    tableBody.innerHTML = '';
    
    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No hay datos de inventario disponibles</td></tr>';
        return;
    }
    
    data.forEach(item => {
        const tr = document.createElement('tr');
        
        // Determine status class
        let statusClass = 'status-normal';
        if (item.status === 'bajo') {
            statusClass = 'status-warning';
        } else if (item.status === 'crítico') {
            statusClass = 'status-critical';
        }
        
        tr.innerHTML = `
            <td>${item.name}</td>
            <td>${item.category}</td>
            <td>${item.stock} unid.</td>
            <td><span class="status-badge ${statusClass}">${item.status}</span></td>
            <td>${item.rotation}</td>
        `;
        
        tableBody.appendChild(tr);
    });
}

/**
 * Helper function to format numbers
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
function formatNumber(num) {
    return num.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}