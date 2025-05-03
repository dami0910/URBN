// Admin users module
// Handles user management functionality

/**
 * Initializes the users management section
 */
export function initUsersManager() {
    loadUsersData();
    setupUserModals();
}

/**
 * Loads user data from the server
 */
function loadUsersData() {
    // Show loading indicator
    const tbody = document.querySelector('#usuariosTable tbody');
    tbody.innerHTML = '<tr><td colspan="5" class="text-center">Cargando usuarios...</td></tr>';
    
    // AJAX request to get users
    fetch('api/usuarios.php')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                displayUsers(data.data);
            } else {
                throw new Error(data.message || 'Error fetching users');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            tbody.innerHTML = `<tr><td colspan="5" class="text-center">Error al cargar usuarios: ${error.message}</td></tr>`;
            
            // Fallback to local data if available
            const usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
            if (usuarios.length > 0) {
                displayUsers(usuarios);
            }
        });
}

/**
 * Displays users data in the users table
 * @param {Array} usuarios - Array of user objects
 */
function displayUsers(usuarios) {
    const tbody = document.querySelector('#usuariosTable tbody');
    tbody.innerHTML = '';
    
    usuarios.forEach(usuario => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${usuario.id}</td>
            <td>${usuario.nombre}</td>
            <td>${usuario.usuario}</td>
            <td>${usuario.rol === 'admin' ? 'Administrador' : 'Empleado'}</td>
            <td>
                <button class="btn btn-secondary edit-user" data-id="${usuario.id}">Editar</button>
                <button class="btn btn-secondary delete-user" data-id="${usuario.id}">Eliminar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

/**
 * Sets up user modals and related event handlers
 */
function setupUserModals() {
    // Set up user modal
    const userModal = document.getElementById('userModal');
    const userForm = document.getElementById('userForm');
    const closeUserBtn = userModal.querySelector('.close');
    
    document.getElementById('addUserBtn').addEventListener('click', function() {
        // Reset form
        userForm.reset();
        userForm.dataset.mode = 'add';
        userForm.dataset.id = '';
        userModal.querySelector('h2').textContent = 'Agregar Usuario';
        
        // Show modal
        userModal.style.display = 'block';
    });
    
    closeUserBtn.addEventListener('click', function() {
        userModal.style.display = 'none';
    });
    
    userForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Form data
        const userData = {
            nombre: document.getElementById('userName').value,
            usuario: document.getElementById('userUsername').value,
            password: document.getElementById('userPassword').value,
            rol: document.getElementById('userRole').value
        };
        
        let url = 'api/usuarios.php';
        let method = 'POST';
        
        if (this.dataset.mode === 'edit') {
            const id = parseInt(this.dataset.id);
            url += `?id=${id}`;
            method = 'PUT';
            
            // If password is empty for edit, don't send it
            if (!userData.password) {
                delete userData.password;
            }
        }
        
        // Show loading/processing message
        const submitBtn = userForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;
        submitBtn.textContent = 'Guardando...';
        submitBtn.disabled = true;
        
        // AJAX request to save user
        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                loadUsersData(); // Refresh users table
                userModal.style.display = 'none';
                showNotification(data.message, 'success');
            } else {
                throw new Error(data.message || 'Error al guardar usuario');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification(error.message, 'error');
            
            // Fallback to localStorage for demo only if network is completely unavailable
            if (!navigator.onLine) {
                handleLocalUserSave(this.dataset.mode, this.dataset.id);
            }
        })
        .finally(() => {
            // Reset button
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
        });
    });
    
    // Set up edit/delete user events using event delegation
    document.querySelector('#usuariosTable').addEventListener('click', function(e) {
        // Edit user
        if (e.target.classList.contains('edit-user')) {
            const id = parseInt(e.target.dataset.id);
            
            // Show loading indicator
            e.target.textContent = 'Cargando...';
            e.target.disabled = true;
            
            // AJAX request to get user details
            fetch(`api/usuarios.php?id=${id}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.success) {
                        fillUserForm(data.data, id);
                    } else {
                        throw new Error(data.message || 'Error al obtener usuario');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    showNotification(error.message, 'error');
                    
                    // Fallback to local data if available
                    const usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
                    const usuario = usuarios.find(u => u.id === id);
                    if (usuario) {
                        fillUserForm(usuario, id);
                    }
                })
                .finally(() => {
                    // Reset button
                    e.target.textContent = 'Editar';
                    e.target.disabled = false;
                });
        }
        
        // Delete user
        if (e.target.classList.contains('delete-user')) {
            const id = parseInt(e.target.dataset.id);
            
            // Don't allow deleting the current user
            const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};
            if (currentUser.id === id) {
                showNotification('No puede eliminar su propio usuario', 'error');
                return;
            }
            
            if (confirm('¿Está seguro de eliminar este usuario?')) {
                // Show loading indicator
                e.target.textContent = 'Eliminando...';
                e.target.disabled = true;
                
                // AJAX request to delete user
                fetch(`api/usuarios.php?id=${id}`, {
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
                        loadUsersData(); // Refresh users table
                        showNotification(data.message, 'success');
                    } else {
                        throw new Error(data.message || 'Error al eliminar usuario');
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
                        const usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
                        const index = usuarios.findIndex(u => u.id === id);
                        if (index !== -1) {
                            usuarios.splice(index, 1);
                            localStorage.setItem('usuarios', JSON.stringify(usuarios));
                            loadUsersData();
                            showNotification('Usuario eliminado correctamente', 'success');
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
 * Fills the user form with existing user data for editing
 * @param {Object} usuario - User object to edit
 * @param {number} id - User ID
 */
function fillUserForm(usuario, id) {
    document.getElementById('userName').value = usuario.nombre;
    document.getElementById('userUsername').value = usuario.usuario;
    document.getElementById('userPassword').value = ''; // Don't show password
    document.getElementById('userRole').value = usuario.rol;
    
    const userForm = document.getElementById('userForm');
    const userModal = document.getElementById('userModal');
    
    userForm.dataset.mode = 'edit';
    userForm.dataset.id = id;
    userModal.querySelector('h2').textContent = 'Editar Usuario';
    
    userModal.style.display = 'block';
}

/**
 * Handles local user save when the API fails
 * @param {string} mode - 'add' or 'edit'
 * @param {string} id - User ID for edit mode
 */
function handleLocalUserSave(mode, id) {
    const name = document.getElementById('userName').value;
    const username = document.getElementById('userUsername').value;
    const password = document.getElementById('userPassword').value;
    const role = document.getElementById('userRole').value;
    
    const usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
    
    if (mode === 'add') {
        // Verify that the username doesn't exist
        if (usuarios.some(u => u.usuario === username)) {
            showNotification('El nombre de usuario ya existe', 'error');
            return;
        }
        
        // Add new user
        const newId = usuarios.length > 0 ? Math.max(...usuarios.map(u => u.id)) + 1 : 1;
        usuarios.push({
            id: newId,
            nombre: name,
            usuario: username,
            password: password,
            rol: role
        });
    } else {
        // Edit existing user
        const idInt = parseInt(id);
        const index = usuarios.findIndex(u => u.id === idInt);
        if (index !== -1) {
            // Verify that the username doesn't exist (if changed)
            if (username !== usuarios[index].usuario && 
                usuarios.some(u => u.usuario === username)) {
                showNotification('El nombre de usuario ya existe', 'error');
                return;
            }
            
            usuarios[index].nombre = name;
            usuarios[index].usuario = username;
            if (password) {
                usuarios[index].password = password;
            }
            usuarios[index].rol = role;
        }
    }
    
    localStorage.setItem('usuarios', JSON.stringify(usuarios));
    loadUsersData();
    document.getElementById('userModal').style.display = 'none';
    showNotification(mode === 'add' ? 'Usuario agregado correctamente' : 'Usuario actualizado correctamente', 'success');
}