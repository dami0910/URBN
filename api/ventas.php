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

// Este archivo maneja las operaciones de ventas
require_once '../db.php';
header('Content-Type: application/json');

// Función para registrar una nueva venta
function createSale() {
    global $pdo;
    
    // Obtener datos POST
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Validar datos requeridos
    if (!isset($data['items']) || empty($data['items']) || 
        !isset($data['total']) || !isset($data['metodoPago'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Faltan datos requeridos para la venta'
        ]);
        return;
    }
    
    try {
        // Iniciar transacción
        $pdo->beginTransaction();
        
        // Insertar registro de venta
        $stmt = $pdo->prepare('INSERT INTO ventas (fecha, total, subtotal, iva, metodo_pago, vendedor_id) VALUES (NOW(), ?, ?, ?, ?, ?)');
        $stmt->execute([
            $data['total'],
            $data['subtotal'],
            $data['iva'],
            $data['metodoPago'],
            $data['vendedor']['id']
        ]);
        
        $ventaId = $pdo->lastInsertId();
        
        // Insertar detalles de venta
        $stmtDetalle = $pdo->prepare('INSERT INTO venta_detalle (venta_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)');
        
        foreach ($data['items'] as $item) {
            $stmtDetalle->execute([
                $ventaId,
                $item['id'],
                $item['cantidad'],
                $item['precio']
            ]);
        }
        
        // Confirmar transacción
        $pdo->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'Venta registrada correctamente',
            'data' => [
                'id' => $ventaId
            ]
        ]);
        
    } catch (PDOException $e) {
        // Revertir transacción en caso de error
        $pdo->rollBack();
        
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error al registrar la venta: ' . $e->getMessage()
        ]);
    }
}

// Función para obtener ventas con filtros de fecha
function getSales() {
    global $pdo;
    
    try {
        // Verificar si hay filtros de fecha
        $whereClause = '';
        $params = [];
        
        if (isset($_GET['start']) && isset($_GET['end'])) {
            $start = $_GET['start'] . ' 00:00:00';
            $end = $_GET['end'] . ' 23:59:59';
            $whereClause = ' WHERE v.fecha BETWEEN ? AND ?';
            $params = [$start, $end];
        }
        
        $sql = '
            SELECT v.id, v.fecha, v.total, v.metodo_pago, u.nombre as vendedor
            FROM ventas v
            LEFT JOIN usuarios u ON v.vendedor_id = u.id
            ' . $whereClause . '
            ORDER BY v.fecha DESC
        ';
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        $ventas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'data' => $ventas
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error al obtener ventas: ' . $e->getMessage()
        ]);
    }
}

// Función para obtener detalles de una venta
function getSaleDetails($id) {
    global $pdo;
    
    try {
        // Obtener datos de la venta
        $stmt = $pdo->prepare('
            SELECT v.*, u.nombre as vendedor
            FROM ventas v
            LEFT JOIN usuarios u ON v.vendedor_id = u.id
            WHERE v.id = ?
        ');
        $stmt->execute([$id]);
        $venta = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$venta) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Venta no encontrada'
            ]);
            return;
        }
        
        // Obtener detalles de la venta
        $stmtDetalle = $pdo->prepare('
            SELECT d.*, p.nombre
            FROM venta_detalle d
            JOIN productos p ON d.producto_id = p.id
            WHERE d.venta_id = ?
        ');
        $stmtDetalle->execute([$id]);
        $detalles = $stmtDetalle->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'data' => [
                'venta' => $venta,
                'detalles' => $detalles
            ]
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error al obtener detalles de la venta: ' . $e->getMessage()
        ]);
    }
}

// Función para obtener datos del dashboard
function getDashboardSummary() {
    global $pdo;
    
    try {
        // Get total sales
        $stmtSales = $pdo->query('SELECT COALESCE(SUM(total), 0) as totalSales FROM ventas');
        $totalSales = $stmtSales->fetch(PDO::FETCH_ASSOC)['totalSales'];
        
        // Get total orders
        $stmtOrders = $pdo->query('SELECT COUNT(*) as totalOrders FROM ventas');
        $totalOrders = $stmtOrders->fetch(PDO::FETCH_ASSOC)['totalOrders'];
        
        // Get active customers (placeholder - would be based on actual customer data)
        $activeCustomers = 78; // Demo data
        
        // Calculate average order value
        $averageOrderValue = $totalOrders > 0 ? $totalSales / $totalOrders : 0;
        
        echo json_encode([
            'success' => true,
            'data' => [
                'totalSales' => $totalSales,
                'totalOrders' => $totalOrders,
                'activeCustomers' => $activeCustomers,
                'averageOrderValue' => $averageOrderValue
            ]
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error al obtener datos del dashboard: ' . $e->getMessage()
        ]);
    }
}

// Función para obtener ventas por categoría
function getSalesByCategory() {
    global $pdo;
    
    try {
        $stmt = $pdo->query('
            SELECT p.categoria as category, COALESCE(SUM(d.cantidad * d.precio_unitario), 0) as sales
            FROM venta_detalle d
            JOIN productos p ON d.producto_id = p.id
            GROUP BY p.categoria
            ORDER BY sales DESC
        ');
        
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'data' => $data
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error al obtener ventas por categoría: ' . $e->getMessage()
        ]);
    }
}

// Función para obtener tendencia de ventas
function getSalesTrend() {
    global $pdo;
    
    try {
        $stmt = $pdo->query('
            SELECT 
                DATE_FORMAT(fecha, "%b") as month,
                COALESCE(SUM(total), 0) as sales
            FROM ventas
            WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
            GROUP BY MONTH(fecha)
            ORDER BY fecha ASC
        ');
        
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'data' => $data
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error al obtener tendencia de ventas: ' . $e->getMessage()
        ]);
    }
}

// Función para obtener productos más vendidos
function getTopProducts() {
    global $pdo;
    
    try {
        $stmt = $pdo->query('
            SELECT 
                p.nombre as name,
                COALESCE(SUM(d.cantidad), 0) as quantity,
                COALESCE(SUM(d.cantidad * d.precio_unitario), 0) as amount
            FROM venta_detalle d
            JOIN productos p ON d.producto_id = p.id
            GROUP BY p.id
            ORDER BY quantity DESC
            LIMIT 5
        ');
        
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'data' => $data
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error al obtener productos más vendidos: ' . $e->getMessage()
        ]);
    }
}

// Procesar la solicitud según el método HTTP
switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        if (isset($_GET['action'])) {
            switch ($_GET['action']) {
                case 'dashboard_summary':
                    getDashboardSummary();
                    break;
                case 'sales_by_category':
                    getSalesByCategory();
                    break;
                case 'sales_trend':
                    getSalesTrend();
                    break;
                case 'top_products':
                    getTopProducts();
                    break;
                default:
                    if (isset($_GET['id'])) {
                        getSaleDetails($_GET['id']);
                    } else {
                        getSales();
                    }
            }
        } else if (isset($_GET['id'])) {
            getSaleDetails($_GET['id']);
        } else {
            getSales();
        }
        break;
        
    case 'POST':
        createSale();
        break;
        
    default:
        http_response_code(405); // Method Not Allowed
        echo json_encode([
            'success' => false,
            'message' => 'Método no permitido'
        ]);
        break;
}
?>