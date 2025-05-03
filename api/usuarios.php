<?php
// Start the session
session_start();

// Check if user is authenticated and is admin
if (!isset($_SESSION['user']) || $_SESSION['user']['rol'] !== 'admin') {
    http_response_code(403); // Forbidden
    echo json_encode([
        'success' => false,
        'message' => 'Acceso denegado'
    ]);
    exit;
}

// Este archivo manejaría las operaciones CRUD para usuarios
// Para un entorno real, aquí iría la lógica de base de datos

require_once '../db.php';
header('Content-Type: application/json');

// Función para obtener todos los usuarios
function getUsers() {
    global $pdo;
    
    try {
        $stmt = $pdo->query('SELECT id, nombre, usuario, rol FROM usuarios ORDER BY nombre');
        $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'data' => $usuarios
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error al obtener usuarios: ' . $e->getMessage()
        ]);
    }
}

// Función para obtener un usuario por ID
function getUser($id) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare('SELECT id, nombre, usuario, rol FROM usuarios WHERE id = ?');
        $stmt->execute([$id]);
        $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($usuario) {
            echo json_encode([
                'success' => true,
                'data' => $usuario
            ]);
        } else {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Usuario no encontrado'
            ]);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error al obtener usuario: ' . $e->getMessage()
        ]);
    }
}

// Función para crear un nuevo usuario
function createUser() {
    global $pdo;
    
    // Obtener datos POST
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Validar datos requeridos
    if (!isset($data['nombre']) || !isset($data['usuario']) || !isset($data['password']) || !isset($data['rol'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Faltan datos requeridos'
        ]);
        return;
    }
    
    try {
        // Verificar si el nombre de usuario ya existe
        $stmt = $pdo->prepare('SELECT id FROM usuarios WHERE usuario = ?');
        $stmt->execute([$data['usuario']]);
        
        if ($stmt->fetch()) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'El nombre de usuario ya existe'
            ]);
            return;
        }
        
        // Hash de la contraseña
        $passwordHash = password_hash($data['password'], PASSWORD_DEFAULT);
        
        $stmt = $pdo->prepare('INSERT INTO usuarios (nombre, usuario, password, rol) VALUES (?, ?, ?, ?)');
        $stmt->execute([
            $data['nombre'],
            $data['usuario'],
            $passwordHash,
            $data['rol']
        ]);
        
        $id = $pdo->lastInsertId();
        
        echo json_encode([
            'success' => true,
            'message' => 'Usuario creado correctamente',
            'data' => [
                'id' => $id,
                'nombre' => $data['nombre'],
                'usuario' => $data['usuario'],
                'rol' => $data['rol']
            ]
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error al crear usuario: ' . $e->getMessage()
        ]);
    }
}

// Función para actualizar un usuario
function updateUser($id) {
    global $pdo;
    
    // Obtener datos PUT
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Validar que existan datos para actualizar
    if (empty($data)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'No hay datos para actualizar'
        ]);
        return;
    }
    
    try {
        // Verificar si el usuario existe
        $stmt = $pdo->prepare('SELECT id FROM usuarios WHERE id = ?');
        $stmt->execute([$id]);
        
        if (!$stmt->fetch()) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Usuario no encontrado'
            ]);
            return;
        }
        
        // Si se actualiza el nombre de usuario, verificar que no exista
        if (isset($data['usuario'])) {
            $stmt = $pdo->prepare('SELECT id FROM usuarios WHERE usuario = ? AND id != ?');
            $stmt->execute([$data['usuario'], $id]);
            
            if ($stmt->fetch()) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'El nombre de usuario ya existe'
                ]);
                return;
            }
        }
        
        // Construir consulta de actualización
        $fields = [];
        $values = [];
        
        foreach ($data as $key => $value) {
            if (in_array($key, ['nombre', 'usuario', 'rol'])) {
                $fields[] = "$key = ?";
                $values[] = $value;
            } elseif ($key === 'password' && !empty($value)) {
                $fields[] = "password = ?";
                $values[] = password_hash($value, PASSWORD_DEFAULT);
            }
        }
        
        if (empty($fields)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'No hay campos válidos para actualizar'
            ]);
            return;
        }
        
        $values[] = $id; // Para la condición WHERE
        
        $sql = 'UPDATE usuarios SET ' . implode(', ', $fields) . ' WHERE id = ?';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($values);
        
        echo json_encode([
            'success' => true,
            'message' => 'Usuario actualizado correctamente'
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error al actualizar usuario: ' . $e->getMessage()
        ]);
    }
}

// Función para eliminar un usuario
function deleteUser($id) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare('DELETE FROM usuarios WHERE id = ?');
        $stmt->execute([$id]);
        
        if ($stmt->rowCount() > 0) {
            echo json_encode([
                'success' => true,
                'message' => 'Usuario eliminado correctamente'
            ]);
        } else {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Usuario no encontrado'
            ]);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error al eliminar usuario: ' . $e->getMessage()
        ]);
    }
}

// Procesar la solicitud según el método HTTP
switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        if (isset($_GET['id'])) {
            getUser($_GET['id']);
        } else {
            getUsers();
        }
        break;
        
    case 'POST':
        createUser();
        break;
        
    case 'PUT':
        if (isset($_GET['id'])) {
            updateUser($_GET['id']);
        } else {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Se requiere ID del usuario'
            ]);
        }
        break;
        
    case 'DELETE':
        if (isset($_GET['id'])) {
            deleteUser($_GET['id']);
        } else {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Se requiere ID del usuario'
            ]);
        }
        break;
        
    default:
        http_response_code(405); // Method Not Allowed
        echo json_encode([
            'success' => false,
            'message' => 'Método no permitido'
        ]);
}