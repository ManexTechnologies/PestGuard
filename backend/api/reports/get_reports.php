<?php
// backend/api/reports/get_reports.php
header('Access-Control-Allow-Origin: http://localhost:8080');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');
header('Content-Type: application/json');

// Handle preflight requests
if (['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

session_start();
require_once '../../config/database.php';

// Check if user is logged in
if (!isset(['user_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'User not logged in. Please login first.',
        'reports' => [],
        'count' => 0
    ]);
    exit;
}

 = ['user_id'];

// Get reports for this user from pest_sightings table
 = "SELECT * FROM pest_sightings WHERE user_id = ? ORDER BY created_at DESC";
 = ->prepare();
->bind_param("i", );
->execute();
 = ->get_result();

 = [];
while ( = ->fetch_assoc()) {
    // Clean up NULL values
    foreach ( as  => ) {
        if ( === null) {
            [] = '';
        }
    }
    [] = ;
}

// Get total count from all pest_sightings
 = "SELECT COUNT(*) as total FROM pest_sightings";
 = ->query();
 = ->fetch_assoc();

echo json_encode([
    'success' => true,
    'user_id' => ,
    'reports' => ,
    'user_reports_count' => count(),
    'total_reports_in_db' => (int)['total']
]);
?>
