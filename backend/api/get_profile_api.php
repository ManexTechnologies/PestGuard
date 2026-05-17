<?php
// backend/api/get_profile_api.php
// Get user profile endpoint

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

$user_id = intval($_GET['user_id'] ?? 0);

if ($user_id <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'user_id parameter is required']);
    exit;
}

try {
    $db = getDB();
    
    // Get user info
    $user_query = $db->prepare('SELECT id, email FROM users WHERE id = ?');
    if (!$user_query) {
        throw new Exception('User query prepare failed: ' . $db->error);
    }
    
    $user_query->bind_param('i', $user_id);
    if (!$user_query->execute()) {
        throw new Exception('User query execute failed: ' . $user_query->error);
    }
    
    $user_result = $user_query->get_result();
    if ($user_result->num_rows === 0) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'User not found']);
        $user_query->close();
        exit;
    }
    
    $user = $user_result->fetch_assoc();
    $user_query->close();
    
    // Get farmer profile
    $profile_query = $db->prepare(
        'SELECT id, user_id, full_name, province, district, farm_size, crops_grown, phone, created_at, updated_at
         FROM farmer_profiles WHERE user_id = ?'
    );
    
    if (!$profile_query) {
        throw new Exception('Profile query prepare failed: ' . $db->error);
    }
    
    $profile_query->bind_param('i', $user_id);
    if (!$profile_query->execute()) {
        throw new Exception('Profile query execute failed: ' . $profile_query->error);
    }
    
    $profile_result = $profile_query->get_result();
    $profile = $profile_result->num_rows > 0 ? $profile_result->fetch_assoc() : null;
    $profile_query->close();
    
    // Parse JSON fields
    if ($profile && $profile['crops_grown']) {
        $profile['crops_grown'] = json_decode($profile['crops_grown'], true);
    }
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'user' => $user,
        'profile' => $profile
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Server error: ' . $e->getMessage()
    ]);
}
?>
