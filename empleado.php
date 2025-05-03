<?php
// Start the session
session_start();

// Check if the user is logged in
if (!isset($_SESSION['user'])) {
    // Not authenticated, redirect to login
    header('Location: index.php');
    exit;
}

// Continue with employee page - just include the HTML
include('empleado.html');
?>