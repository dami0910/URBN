<?php
// Start the session
session_start();

// Check if the user is logged in and is an admin
if (!isset($_SESSION['user']) || $_SESSION['user']['rol'] !== 'admin') {
    // Not authenticated or not admin, redirect to login
    header('Location: index.php');
    exit;
}

// Continue with admin page - just include the HTML
include('admin.html');
?>