<?php
// backend/api/auth.php
require_once __DIR__ . '/../config/database.php';
session_start();

// Handle CORS
header('Content-Type: application/json');
$allowedOrigins = [
    'http://localhost:8080',
    'http://localhost:5173',
    'http://localhost',
];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    header('Access-Control-Allow-Origin: http://localhost:8080');
}
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Determine endpoint path independently of install prefix
$request_uri = $_SERVER['REQUEST_URI'];
$path = parse_url($request_uri, PHP_URL_PATH);
$endpoint = '/';
if (isset($_GET['endpoint'])) {
    $endpoint = '/' . trim($_GET['endpoint'], '/');
} elseif (preg_match('@/auth\.php(/.*)$@', $path, $matches)) {
    $endpoint = $matches[1];
}

function getJsonRequestBody() {
    $body = file_get_contents('php://input');
    if ($body !== false && trim($body) !== '') {
        $data = json_decode($body, true);
        if ($data !== null) {
            return $data;
        }
    }

    if (!empty($_POST)) {
        return $_POST;
    }

    if (!empty($_REQUEST)) {
        return $_REQUEST;
    }

    return null;
}

// Handle login
if ($endpoint === '/login' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = getJsonRequestBody();

    if (!$input || !isset($input['email']) || !isset($input['password'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Email and password required']);
        exit();
    }

    $email = trim($input['email']);
    $password = $input['password'];

    try {
        $db = getDB();

        // Find user by email
        $stmt = $db->prepare('SELECT id, email, password_hash FROM users WHERE email = ?');
        $stmt->bind_param('s', $email);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();
        $stmt->close();

        if ($user && password_verify($password, $user['password_hash'])) {
            // Get farmer profile
            $profile_stmt = $db->prepare(
                'SELECT id, user_id, full_name, province, district, farm_size, crops_grown, phone
                 FROM farmer_profiles WHERE user_id = ?'
            );
            $profile_stmt->bind_param('i', $user['id']);
            $profile_stmt->execute();
            $profile_result = $profile_stmt->get_result();
            $profile = $profile_result->fetch_assoc();
            $profile_stmt->close();

            // Generate session token
            $token = bin2hex(random_bytes(32));

            $_SESSION['user_id'] = $user['id'];
            $_SESSION['email'] = $user['email'];
            $_SESSION['token'] = $token;

            echo json_encode([
                'success' => true,
                'user_id' => $user['id'],
                'email' => $user['email'],
                'token' => $token,
                'profile' => $profile ?: null,
                'message' => 'Login successful'
            ]);
        } else {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Invalid email or password']);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Server error: ' . $e->getMessage()]);
    }
    exit();
}

// Handle signup
if ($endpoint === '/signup' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = getJsonRequestBody();

    if (!$input) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid JSON input']);
        exit;
    }

    $email = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';
    $full_name = trim($input['full_name'] ?? '');

    // Validate input
    $errors = [];
    if (empty($email)) $errors[] = 'Email is required';
    if (empty($password)) $errors[] = 'Password is required';
    if (empty($full_name)) $errors[] = 'Full name is required';

    if (!empty($errors)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => implode('; ', $errors)]);
        exit;
    }

    try {
        $db = getDB();

        // Check if email exists
        $check_stmt = $db->prepare('SELECT id FROM users WHERE email = ?');
        $check_stmt->bind_param('s', $email);
        $check_stmt->execute();
        $check_result = $check_stmt->get_result();
        $existing = $check_result->fetch_assoc();
        $check_stmt->close();

        if ($existing) {
            http_response_code(409);
            echo json_encode(['success' => false, 'error' => 'Email already registered']);
            exit;
        }

        // Hash password and insert user
        $password_hash = password_hash($password, PASSWORD_DEFAULT);
        $user_stmt = $db->prepare('INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, NOW())');
        $user_stmt->bind_param('ss', $email, $password_hash);
        $user_stmt->execute();
        $user_id = $db->insert_id;
        $user_stmt->close();

        // Insert farmer profile
        $profile_stmt = $db->prepare(
            'INSERT INTO farmer_profiles (user_id, full_name, created_at) VALUES (?, ?, NOW())'
        );
        $profile_stmt->bind_param('is', $user_id, $full_name);
        $profile_stmt->execute();
        $profile_stmt->close();

        // Generate token
        $token = bin2hex(random_bytes(32));
        $_SESSION['user_id'] = $user_id;
        $_SESSION['email'] = $email;
        $_SESSION['token'] = $token;

        // Get profile
        $profile_stmt = $db->prepare('SELECT id, user_id, full_name FROM farmer_profiles WHERE user_id = ?');
        $profile_stmt->bind_param('i', $user_id);
        $profile_stmt->execute();
        $profile_result = $profile_stmt->get_result();
        $profile = $profile_result->fetch_assoc();
        $profile_stmt->close();

        echo json_encode([
            'success' => true,
            'user_id' => $user_id,
            'email' => $email,
            'token' => $token,
            'profile' => $profile,
            'message' => 'Registration successful'
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Server error: ' . $e->getMessage()]);
    }
    exit();
}

// Handle logout
if ($endpoint === '/logout' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    session_destroy();
    echo json_encode(['success' => true, 'message' => 'Logged out']);
    exit();
}

// Handle verify-session
if ($endpoint === '/verify-session' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_SESSION['user_id'])) {
        $db = getDB();
        $profile_stmt = $db->prepare(
            'SELECT id, user_id, full_name, province, district, farm_size, crops_grown, phone
             FROM farmer_profiles WHERE user_id = ?'
        );
        $profile_stmt->bind_param('i', $_SESSION['user_id']);
        $profile_stmt->execute();
        $profile_result = $profile_stmt->get_result();
        $profile = $profile_result->fetch_assoc();
        $profile_stmt->close();

        echo json_encode([
            'success' => true,
            'user' => [
                'id' => $_SESSION['user_id'],
                'email' => $_SESSION['email']
            ],
            'profile' => $profile
        ]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Session invalid']);
    }
    exit();
}

// Handle update-profile
if ($endpoint === '/update-profile' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit();
    }

    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid JSON input']);
        exit();
    }

    try {
        $db = getDB();
        $user_id = $_SESSION['user_id'];

        // Check if profile exists
        $check_stmt = $db->prepare('SELECT id FROM farmer_profiles WHERE user_id = ?');
        $check_stmt->bind_param('i', $user_id);
        $check_stmt->execute();
        $check_result = $check_stmt->get_result();
        $existing = $check_result->fetch_assoc();
        $check_stmt->close();

        $crops_json = isset($input['crops_grown']) ? json_encode($input['crops_grown']) : null;

        if (!$existing) {
            // Insert new profile
            $insert_stmt = $db->prepare(
                'INSERT INTO farmer_profiles (user_id, full_name, farm_name, farm_location, province, phone, crops_grown, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, NOW())'
            );
            $insert_stmt->bind_param(
                'issssss',
                $user_id,
                $input['full_name'] ?? '',
                $input['farm_name'] ?? '',
                $input['farm_location'] ?? '',
                $input['province'] ?? '',
                $input['phone'] ?? '',
                $crops_json
            );
            $insert_stmt->execute();
            $insert_stmt->close();
        } else {
            // Update existing profile
            $update_stmt = $db->prepare(
                'UPDATE farmer_profiles SET
                 full_name = ?, farm_name = ?, farm_location = ?, province = ?, phone = ?, crops_grown = ?
                 WHERE user_id = ?'
            );
            $update_stmt->bind_param(
                'ssssssi',
                $input['full_name'] ?? '',
                $input['farm_name'] ?? '',
                $input['farm_location'] ?? '',
                $input['province'] ?? '',
                $input['phone'] ?? '',
                $crops_json,
                $user_id
            );
            $update_stmt->execute();
            $update_stmt->close();
        }

        // Get updated profile
        $profile_stmt = $db->prepare(
            'SELECT id, user_id, full_name, farm_name, farm_location, province, phone, crops_grown
             FROM farmer_profiles WHERE user_id = ?'
        );
        $profile_stmt->bind_param('i', $user_id);
        $profile_stmt->execute();
        $profile_result = $profile_stmt->get_result();
        $profile = $profile_result->fetch_assoc();
        $profile_stmt->close();

        if ($profile && $profile['crops_grown']) {
            $profile['crops_grown'] = json_decode($profile['crops_grown'], true);
        }

        echo json_encode(['success' => true, 'profile' => $profile]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Server error: ' . $e->getMessage()]);
    }
    exit();
}

http_response_code(404);
echo json_encode(['error' => 'Endpoint not found']);
?>
