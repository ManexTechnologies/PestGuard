<?php
// backend/api/add_report_api.php
// Endpoint to save pest sighting reports

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid JSON input']);
    exit;
}

// Extract data
$pest_name = $input['pest_name'] ?? null;
$pest_type = $input['pest_type'] ?? null;
$severity = $input['severity'] ?? 'medium';
$location = $input['location'] ?? null;
$latitude = $input['latitude'] ?? null;
$longitude = $input['longitude'] ?? null;
$image_url = $input['image_url'] ?? null;
$description = $input['description'] ?? null;
$crop_affected = $input['crop_affected'] ?? null;
$confidence = $input['confidence'] ?? 85;
$user_id = $input['user_id'] ?? null;
$treatment_recommendation = $input['treatment_recommendation'] ?? null;

// Validation
if (empty($pest_name)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'pest_name is required']);
    exit;
}

try {
    $db = getDB();
    
    // If latitude/longitude are provided, validate them
    $latitude_param = null;
    $longitude_param = null;
    if (is_numeric($latitude) && is_numeric($longitude)) {
        $latitude_param = (float)$latitude;
        $longitude_param = (float)$longitude;
    }

    // Insert into pest_sightings table
    $query = $db->prepare(
        'INSERT INTO pest_sightings 
        (user_id, pest_name, pest_type, severity, location, latitude, longitude, image_url, description, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())'
    );

    if (!$query) {
        throw new Exception('Prepare failed: ' . $db->error);
    }

    // Bind parameters: i=int, s=string, d=double
    $query->bind_param(
        'issssddsss',
        $user_id,
        $pest_name,
        $pest_type,
        $severity,
        $location,
        $latitude_param,
        $longitude_param,
        $image_url,
        $description,
        $crop_affected
    );

    if (!$query->execute()) {
        throw new Exception('Execute failed: ' . $query->error);
    }

    $sighting_id = $db->insert_id;
    $query->close();

    // Also save to knowledge base if it's a user report (optional)
    // This allows other farmers to benefit from this report
    if (!empty($pest_name)) {
        $kb_query = $db->prepare(
            'INSERT INTO knowledge_base (pest_name, pest_type, description, image_url, reported_by_user_id, created_at) 
             VALUES (?, ?, ?, ?, ?, NOW()) 
             ON DUPLICATE KEY UPDATE updated_at = NOW()'
        );
        
        if ($kb_query) {
            $kb_query->bind_param(
                'ssssi',
                $pest_name,
                $pest_type,
                $description,
                $image_url,
                $user_id
            );
            @$kb_query->execute();
            $kb_query->close();
        }
    }

    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => 'Pest sighting recorded successfully',
        'sighting_id' => $sighting_id,
        'data' => [
            'id' => $sighting_id,
            'pest_name' => $pest_name,
            'severity' => $severity,
            'created_at' => date('Y-m-d H:i:s')
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to save report: ' . $e->getMessage()
    ]);
}
?>
