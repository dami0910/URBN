<?php
// Iniciar la sesion
session_start();

// This file is responsible for processing login requests
require_once '../db.php';

header('Content-Type: application/json');

// Check for logout action
if (isset($_GET['action']) && $_GET['action'] === 'logout') {
    // Destroy session properly
    session_unset();
    session_destroy();
    
    // Set cookie expiration to past time to ensure they're deleted
    if (isset($_COOKIE[session_name()])) {
        setcookie(session_name(), '', time()-42000, '/');
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Sesión cerrada correctamente'
    ]);
    exit;
}

// Verify method and data
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get POST data
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Datos de solicitud inválidos'
        ]);
        exit;
    }
    
    if (isset($data['username']) && isset($data['password'])) {
        $username = $data['username'];
        $password = $data['password'];
        
        try {
            // Query user from database
            $stmt = $pdo->prepare('SELECT id, nombre, usuario, password, rol FROM usuarios WHERE usuario = ?');
            $stmt->execute([$username]);
            $user = $stmt->fetch();
            
            if ($user) {
                // In a real system, we would use password_verify to check hashed passwords
                // For demo purposes, we're doing a direct comparison
                if ($password === $user['password']) {
                    // User authenticated successfully
                    
                    // Create array with user information without the password
                    $userInfo = [
                        'id' => $user['id'],
                        'nombre' => $user['nombre'],
                        'usuario' => $user['usuario'],
                        'rol' => $user['rol']
                    ];
                    
                    // Save in session
                    $_SESSION['user'] = $userInfo;
                    
                    // Successful response
                    echo json_encode([
                        'success' => true,
                        'message' => 'Inicio de sesión exitoso',
                        'user' => $userInfo
                    ]);
                    exit;
                }
            }
            
            // If we get here, the user doesn't exist or the password is incorrect
            http_response_code(401); // Unauthorized
            echo json_encode([
                'success' => false,
                'message' => 'Usuario o contraseña incorrectos'
            ]);
            exit;
            
        } catch (PDOException $e) {
            // Database error
            http_response_code(500); // Internal Server Error
            echo json_encode([
                'success' => false,
                'message' => 'Error del servidor: ' . $e->getMessage()
            ]);
            exit;
        }
    } else {
        http_response_code(400); // Bad Request
        echo json_encode([
            'success' => false,
            'message' => 'Falta nombre de usuario o contraseña'
        ]);
        exit;
    }
}

// If it gets here, the request is invalid
http_response_code(400); // Bad Request
echo json_encode([
    'success' => false,
    'message' => 'Solicitud inválida'
]);
?>