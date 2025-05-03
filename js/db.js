// Simulación de conexión a la base de datos mediante localStorage
class DbConnection {
    constructor() {
        this.initializeDatabase();
    }
    
    // Inicializar base de datos si no existe
    initializeDatabase() {
        if (!localStorage.getItem('db_initialized')) {
            // Tabla de usuarios
            if (!localStorage.getItem('usuarios')) {
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
            
            // Tabla de productos
            if (!localStorage.getItem('productos')) {
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
            
            // Tabla de ventas
            if (!localStorage.getItem('ventas')) {
                localStorage.setItem('ventas', JSON.stringify([]));
            }
            
            // Marcar como inicializada
            localStorage.setItem('db_initialized', 'true');
        }
    }
    
    // Métodos para usuarios
    getUsers() {
        return JSON.parse(localStorage.getItem('usuarios'));
    }
    
    getUserById(id) {
        const users = this.getUsers();
        return users.find(user => user.id === id);
    }
    
    getUserByUsername(username) {
        const users = this.getUsers();
        return users.find(user => user.usuario === username);
    }
    
    addUser(user) {
        const users = this.getUsers();
        // Generar nuevo ID
        const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
        user.id = newId;
        
        users.push(user);
        localStorage.setItem('usuarios', JSON.stringify(users));
        return user;
    }
    
    updateUser(id, userData) {
        const users = this.getUsers();
        const index = users.findIndex(user => user.id === id);
        
        if (index !== -1) {
            users[index] = { ...users[index], ...userData };
            localStorage.setItem('usuarios', JSON.stringify(users));
            return users[index];
        }
        
        return null;
    }
    
    deleteUser(id) {
        const users = this.getUsers();
        const index = users.findIndex(user => user.id === id);
        
        if (index !== -1) {
            users.splice(index, 1);
            localStorage.setItem('usuarios', JSON.stringify(users));
            return true;
        }
        
        return false;
    }
    
    // Métodos para productos
    getProducts() {
        return JSON.parse(localStorage.getItem('productos'));
    }
    
    getProductById(id) {
        const products = this.getProducts();
        return products.find(product => product.id === id);
    }
    
    getProductsByCategory(category) {
        const products = this.getProducts();
        return products.filter(product => product.categoria === category);
    }
    
    addProduct(product) {
        const products = this.getProducts();
        // Generar nuevo ID
        const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
        product.id = newId;
        
        products.push(product);
        localStorage.setItem('productos', JSON.stringify(products));
        return product;
    }
    
    updateProduct(id, productData) {
        const products = this.getProducts();
        const index = products.findIndex(product => product.id === id);
        
        if (index !== -1) {
            products[index] = { ...products[index], ...productData };
            localStorage.setItem('productos', JSON.stringify(products));
            return products[index];
        }
        
        return null;
    }
    
    deleteProduct(id) {
        const products = this.getProducts();
        const index = products.findIndex(product => product.id === id);
        
        if (index !== -1) {
            products.splice(index, 1);
            localStorage.setItem('productos', JSON.stringify(products));
            return true;
        }
        
        return false;
    }
    
    // Métodos para ventas
    getSales() {
        return JSON.parse(localStorage.getItem('ventas'));
    }
    
    getSaleById(id) {
        const sales = this.getSales();
        return sales.find(sale => sale.id === id);
    }
    
    getSalesByDate(startDate, endDate) {
        const sales = this.getSales();
        return sales.filter(sale => {
            const saleDate = new Date(sale.fecha);
            return saleDate >= startDate && saleDate <= endDate;
        });
    }
    
    addSale(sale) {
        const sales = this.getSales();
        // Generar nuevo ID
        sale.id = Date.now();
        sale.fecha = new Date().toISOString();
        
        sales.push(sale);
        localStorage.setItem('ventas', JSON.stringify(sales));
        return sale;
    }
}

// Exportar instancia
const db = new DbConnection();