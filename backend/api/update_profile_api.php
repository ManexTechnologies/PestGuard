<?php
// backend/api/update_profile_api.php
// Update user profile endpoint

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

$user_id = intval($input['user_id'] ?? 0);

if ($user_id <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'user_id is required']);
    exit;
}

try {
    $db = getDB();
    
    // Verify user exists
    $check_query = $db->prepare('SELECT id FROM users WHERE id = ?');
    $check_query->bind_param('i', $user_id);
    $check_query->execute();
    $check_result = $check_query->get_result();
    
    if ($check_result->num_rows === 0) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'User not found']);
        $check_query->close();
        exit;
    }
    $check_query->close();
    
    // Update farmer profile
    $full_name = $input['full_name'] ?? null;
    $province = $input['province'] ?? null;
    $district = $input['district'] ?? null;
    $farm_size = isset($input['farm_size']) ? floatval($input['farm_size']) : null;
    $crops_grown = isset($input['crops_grown']) ? json_encode($input['crops_grown']) : null;
    $phone = $input['phone'] ?? null;
    
    // Check if profile exists
    $profile_check = $db->prepare('SELECT id FROM farmer_profiles WHERE user_id = ?');
    $profile_check->bind_param('i', $user_id);
    $profile_check->execute();
    $profile_check_result = $profile_check->get_result();
    $profile_exists = $profile_check_result->num_rows > 0;
    $profile_check->close();
    
    if ($profile_exists) {
        // Update existing profile
        $update_query = $db->prepare(
            'UPDATE farmer_profiles 
             SET full_name = COALESCE(?, full_name),
                 province = COALESCE(?, province),
                 district = COALESCE(?, district),
                 farm_size = COALESCE(?, farm_size),
                 crops_grown = COALESCE(?, crops_grown),
                 phone = COALESCE(?, phone),
                 updated_at = NOW()
             WHERE user_id = ?'
        );
        
        $update_query->bind_param(
            'sssdssi',
            $full_name,
            $province,
            $district,
            $farm_size,
            $crops_grown,
            $phone,
            $user_id
        );
    } else {
        // Create new profile
        $update_query = $db->prepare(
            'INSERT INTO farmer_profiles (user_id, full_name, province, district, farm_size, crops_grown, phone, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW())'
        );
        
        $update_query->bind_param(
            'isssdss',
            $user_id,
            $full_name,
            $province,
            $district,
            $farm_size,
            $crops_grown,
            $phone
        );
    }
    
    if (!$update_query->execute()) {
        throw new Exception('Update failed: ' . $update_query->error);
    }
    $update_query->close();
    
    // Fetch updated profile
    $fetch_query = $db->prepare(
        'SELECT id, user_id, full_name, province, district, farm_size, crops_grown, phone
         FROM farmer_profiles WHERE user_id = ?'
    );
    $fetch_query->bind_param('i', $user_id);
    $fetch_query->execute();
    $fetch_result = $fetch_query->get_result();
    $profile = $fetch_result->fetch_assoc();
    $fetch_query->close();
    
    if ($profile && $profile['crops_grown']) {
        $profile['crops_grown'] = json_decode($profile['crops_grown'], true);
    }
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Profile updated successfully',
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
