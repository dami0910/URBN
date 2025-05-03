<?php
// Start the session
session_start();

// Check if user is authenticated
if (!isset($_SESSION['user'])) {
    http_response_code(403); // Forbidden
    echo json_encode([
        'success' => false,
        'message' => 'Acceso denegado'
    ]);
    exit;
}

// Este archivo manejaría las operaciones CRUD para productos
require_once '../db.php';
header('Content-Type: application/json');

// Crear directorio de imágenes si no existe
$uploadDir = '../img/productos/';
if (!file_exists($uploadDir)) {
    if (!mkdir($uploadDir, 0777, true)) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error al crear directorio de imágenes'
        ]);
        exit;
    }
}

// Función para obtener todos los productos
function getProducts() {
    global $pdo;
    
    try {
        $stmt = $pdo->query('SELECT * FROM productos ORDER BY nombre');
        $productos = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'data' => $productos
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error al obtener productos: ' . $e->getMessage()
        ]);
    }
}

// Función para obtener un producto por ID
function getProduct($id) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare('SELECT * FROM productos WHERE id = ?');
        $stmt->execute([$id]);
        $producto = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($producto) {
            echo json_encode([
                'success' => true,
                'data' => $producto
            ]);
        } else {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Producto no encontrado'
            ]);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error al obtener producto: ' . $e->getMessage()
        ]);
    }
}

// Función para manejar la subida de imágenes
function handleImageUpload() {
    global $uploadDir;
    
    // Si no hay imagen subida, usar la predeterminada
    if (!isset($_FILES['imagen']) || $_FILES['imagen']['error'] === UPLOAD_ERR_NO_FILE) {
        return 'img/default.png';
    }
    
    // Verificar errores de subida
    if ($_FILES['imagen']['error'] !== UPLOAD_ERR_OK) {
        $errorMsg = 'Error al subir la imagen: ';
        switch ($_FILES['imagen']['error']) {
            case UPLOAD_ERR_INI_SIZE:
                $errorMsg .= 'El archivo excede el tamaño máximo permitido por el servidor.';
                break;
            case UPLOAD_ERR_FORM_SIZE:
                $errorMsg .= 'El archivo excede el tamaño máximo permitido por el formulario.';
                break;
            case UPLOAD_ERR_PARTIAL:
                $errorMsg .= 'El archivo se subió parcialmente.';
                break;
            case UPLOAD_ERR_NO_TMP_DIR:
                $errorMsg .= 'No se encontró un directorio temporal.';
                break;
            case UPLOAD_ERR_CANT_WRITE:
                $errorMsg .= 'No se pudo escribir el archivo en el disco.';
                break;
            case UPLOAD_ERR_EXTENSION:
                $errorMsg .= 'Una extensión PHP detuvo la carga del archivo.';
                break;
            default:
                $errorMsg .= 'Error desconocido.';
        }
        throw new Exception($errorMsg);
    }
    
    // Obtener información de la imagen
    $tmpName = $_FILES['imagen']['tmp_name'];
    $fileName = $_FILES['imagen']['name'];
    $fileExt = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
    
    // Verificar que sea un tipo de imagen válido
    $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    if (!in_array($fileExt, $allowedExtensions)) {
        throw new Exception('Tipo de archivo no permitido. Solo se aceptan: ' . implode(', ', $allowedExtensions));
    }
    
    // Generar nombre único para la imagen
    $newFileName = uniqid('producto_') . '.' . $fileExt;
    $destination = $uploadDir . $newFileName;
    
    // Mover la imagen al directorio de destino
    if (move_uploaded_file($tmpName, $destination)) {
        return 'img/productos/' . $newFileName;
    } else {
        throw new Exception('Error al mover el archivo subido. Verifica los permisos del directorio.');
    }
}

// Función para crear un nuevo producto
function createProduct() {
    global $pdo;
    
    try {
        // Verificar si todos los campos requeridos están presentes
        if (!isset($_POST['nombre']) || !isset($_POST['precio']) || !isset($_POST['categoria'])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Faltan datos requeridos (nombre, precio, categoria)'
            ]);
            return;
        }
        
        // Obtener otros datos POST
        $nombre = $_POST['nombre'];
        $precio = floatval($_POST['precio']);
        $categoria = $_POST['categoria'];
        
        // Validar datos
        if (empty($nombre)) {
            throw new Exception('El nombre del producto no puede estar vacío');
        }
        
        if ($precio <= 0) {
            throw new Exception('El precio debe ser mayor que cero');
        }
        
        if (!in_array($categoria, ['cafe', 'comida', 'postre'])) {
            throw new Exception('Categoría no válida');
        }
        
        // Manejar subida de imagen
        $imagenPath = handleImageUpload();
        
        // Insertar nuevo producto
        $stmt = $pdo->prepare('INSERT INTO productos (nombre, precio, categoria, imagen) VALUES (?, ?, ?, ?)');
        $stmt->execute([
            $nombre,
            $precio,
            $categoria,
            $imagenPath
        ]);
        
        $id = $pdo->lastInsertId();
        
        echo json_encode([
            'success' => true,
            'message' => 'Producto creado correctamente',
            'data' => [
                'id' => $id,
                'nombre' => $nombre,
                'precio' => $precio,
                'categoria' => $categoria,
                'imagen' => $imagenPath
            ]
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error al crear producto: ' . $e->getMessage()
        ]);
    }
}

// Función para actualizar un producto
function updateProduct($id) {
    global $pdo;
    
    try {
        // Verificar si el producto existe
        $stmt = $pdo->prepare('SELECT imagen FROM productos WHERE id = ?');
        $stmt->execute([$id]);
        $producto = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$producto) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Producto no encontrado'
            ]);
            return;
        }
        
        // Inicializar datos para la actualización
        $nombre = $_POST['nombre'] ?? null;
        $precio = $_POST['precio'] ?? null;
        $categoria = $_POST['categoria'] ?? null;
        
        // Determinar si hay una nueva imagen
        $imagenPath = $producto['imagen']; // Usar la imagen existente por defecto
        
        if (isset($_FILES['imagen']) && $_FILES['imagen']['error'] === UPLOAD_ERR_OK) {
            $imagenPath = handleImageUpload();
            
            // Si hay una imagen anterior que no sea la default, eliminarla
            $oldImagePath = $producto['imagen'];
            if ($oldImagePath !== 'img/default.png' && file_exists('../' . $oldImagePath)) {
                unlink('../' . $oldImagePath);
            }
        }
        
        // Actualizar el producto
        $stmt = $pdo->prepare('UPDATE productos SET nombre = ?, precio = ?, categoria = ?, imagen = ? WHERE id = ?');
        $stmt->execute([
            $nombre,
            $precio,
            $categoria,
            $imagenPath,
            $id
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Producto actualizado correctamente',
            'data' => [
                'id' => $id,
                'nombre' => $nombre,
                'precio' => $precio,
                'categoria' => $categoria,
                'imagen' => $imagenPath
            ]
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error al actualizar producto: ' . $e->getMessage()
        ]);
    }
}

// Función para eliminar un producto
function deleteProduct($id) {
    global $pdo;
    
    try {
        // Primero obtenemos la imagen del producto
        $stmt = $pdo->prepare('SELECT imagen FROM productos WHERE id = ?');
        $stmt->execute([$id]);
        $producto = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$producto) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Producto no encontrado'
            ]);
            return;
        }
        
        // Eliminar el producto de la base de datos
        $stmt = $pdo->prepare('DELETE FROM productos WHERE id = ?');
        $stmt->execute([$id]);
        
        // Si la imagen no es la default, eliminarla del servidor
        $imagenPath = $producto['imagen'];
        if ($imagenPath !== 'img/default.png' && file_exists('../' . $imagenPath)) {
            unlink('../' . $imagenPath);
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Producto eliminado correctamente'
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error al eliminar producto: ' . $e->getMessage()
        ]);
    }
}

// Función para obtener datos de inventario
function getInventoryData() {
    global $pdo;
    
    try {
        $stmt = $pdo->query('SELECT * FROM productos ORDER BY nombre');
        $productos = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Transformar datos para la visualización
        $inventoryData = [];
        foreach ($productos as $producto) {
            // Determinar el estado basado en nivel de stock (demo - normalmente esto estaría en la DB)
            $stock = rand(5, 120); // Demo data - en producción vendría de la DB
            $status = 'normal';
            if ($stock < 15) {
                $status = 'bajo';
            }
            if ($stock < 10) {
                $status = 'crítico';
            }
            
            // Determinar rotación basada en ventas (demo)
            $rotations = ['baja', 'media', 'alta'];
            $rotation = $rotations[array_rand($rotations)];
            
            $inventoryData[] = [
                'name' => $producto['nombre'],
                'category' => ucfirst($producto['categoria']),
                'stock' => $stock,
                'status' => $status,
                'rotation' => $rotation
            ];
        }
        
        echo json_encode([
            'success' => true,
            'data' => $inventoryData
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error al obtener datos de inventario: ' . $e->getMessage()
        ]);
    }
}

// Procesar la solicitud según el método HTTP
switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        if (isset($_GET['action']) && $_GET['action'] === 'inventory') {
            getInventoryData();
        } else if (isset($_GET['id'])) {
            getProduct($_GET['id']);
        } else {
            getProducts();
        }
        break;
        
    case 'POST':
        if (isset($_GET['id'])) {
            // For edit mode
            updateProduct($_GET['id']);
        } else {
            // For create mode
            createProduct();
        }
        break;
        
    case 'DELETE':
        if (isset($_GET['id'])) {
            deleteProduct($_GET['id']);
        } else {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Se requiere ID del producto'
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