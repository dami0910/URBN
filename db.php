<?php
// Database configuration
$host = 'localhost';
$db   = 'puntourbn';
$user = 'root';  // Change according to your database configuration
$pass = '';      // Change according to your database configuration
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
    
    // Check if database exists, if not create it
    try {
        $pdo->query("USE $db");
    } catch (PDOException $e) {
        // Database doesn't exist, create it
        $pdo = new PDO("mysql:host=$host", $user, $pass, $options);
        $pdo->exec("CREATE DATABASE IF NOT EXISTS `$db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci");
        $pdo = new PDO($dsn, $user, $pass, $options);
    }
    
    // Check if tables exist, if not, create them
    $stmt = $pdo->query("SHOW TABLES LIKE 'usuarios'");
    if ($stmt->rowCount() == 0) {
        // Tables don't exist, create them
        $sql = file_get_contents(__DIR__ . '/sql/setup_tables.sql');
        
        // Execute each statement separately
        $queries = explode(';', $sql);
        foreach($queries as $query) {
            $query = trim($query);
            if (!empty($query)) {
                $pdo->exec($query);
            }
        }
        
        echo "<script>console.log('Database tables created successfully');</script>";
    }
    
} catch (PDOException $e) {
    // For development purposes, show the error
    die("Database connection failed: " . $e->getMessage());
}
?>