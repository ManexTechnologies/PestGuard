<?php
// backend/api/get_reports_api.php
// Endpoint to retrieve pest sighting reports

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

try {
    $db = getDB();
    
    // Get all reports, ordered by most recent first
    $query = "SELECT 
                ps.id,
                ps.user_id,
                ps.pest_name,
                ps.pest_type,
                ps.severity,
                ps.location,
                ps.latitude,
                ps.longitude,
                ps.image_url,
                ps.description,
                ps.created_at,
                ps.identified_at,
                COALESCE(u.email, 'Unknown') as user_email,
                COALESCE(fp.full_name, 'Unknown Farmer') as user_name
            FROM pest_sightings ps
            LEFT JOIN users u ON ps.user_id = u.id
            LEFT JOIN farmer_profiles fp ON ps.user_id = fp.user_id
            ORDER BY ps.created_at DESC
            LIMIT 1000";
    
    $result = $db->query($query);
    
    if (!$result) {
        throw new Exception('Query failed: ' . $db->error);
    }
    
    $reports = [];
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
    $total_result = $db->query($total_query);
    $total_row = $total_result->fetch_assoc();
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'reports' => $reports,
        'count' => count($reports),
        'total_reports_in_db' => (int)$total_row['total'],
        'message' => 'Reports retrieved successfully'
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to retrieve reports: ' . $e->getMessage(),
        'reports' => [],
        'count' => 0
    ]);
}
?>
