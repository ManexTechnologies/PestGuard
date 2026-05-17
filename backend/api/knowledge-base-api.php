<?php
// backend/api/knowledge_base.php
// Endpoint to manage the knowledge base

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? null;

if ($method === 'GET') {
    handleGetRequest($action);
} elseif ($method === 'POST') {
    handlePostRequest($action);
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
}

function handleGetRequest($action) {
    $db = getDB();
    
    if ($action === 'search') {
        $query = $_GET['q'] ?? '';
        $type = $_GET['type'] ?? null;
        
        if (empty($query)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Search query required']);
            return;
        }
        
        // Search in knowledge base
        $sql = "SELECT * FROM knowledge_base WHERE pest_name LIKE ? OR description LIKE ?";
        if ($type) {
            $sql .= " AND pest_type = ?";
        }
        $sql .= " ORDER BY is_verified DESC, verification_count DESC LIMIT 50";
        
        $search_term = '%' . $query . '%';
        
        if ($type) {
            $stmt = $db->prepare($sql);
            $stmt->bind_param('sss', $search_term, $search_term, $type);
        } else {
            $stmt = $db->prepare($sql);
            $stmt->bind_param('ss', $search_term, $search_term);
        }
        
        if (!$stmt->execute()) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Search failed']);
            return;
        }
        
        $result = $stmt->get_result();
        $pests = [];
        
        while ($row = $result->fetch_assoc()) {
            $pests[] = $row;
        }
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => $pests,
            'count' => count($pests)
        ]);
        
        $stmt->close();
    } elseif ($action === 'get_all') {
        // Get all knowledge base entries
        $limit = (int)($_GET['limit'] ?? 100);
        $offset = (int)($_GET['offset'] ?? 0);
        
        $sql = "SELECT id, pest_name, scientific_name, pest_type, description, affected_crops, 
                 is_verified, verification_count, created_at, reported_by_user_id
                 FROM knowledge_base 
                 ORDER BY is_verified DESC, created_at DESC 
                 LIMIT ? OFFSET ?";
        
        $stmt = $db->prepare($sql);
        $stmt->bind_param('ii', $limit, $offset);
        
        if (!$stmt->execute()) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Fetch failed']);
            return;
        }
        
        $result = $stmt->get_result();
        $pests = [];
        
        while ($row = $result->fetch_assoc()) {
            if ($row['affected_crops']) {
                $row['affected_crops'] = json_decode($row['affected_crops'], true);
            }
            $pests[] = $row;
        }
        
        // Get total count
        $count_result = $db->query("SELECT COUNT(*) as total FROM knowledge_base");
        $count_row = $count_result->fetch_assoc();
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => $pests,
            'count' => count($pests),
            'total' => (int)$count_row['total']
        ]);
        
        $stmt->close();
    } else {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid action']);
    }
}

function handlePostRequest($action) {
    $db = getDB();
    $input = json_decode(file_get_contents('php://input'), true);
    
    if ($action === 'add_report') {
        // Add a user report to knowledge base
        $pest_name = $input['pest_name'] ?? null;
        $pest_type = $input['pest_type'] ?? null;
        $description = $input['description'] ?? null;
        $user_id = $input['user_id'] ?? null;
        $image_url = $input['image_url'] ?? null;
        
        if (!$pest_name) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'pest_name required']);
            return;
        }
        
        // Check if pest already in knowledge base
        $check_sql = "SELECT id FROM knowledge_base WHERE pest_name = ?";
        $check_stmt = $db->prepare($check_sql);
        $check_stmt->bind_param('s', $pest_name);
        $check_stmt->execute();
        $check_result = $check_stmt->get_result();
        
        if ($check_result->num_rows > 0) {
            // Update verification count
            $row = $check_result->fetch_assoc();
            $id = $row['id'];
            
            $update_sql = "UPDATE knowledge_base SET verification_count = verification_count + 1, updated_at = NOW() WHERE id = ?";
            $update_stmt = $db->prepare($update_sql);
            $update_stmt->bind_param('i', $id);
            $update_stmt->execute();
            $update_stmt->close();
            
            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Report verified for existing pest', 'created' => false]);
        } else {
            // Insert new pest
            $insert_sql = "INSERT INTO knowledge_base (pest_name, pest_type, description, image_url, reported_by_user_id, created_at) 
                          VALUES (?, ?, ?, ?, ?, NOW())";
            $insert_stmt = $db->prepare($insert_sql);
            $insert_stmt->bind_param('ssssi', $pest_name, $pest_type, $description, $image_url, $user_id);
            
            if (!$insert_stmt->execute()) {
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => 'Failed to add report']);
                return;
            }
            
            $insert_stmt->close();
            
            http_response_code(201);
            echo json_encode(['success' => true, 'message' => 'New pest added to knowledge base', 'created' => true]);
        }
        
        $check_stmt->close();
    } else {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid action']);
    }
}
?>
