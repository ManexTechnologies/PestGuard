<?php
require_once __DIR__ . '/../config/database.php';

$request_method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Route requests
if (strpos($path, '/pest-sightings') !== false) {
    if ($request_method === 'POST') {
        createPestSighting();
    } elseif ($request_method === 'GET') {
        getPestSightings();
    }
} elseif (strpos($path, '/pest-history') !== false) {
    if ($request_method === 'POST') {
        createPestHistory();
    } elseif ($request_method === 'GET') {
        getPestHistory();
    }
} else {
    http_response_code(404);
    echo json_encode(['error' => 'Endpoint not found']);
}

function createPestSighting() {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['user_id']) || !isset($data['pest_name'])) {
        http_response_code(400);
        echo json_encode(['error' => 'user_id and pest_name required']);
        return;
    }

    $user_id = (int)$data['user_id'];
    $pest_name = $data['pest_name'];
    $pest_type = $data['pest_type'] ?? null;
    $severity = $data['severity'] ?? 'medium';
    $location = $data['location'] ?? null;
    $latitude = $data['latitude'] ?? null;
    $longitude = $data['longitude'] ?? null;
    $image_url = $data['image_url'] ?? null;
    $description = $data['description'] ?? null;

    $db = getDB();

    $query = $db->prepare(
        'INSERT INTO pest_sightings 
        (user_id, pest_name, pest_type, severity, location, latitude, longitude, image_url, description) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );

    // Normalize latitude/longitude to floats or null
    $latitude_param = is_numeric($latitude) ? (float)$latitude : null;
    $longitude_param = is_numeric($longitude) ? (float)$longitude : null;

    // Types: i (int), s (string), s (string), s (string), s (location string), d (double latitude), d (double longitude), s (image_url), s (description)
    $query->bind_param(
        'issssddss',
        $user_id,
        $pest_name,
        $pest_type,
        $severity,
        $location,
        $latitude_param,
        $longitude_param,
        $image_url,
        $description
    );

    if (!$query->execute()) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create pest sighting']);
        return;
    }

    http_response_code(201);
    echo json_encode([
        'success' => true,
        'sighting_id' => $db->insert_id,
        'message' => 'Pest sighting recorded'
    ]);
}

function getPestSightings() {
    $user_id = $_GET['user_id'] ?? null;
    $all_reports = $_GET['all'] ?? null;
    
    // If 'all' parameter is set, return all reports (for the map view)
    if ($all_reports === 'true') {
        $db = getDB();
        
        $query = $db->prepare(
            'SELECT ps.id, ps.pest_name, ps.pest_type, ps.severity, ps.location, 
                    ps.latitude, ps.longitude, ps.image_url, ps.description, 
                    ps.identified_at, ps.created_at,
                    u.email as user_email, fp.full_name as user_name
             FROM pest_sightings ps
             LEFT JOIN users u ON ps.user_id = u.id
             LEFT JOIN farmer_profiles fp ON ps.user_id = fp.user_id
             ORDER BY ps.identified_at DESC
             LIMIT 200'
        );
        
        $query->execute();
        $result = $query->get_result();

        $sightings = [];
        while ($row = $result->fetch_assoc()) {
            $sightings[] = $row;
        }

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => $sightings
        ]);
        return;
    }
    
    // Otherwise, require user_id for user's own reports
    if (!$user_id) {
        http_response_code(400);
        echo json_encode(['error' => 'user_id required']);
        return;
    }

    $db = getDB();
    
    $query = $db->prepare(
        'SELECT id, pest_name, pest_type, severity, location, latitude, longitude, 
                image_url, description, identified_at 
         FROM pest_sightings 
         WHERE user_id = ? 
         ORDER BY identified_at DESC'
    );

    $query->bind_param('i', $user_id);
    $query->execute();
    $result = $query->get_result();

    $sightings = [];
    while ($row = $result->fetch_assoc()) {
        $sightings[] = $row;
    }

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => $sightings
    ]);
}

function createPestHistory() {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['user_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'user_id required']);
        return;
    }

    $user_id = (int)$data['user_id'];
    $sighting_id = $data['sighting_id'] ?? null;
    $action_taken = $data['action_taken'] ?? null;
    $treatment_used = $data['treatment_used'] ?? null;
    $effectiveness = $data['effectiveness'] ?? null;
    $result = $data['result'] ?? null;
    $treated_at = $data['treated_at'] ?? date('Y-m-d H:i:s');

    $db = getDB();

    $query = $db->prepare(
        'INSERT INTO pest_history 
        (user_id, sighting_id, action_taken, treatment_used, effectiveness, result, treated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?)'
    );

    $sighting_id_param = $sighting_id ? (int)$sighting_id : null;
    $query->bind_param(
        'iisssss',
        $user_id, $sighting_id_param, $action_taken, $treatment_used, $effectiveness, $result, $treated_at
    );

    if (!$query->execute()) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create pest history']);
        return;
    }

    http_response_code(201);
    echo json_encode([
        'success' => true,
        'history_id' => $db->insert_id,
        'message' => 'Pest history recorded'
    ]);
}

function getPestHistory() {
    $user_id = $_GET['user_id'] ?? null;
    
    if (!$user_id) {
        http_response_code(400);
        echo json_encode(['error' => 'user_id required']);
        return;
    }

    $db = getDB();
    
    $query = $db->prepare(
        'SELECT id, sighting_id, action_taken, treatment_used, effectiveness, result, treated_at, created_at 
         FROM pest_history 
         WHERE user_id = ? 
         ORDER BY treated_at DESC, created_at DESC'
    );

    $query->bind_param('i', $user_id);
    $query->execute();
    $result = $query->get_result();

    $history = [];
    while ($row = $result->fetch_assoc()) {
        $history[] = $row;
    }

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => $history
    ]);
}
?>
