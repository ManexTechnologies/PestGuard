<?php
// backend/api/test_reports.php - Debug endpoint
session_start();
require_once '../config/database.php';

header('Content-Type: application/json');

 = [];

// Check session
['session'] = ;
['user_id'] = ['user_id'] ?? null;

// Check users table
 = "SELECT id, username, email FROM users";
 = ->query();
['users'] = [];
while( = ->fetch_assoc()) {
    ['users'][] = ;
}

// Check total pest_sightings
 = "SELECT COUNT(*) as total FROM pest_sightings";
 = ->query();
['total_reports'] = ->fetch_assoc()['total'];

// Check all pest_sightings
 = "SELECT * FROM pest_sightings LIMIT 20";
 = ->query();
['all_reports'] = [];
while( = ->fetch_assoc()) {
    ['all_reports'][] = ;
}

// If user is logged in, show their sightings
if (['user_id']) {
     = "SELECT * FROM pest_sightings WHERE user_id = " . ['user_id'];
     = ->query();
    ['user_reports'] = [];
    ['user_reports_count'] = 0;
    if () {
        while( = ->fetch_assoc()) {
            ['user_reports'][] = ;
            ['user_reports_count']++;
        }
    }
}

echo json_encode(, JSON_PRETTY_PRINT);
?>
