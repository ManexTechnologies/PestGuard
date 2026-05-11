<?php
require_once __DIR__ . '/../config/database.php';

$request_method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Route requests
if (strpos($path, '/signup') !== false && $request_method === 'POST') {
    signup();
} elseif (strpos($path, '/login') !== false && $request_method === 'POST') {
    login();
} elseif (strpos($path, '/logout') !== false && $request_method === 'POST') {
    logout();
} elseif (strpos($path, '/verify-session') !== false && $request_method === 'POST') {
    verifySession();
} else {
    http_response_code(404);
    echo json_encode(['error' => 'Endpoint not found']);
}

function signup() {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data || !isset($data['email']) || !isset($data['password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Email and password required']);
        return;
    }

    $email = trim($data['email']);
    $password = $data['password'];
    $full_name = $data['full_name'] ?? '';

    // Validate email
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid email format']);
        return;
    }

    // Validate password strength (minimum 6 characters)
    if (strlen($password) < 6) {
        http_response_code(400);
        echo json_encode(['error' => 'Password must be at least 6 characters']);
        return;
    }

    $db = getDB();
    
    // Check if user already exists
    $check_query = $db->prepare('SELECT id FROM users WHERE email = ?');
    $check_query->bind_param('s', $email);
    $check_query->execute();
    
    if ($check_query->get_result()->num_rows > 0) {
        http_response_code(409);
        echo json_encode(['error' => 'Email already registered']);
        return;
    }

    // Hash password
    $password_hash = password_hash($password, PASSWORD_BCRYPT);

    // Create user
    $user_query = $db->prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)');
    $user_query->bind_param('ss', $email, $password_hash);
    
    if (!$user_query->execute()) {
        http_response_code(500);
        echo json_encode(['error' => 'User creation failed']);
        return;
    }

    $user_id = $db->insert_id;

    // Create farmer profile
    $profile_query = $db->prepare('INSERT INTO farmer_profiles (user_id, full_name) VALUES (?, ?)');
    $profile_query->bind_param('is', $user_id, $full_name);
    $profile_query->execute();

    // Generate session token with user info
    $tokenData = [
        'user_id' => $user_id,
        'email' => $email,
        'created_at' => time()
    ];
    $token = base64_encode(json_encode($tokenData));
    
    http_response_code(201);
    echo json_encode([
        'success' => true,
        'user_id' => $user_id,
        'message' => 'User registered successfully',
        'token' => $token
    ]);
}

function login() {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data || !isset($data['email']) || !isset($data['password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Email and password required']);
        return;
    }

    $email = trim($data['email']);
    $password = $data['password'];

    $db = getDB();
    
    $query = $db->prepare('SELECT id, email, password_hash FROM users WHERE email = ?');
    $query->bind_param('s', $email);
    $query->execute();
    $result = $query->get_result();

    if ($result->num_rows === 0) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid credentials']);
        return;
    }

    $user = $result->fetch_assoc();

    if (!password_verify($password, $user['password_hash'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid credentials']);
        return;
    }

    // Generate session token with user info
    $tokenData = [
        'user_id' => $user['id'],
        'email' => $user['email'],
        'created_at' => time()
    ];
    $token = base64_encode(json_encode($tokenData));
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'user_id' => $user['id'],
        'email' => $user['email'],
        'token' => $token
    ]);
}

function logout() {
    // Session cleanup if using native sessions
    session_destroy();
    
    http_response_code(200);
    echo json_encode(['success' => true, 'message' => 'Logged out successfully']);
}

function verifySession() {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';
    
    if (empty($authHeader) || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        http_response_code(401);
        echo json_encode(['error' => 'No valid token provided']);
        return;
    }
    
    $token = $matches[1];
    
    // For now, we'll use a simple token validation
    // In production, you should use proper JWT validation
    $decoded = base64_decode($token);
    if (!$decoded) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid token']);
        return;
    }
    
    $tokenData = json_decode($decoded, true);
    if (!$tokenData || !isset($tokenData['user_id'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid token data']);
        return;
    }
    
    $userId = $tokenData['user_id'];
    
    $db = getDB();
    
    // Get user
    $userQuery = $db->prepare('SELECT id, email FROM users WHERE id = ?');
    $userQuery->bind_param('i', $userId);
    $userQuery->execute();
    $userResult = $userQuery->get_result();
    
    if ($userResult->num_rows === 0) {
        http_response_code(401);
        echo json_encode(['error' => 'User not found']);
        return;
    }
    
    $user = $userResult->fetch_assoc();
    
    // Get profile
    $profileQuery = $db->prepare('SELECT * FROM farmer_profiles WHERE user_id = ?');
    $profileQuery->bind_param('i', $userId);
    $profileQuery->execute();
    $profileResult = $profileQuery->get_result();
    
    if ($profileResult->num_rows === 0) {
        http_response_code(401);
        echo json_encode(['error' => 'Profile not found']);
        return;
    }
    
    $profile = $profileResult->fetch_assoc();
    
    // Convert crops_grown from JSON string to array if needed
    if (isset($profile['crops_grown']) && is_string($profile['crops_grown'])) {
        $profile['crops_grown'] = json_decode($profile['crops_grown'], true) ?: [];
    }
    
    http_response_code(200);
    echo json_encode([
        'user' => [
            'id' => (int)$user['id'],
            'email' => $user['email']
        ],
        'profile' => [
            'id' => (int)$profile['id'],
            'user_id' => (int)$profile['user_id'],
            'full_name' => $profile['full_name'],
            'farm_name' => $profile['farm_name'] ?? null,
            'farm_location' => $profile['farm_location'] ?? null,
            'province' => $profile['province'] ?? null,
            'crops_grown' => $profile['crops_grown'] ?: [],
            'phone' => $profile['phone'] ?? null,
            'created_at' => $profile['created_at'],
            'updated_at' => $profile['updated_at']
        ]
    ]);
}
?>
