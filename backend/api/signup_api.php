<?php
// backend/api/signup_api.php
// User registration endpoint

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
$password_confirm = $input['password_confirm'] ?? '';
$full_name = trim($input['full_name'] ?? '');
$province = trim($input['province'] ?? '');
$phone = trim($input['phone'] ?? '');

// Validate input
$errors = [];

if (empty($email)) {
    $errors[] = 'Email is required';
} elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Invalid email format';
}

if (empty($password)) {
    $errors[] = 'Password is required';
} elseif (strlen($password) < 6) {
    $errors[] = 'Password must be at least 6 characters';
}

if ($password !== $password_confirm) {
    $errors[] = 'Passwords do not match';
}

if (empty($full_name)) {
    $errors[] = 'Full name is required';
}

if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => implode('; ', $errors)]);
    exit;
}

try {
    $db = getDB();
    
    // Check if email already exists
    $check_query = $db->prepare('SELECT id FROM users WHERE email = ?');
    if (!$check_query) {
        throw new Exception('Check query prepare failed: ' . $db->error);
    }
    
    $check_query->bind_param('s', $email);
    if (!$check_query->execute()) {
        throw new Exception('Check query execute failed: ' . $check_query->error);
    }
    
    $check_result = $check_query->get_result();
    if ($check_result->num_rows > 0) {
        http_response_code(409);
        echo json_encode(['success' => false, 'error' => 'Email already registered']);
        $check_query->close();
        exit;
    }
    $check_query->close();
    
    // Hash password
    $password_hash = password_hash($password, PASSWORD_DEFAULT);
    
    // Insert user
    $user_query = $db->prepare(
        'INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, NOW())'
    );
    
    if (!$user_query) {
        throw new Exception('User insert prepare failed: ' . $db->error);
    }
    
    $user_query->bind_param('ss', $email, $password_hash);
    
    if (!$user_query->execute()) {
        throw new Exception('User insert execute failed: ' . $user_query->error);
    }
    
    $user_id = $db->insert_id;
    $user_query->close();
    
    // Insert farmer profile
    $profile_query = $db->prepare(
        'INSERT INTO farmer_profiles (user_id, full_name, province, phone, created_at) 
         VALUES (?, ?, ?, ?, NOW())'
    );
    
    if (!$profile_query) {
        throw new Exception('Profile insert prepare failed: ' . $db->error);
    }
    
    $profile_query->bind_param('isss', $user_id, $full_name, $province, $phone);
    
    if (!$profile_query->execute()) {
        throw new Exception('Profile insert execute failed: ' . $profile_query->error);
    }
    
    $profile_query->close();
    
    // Generate session token
    $token = bin2hex(random_bytes(32));
    
    session_start();
    $_SESSION['user_id'] = $user_id;
    $_SESSION['email'] = $email;
    $_SESSION['token'] = $token;
    
    // Get the profile we just created
    $profile_query = $db->prepare(
        'SELECT id, user_id, full_name, province, phone FROM farmer_profiles WHERE user_id = ?'
    );
    $profile_query->bind_param('i', $user_id);
    $profile_query->execute();
    $profile_result = $profile_query->get_result();
    $profile = $profile_result->fetch_assoc();
    $profile_query->close();
    
    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => 'Registration successful',
        'user' => [
            'id' => $user_id,
            'email' => $email
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
