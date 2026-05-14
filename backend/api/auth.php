<?php
// backend/api/auth.php
session_start();
require_once __DIR__ . '/../config/database.php';

// Handle CORS
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if (['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Get request path
 = ['REQUEST_URI'];
 = parse_url(, PHP_URL_PATH);

// Handle login
if (strpos(, '/login') !== false && ['REQUEST_METHOD'] === 'POST') {
     = json_decode(file_get_contents('php://input'), true);
    
    if (! || !isset(['email']) || !isset(['password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Email and password required']);
        exit();
    }
    
     = trim(['email']);
     = ['password'];
    
    // Query user
     = "SELECT id, email, password_hash FROM users WHERE email = ?";
     = ->prepare();
    ->bind_param("s", );
    ->execute();
     = ->get_result();
     = ->fetch_assoc();
    
    if ( && password_verify(, ['password_hash'])) {
        ['user_id'] = (int)['id'];
        ['user_email'] = ['email'];
        
        echo json_encode([
            'success' => true,
            'user_id' => ['id'],
            'email' => ['email'],
            'message' => 'Login successful'
        ]);
    } else {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid email or password']);
    }
    exit();
}

// Handle logout
if (strpos(, '/logout') !== false && ['REQUEST_METHOD'] === 'POST') {
    session_destroy();
    echo json_encode(['success' => true, 'message' => 'Logged out']);
    exit();
}

// Handle session check
if (strpos(, '/check-session') !== false && ['REQUEST_METHOD'] === 'GET') {
    if (isset(['user_id'])) {
        echo json_encode([
            'logged_in' => true,
            'user_id' => ['user_id'],
            'email' => ['user_email']
        ]);
    } else {
        echo json_encode(['logged_in' => false]);
    }
    exit();
}

http_response_code(404);
echo json_encode(['error' => 'Endpoint not found']);
?>
