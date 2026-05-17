<?php
// backend/api/login_api.php
// User login endpoint

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

$email = trim($input['email'] ?? '');
$password = $input['password'] ?? '';

// Validate input
if (empty($email) || empty($password)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Email and password are required']);
    exit;
}

try {
    $db = getDB();
    
    // Find user by email
    $query = $db->prepare('SELECT id, email, password_hash FROM users WHERE email = ?');
    if (!$query) {
        throw new Exception('Prepare failed: ' . $db->error);
    }
    
    $query->bind_param('s', $email);
    
    if (!$query->execute()) {
        throw new Exception('Execute failed: ' . $query->error);
    }
    
    $result = $query->get_result();
    
    if ($result->num_rows === 0) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'error' => 'Invalid email or password'
        ]);
        $query->close();
        exit;
    }
    
    $user = $result->fetch_assoc();
    $query->close();
    
    // Verify password
    if (!password_verify($password, $user['password_hash'])) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'error' => 'Invalid email or password'
        ]);
        exit;
    }
    
    // Get farmer profile
    $profile_query = $db->prepare(
        'SELECT id, user_id, full_name, province, district, farm_size, crops_grown, phone 
         FROM farmer_profiles WHERE user_id = ?'
    );
    
    if (!$profile_query) {
        throw new Exception('Profile prepare failed: ' . $db->error);
    }
    
    $profile_query->bind_param('i', $user['id']);
    
    if (!$profile_query->execute()) {
        throw new Exception('Profile execute failed: ' . $profile_query->error);
    }
    
    $profile_result = $profile_query->get_result();
    $profile = $profile_result->num_rows > 0 ? $profile_result->fetch_assoc() : null;
    $profile_query->close();
    
    // Generate session token (simple implementation - for production use proper JWT)
    $token = bin2hex(random_bytes(32));
    
    // Store token in session or database (simple approach - store in client)
    // For production, store in database with expiration
    session_start();
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['email'] = $user['email'];
    $_SESSION['token'] = $token;
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Login successful',
        'user' => [
            'id' => $user['id'],
            'email' => $user['email']
        ],
        'profile' => $profile,
        'token' => $token
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Server error: ' . $e->getMessage()
    ]);
}
?>
