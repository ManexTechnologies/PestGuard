<?php
// backend/api/reports/get_reports_direct.php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET');

require_once '../../config/database.php';

// Get all reports
$query = "SELECT * FROM pest_sightings ORDER BY created_at DESC";
$result = $mysqli->query($query);

$reports = array();
while ($row = $result->fetch_assoc()) {
    // Clean up NULL values
    foreach ($row as $key => $value) {
        if ($value === null) {
            $row[$key] = '';
        }
    }
    $reports[] = $row;
}

// Get total count
$total_query = "SELECT COUNT(*) as total FROM pest_sightings";
$total_result = $mysqli->query($total_query);
$total = $total_result->fetch_assoc();

echo json_encode(array(
    'success' => true,
    'reports' => $reports,
    'user_reports_count' => count($reports),
    'total_reports_in_db' => (int)$total['total'],
    'message' => 'All reports loaded successfully'
));
?>
