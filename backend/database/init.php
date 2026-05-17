<?php
require_once __DIR__ . '/../config/database.php';

$db = getDB();

try {
    // Read and execute schema
    $schema = file_get_contents(__DIR__ . '/schema.sql');
    $db->exec($schema);
    echo "Database initialized successfully\n";
} catch (Exception $e) {
    echo "Error initializing database: " . $e->getMessage() . "\n";
}
?>