// Authentication related functions

// Login functionality using fetch API
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const messageEl = document.getElementById('loginMessage');
            
            // Clear previous messages
            messageEl.textContent = '';
            messageEl.className = 'message';
            
            // Show loading indicator
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<svg class="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" opacity="0.25"></circle><path d="M12 2a10 10 0 0 1 10 10" opacity="1"></path></svg> Verificando...';
            submitBtn.disabled = true;
            
            // Verify credentials using the API
            fetch('api/login.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
                credentials: 'include' // Important: send cookies with the request
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error de conexión al servidor');
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    // Save user info to localStorage for client-side access
                    localStorage.setItem('currentUser', JSON.stringify(data.user));
                    
                    messageEl.textContent = '¡Inicio de sesión exitoso! Redireccionando...';
                    messageEl.className = 'message success';
                    
                    // Redirect based on role after a short delay
                    setTimeout(() => {
                        if (data.user.rol === 'admin') {
                            window.location.href = 'admin.php';
                        } else {
                            window.location.href = 'empleado.php';
                        }
                    }, 800);
                } else {
                    messageEl.textContent = data.message || 'Usuario o contraseña incorrectos';
                    messageEl.className = 'message error';
                    // Reset button
                    submitBtn.innerHTML = originalBtnText;
                    submitBtn.disabled = false;
                }
            })
            .catch(error => {
                console.error('Error:', error);
                messageEl.textContent = 'Error de conexión. Por favor intente nuevamente.';
                messageEl.className = 'message error';
                // Reset button
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
            });
        });
    }
    
    // Set up logout button if it exists on the page
    setupLogout();
}); 

// Handle logout with AJAX
function setupLogout() {
    const logoutBtn = document.getElementById('logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Show loading state
            const originalContent = this.innerHTML;
            this.innerHTML = '<svg class="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" opacity="0.25"></circle><path d="M12 2a10 10 0 0 1 10 10" opacity="1"></path></svg> Cerrando sesión...';
            this.style.pointerEvents = 'none';
            this.style.opacity = '0.7';
            
            // AJAX request to logout
            fetch('api/login.php?action=logout', {
                credentials: 'include' // Important: send cookies with the request
            })
            .then(response => response.json())
            .then(data => {
                // Clear local storage user data
                localStorage.removeItem('currentUser');
                // Redirect to login page
                window.location.href = 'index.php';
            })
            .catch(error => {
                console.error('Error:', error);
                // Even if the server request fails, still log out locally
                localStorage.removeItem('currentUser');
                window.location.href = 'index.php';
            });
        });
    }
}

// Add spinner animation
document.head.insertAdjacentHTML('beforeend', `
<style>
.spinner {
    animation: spin 1s linear infinite;
}
@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}
</style>
`);