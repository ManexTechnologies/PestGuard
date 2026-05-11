<?php
require_once __DIR__ . '/../config/database.php';

$request_method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Route requests
if (strpos($path, '/knowledge-base') !== false) {
    if ($request_method === 'GET') {
        getArticles();
    } elseif ($request_method === 'POST') {
        createArticle();
    }
} else {
    http_response_code(404);
    echo json_encode(['error' => 'Endpoint not found']);
}

function getArticles() {
    $pest_type = $_GET['pest_type'] ?? null;
    $search = $_GET['search'] ?? null;

    $db = getDB();
    $query_str = 'SELECT id, title, pest_type, content, symptoms, prevention, treatment FROM knowledge_base WHERE 1=1';
    
    if ($pest_type) {
        $query_str .= ' AND pest_type = ?';
    }
    if ($search) {
        $query_str .= ' AND (title LIKE ? OR content LIKE ?)';
    }
    
    $query_str .= ' ORDER BY created_at DESC';
    
    $query = $db->prepare($query_str);
    
    if ($pest_type && $search) {
        $search_pattern = '%' . $search . '%';
        $query->bind_param('sss', $pest_type, $search_pattern, $search_pattern);
    } elseif ($pest_type) {
        $query->bind_param('s', $pest_type);
    } elseif ($search) {
        $search_pattern = '%' . $search . '%';
        $query->bind_param('ss', $search_pattern, $search_pattern);
    }
    
    $query->execute();
    $result = $query->get_result();

    $articles = [];
    while ($row = $result->fetch_assoc()) {
        $row['symptoms'] = json_decode($row['symptoms'], true) ?? [];
        $row['prevention'] = json_decode($row['prevention'], true) ?? [];
        $row['treatment'] = json_decode($row['treatment'], true) ?? [];
        $articles[] = $row;
    }

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => $articles
    ]);
}

function createArticle() {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['title'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Title required']);
        return;
    }

    $title = $data['title'];
    $pest_type = $data['pest_type'] ?? null;
    $content = $data['content'] ?? null;
    $symptoms = json_encode($data['symptoms'] ?? []);
    $prevention = json_encode($data['prevention'] ?? []);
    $treatment = json_encode($data['treatment'] ?? []);

    $db = getDB();

    $query = $db->prepare(
        'INSERT INTO knowledge_base (title, pest_type, content, symptoms, prevention, treatment) 
         VALUES (?, ?, ?, ?, ?, ?)'
    );

    $query->bind_param('ssssss', $title, $pest_type, $content, $symptoms, $prevention, $treatment);

    if (!$query->execute()) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create article']);
        return;
    }

    http_response_code(201);
    echo json_encode([
        'success' => true,
        'article_id' => $db->insert_id,
        'message' => 'Knowledge base article created'
    ]);
}
?>
