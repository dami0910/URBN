<?php
// Start the session
session_start();

// Check if user is already logged in
if (isset($_SESSION['user'])) {
    // Redirect based on role
    if ($_SESSION['user']['rol'] === 'admin') {
        header('Location: admin.php');
        exit;
    } else if ($_SESSION['user']['rol'] === 'empleado') {
        header('Location: empleado.php');
        exit;
    } else {
        // If role is unknown or invalid, destroy the session
        session_unset();
        session_destroy();
    }
}

// Include the login HTML for non-authenticated users
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PUNTO URBN - Login</title>
    <link rel="stylesheet" href="css/estilos.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
<body class="login-page">
    <div class="login-container">
        <div class="logo">
            <img src="logo_URBN.png" alt="URBN Logo" width="120" class="pulse">
            <h1>PUNTO URBN</h1>
        </div>
        <div class="login-form">
            <h2>Iniciar Sesión</h2>
            <form id="loginForm">
                <div class="form-group">
                    <label for="username">Usuario</label>
                    <input type="text" id="username" name="username" required autocomplete="username" placeholder="Ingresa tu nombre de usuario">
                </div>
                <div class="form-group">
                    <label for="password">Contraseña</label>
                    <input type="password" id="password" name="password" required autocomplete="current-password" placeholder="Ingresa tu contraseña">
                </div>
                <div class="form-group">
                    <button type="submit" class="btn btn-primary">Ingresar <span class="btn-icon">→</span></button>
                </div>
                <div id="loginMessage" class="message"></div>
            </form>
        </div>
    </div>
    <script src="js/auth.js"></script>
</body>
</html>