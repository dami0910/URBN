-- SQL script for complete PUNTO URBN database setup
-- This script will create the database and all necessary tables with initial data

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS puntourbn DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- Select the database
USE puntourbn;

-- Set SQL mode and start transaction
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- Drop tables if they exist to avoid conflicts
DROP TABLE IF EXISTS venta_detalle;
DROP TABLE IF EXISTS ventas;
DROP TABLE IF EXISTS productos;
DROP TABLE IF EXISTS usuarios;

-- Create table for users
CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(100) NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  rol ENUM('admin','empleado') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create table for products
CREATE TABLE productos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  imagen VARCHAR(255) DEFAULT 'img/default.png',
  precio DECIMAL(10,2) NOT NULL,
  categoria VARCHAR(50) DEFAULT 'cafe'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create table for sales
CREATE TABLE ventas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fecha DATETIME NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  iva DECIMAL(10,2) NOT NULL,
  metodo_pago VARCHAR(50) NOT NULL,
  vendedor_id INT,
  FOREIGN KEY (vendedor_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create table for sale details
CREATE TABLE venta_detalle (
  id INT AUTO_INCREMENT PRIMARY KEY,
  venta_id INT NOT NULL,
  producto_id INT NOT NULL,
  cantidad INT NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
  FOREIGN KEY (producto_id) REFERENCES productos(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default admin user
INSERT INTO usuarios (usuario, password, nombre, rol) 
VALUES ('admin', 'admin123', 'Administrador', 'admin');

-- Insert default employee user
INSERT INTO usuarios (usuario, password, nombre, rol) 
VALUES ('empleado', 'empleado123', 'Empleado Demo', 'empleado');

-- Insert sample products
INSERT INTO productos (nombre, precio, categoria) VALUES 
('Café Americano', 25.00, 'cafe'),
('Cappuccino', 35.00, 'cafe'),
('Espresso', 22.00, 'cafe'),
('Latte', 32.00, 'cafe'),
('Mocha', 38.00, 'cafe'),
('Café Frío', 30.00, 'cafe'),
('Sandwich de Jamón', 45.00, 'comida'),
('Sandwich de Pollo', 50.00, 'comida'),
('Bagel con Queso', 35.00, 'comida'),
('Croissant', 28.00, 'comida'),
('Ensalada Mixta', 55.00, 'comida'),
('Panini Vegetariano', 42.00, 'comida'),
('Pastel de Chocolate', 40.00, 'postre'),
('Cupcake de Vainilla', 25.00, 'postre'),
('Galletas (3 piezas)', 20.00, 'postre'),
('Muffin de Arándanos', 30.00, 'postre'),
('Tarta de Frutas', 38.00, 'postre'),
('Brownie', 28.00, 'postre');

-- Create indexes for better performance
CREATE INDEX idx_productos_categoria ON productos(categoria);
CREATE INDEX idx_ventas_fecha ON ventas(fecha);
CREATE INDEX idx_ventas_vendedor ON ventas(vendedor_id);
CREATE INDEX idx_venta_detalle_venta ON venta_detalle(venta_id);
CREATE INDEX idx_venta_detalle_producto ON venta_detalle(producto_id);

-- Insert some sample sales data for dashboard statistics
INSERT INTO ventas (fecha, total, subtotal, iva, metodo_pago, vendedor_id) VALUES
(DATE_SUB(NOW(), INTERVAL 5 DAY), 120.00, 103.45, 16.55, 'efectivo', 2),
(DATE_SUB(NOW(), INTERVAL 4 DAY), 85.50, 73.71, 11.79, 'tarjeta', 2),
(DATE_SUB(NOW(), INTERVAL 3 DAY), 197.80, 170.52, 27.28, 'efectivo', 2),
(DATE_SUB(NOW(), INTERVAL 2 DAY), 78.00, 67.24, 10.76, 'tarjeta', 2),
(DATE_SUB(NOW(), INTERVAL 1 DAY), 165.40, 142.59, 22.81, 'efectivo', 2),
(NOW(), 112.30, 96.81, 15.49, 'tarjeta', 2);

-- Insert sample sale details for each sale
INSERT INTO venta_detalle (venta_id, producto_id, cantidad, precio_unitario) VALUES
(1, 1, 2, 25.00),
(1, 7, 1, 45.00),
(1, 13, 1, 40.00),
(2, 2, 1, 35.00),
(2, 10, 2, 28.00),
(3, 4, 2, 32.00),
(3, 8, 2, 50.00),
(3, 14, 2, 25.00),
(4, 3, 1, 22.00),
(4, 6, 1, 30.00),
(4, 15, 1, 20.00),
(5, 5, 2, 38.00),
(5, 9, 1, 35.00),
(5, 13, 1, 40.00),
(6, 2, 1, 35.00),
(6, 11, 1, 55.00),
(6, 18, 1, 28.00);

-- Sample data for last month sales (for trending graphs)
INSERT INTO ventas (fecha, total, subtotal, iva, metodo_pago, vendedor_id) VALUES
(DATE_SUB(NOW(), INTERVAL 1 MONTH), 3200.00, 2758.62, 441.38, 'efectivo', 2),
(DATE_SUB(NOW(), INTERVAL 2 MONTH), 3500.00, 3017.24, 482.76, 'tarjeta', 2),
(DATE_SUB(NOW(), INTERVAL 3 MONTH), 3800.00, 3275.86, 524.14, 'efectivo', 2),
(DATE_SUB(NOW(), INTERVAL 4 MONTH), 4100.00, 3534.48, 565.52, 'tarjeta', 2),
(DATE_SUB(NOW(), INTERVAL 5 MONTH), 4500.00, 3879.31, 620.69, 'efectivo', 2),
(DATE_SUB(NOW(), INTERVAL 6 MONTH), 4800.00, 4137.93, 662.07, 'tarjeta', 2);

-- Commit the transaction
COMMIT;

-- Database setup complete
SELECT 'Database setup completed successfully' AS 'Status';

