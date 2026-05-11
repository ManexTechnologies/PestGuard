<?php
// pestid.php - local pestid (PyTorch) integration endpoint.
//
// Expected request (JSON):
//   { "imageBase64": "data:image/jpeg;base64,...", "cropType": "maize"?, "description": "..."? }
//
// Response shape (compatible with the frontend UI):
//   {
//     "identified": boolean,
//     "pests": [{ name, scientificName, type, confidence, description, damageSymptoms }],
//     "treatments": [{ name, type, description, effectiveness, cost, safetyWarning, applicationTiming }],
//     "severity": string,
//     "urgency": string,
//     "preventionTips": string[],
//     "additionalNotes": string
//   }
//
// Implementation note:
// - The current pestid project in this repo is a Python package that exposes a FastAPI server.
// - This PHP endpoint calls that FastAPI server and passes through the image.
//
// Configure:
// - Set PESTID_SERVER_URL to your FastAPI endpoint, default: http://127.0.0.1:8000/identify
// - Set PESTID_DEVICE etc. in the FastAPI service environment, not here.



// Ensure PHP parses this file as UTF-8.
// (Also helps avoid odd editor newline/encoding edge-cases.)

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$request_method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

if (strpos($path, '/analyze-pest') !== false) {
    if ($request_method === 'POST') {
        analyzePest();
        exit();
    }
}

http_response_code(404);
echo json_encode(['error' => 'Endpoint not found']);


function analyzePest() {
    // Pest scanning ML has been disabled.
    http_response_code(200);
    echo json_encode([
        'identified' => false,
        'pests' => [],
        'treatments' => [],
        'severity' => 'low',
        'urgency' => 'Scanning disabled',
        'preventionTips' => [
            'Pest scanning/AI identification is currently disabled in this app.',
            'You can still save pest sightings using manual inputs (if available elsewhere).',
        ],
        'additionalNotes' => 'No AI model is available for pest identification right now.'
    ]);
    return;
}

function analyzePest_original_unused() {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];



    $imageBase64 = $data['imageBase64'] ?? null;
    if (!$imageBase64) {
        http_response_code(400);
        echo json_encode(['error' => 'imageBase64 required']);
        return;
    }

    // cropType/description are accepted for compatibility with the existing frontend;
    // pestid itself is image-only, but we keep them to avoid breaking the UI.
    $cropType = $data['cropType'] ?? null;
    $description = $data['description'] ?? null;

    $serverUrl = getenv('PESTID_SERVER_URL') ?: 'http://127.0.0.1:8000/identify';

    // Convert base64 data URL -> raw bytes
    $base64 = $imageBase64;
    if (strpos($imageBase64, 'base64,') !== false) {
        $base64 = substr($imageBase64, strpos($imageBase64, 'base64,') + strlen('base64,'));
    }

    $imageBytes = base64_decode($base64, true);
    if ($imageBytes === false) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid imageBase64']);
        return;
    }

    // Call FastAPI server with multipart upload
    $boundary = '----pestid' . md5(uniqid('', true));
    $eol = "\r\n";

    // Determine filename/content-type best-effort
    $contentType = 'image/jpeg';
    if (strpos($imageBase64, 'data:image/png') === 0) {
        $contentType = 'image/png';
    } elseif (strpos($imageBase64, 'data:image/webp') === 0) {
        $contentType = 'image/webp';
    }

    $body = '';
    $body .= '--' . $boundary . $eol;
    $body .= 'Content-Disposition: form-data; name="file"; filename="upload"' . $eol;
    $body .= 'Content-Type: ' . $contentType . $eol . $eol;
    $body .= $imageBytes . $eol;
    $body .= '--' . $boundary . '--' . $eol;

    $ch = curl_init($serverUrl);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: multipart/form-data; boundary=' . $boundary,
        'Content-Length: ' . strlen($body),
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);

    // topk: UI only needs top match(s); ask for 3 to map to pest/treatments lists.
    // FastAPI endpoint signature includes topk query param OR form field; we use query param style.
    $urlWithTopk = $serverUrl . (strpos($serverUrl, '?') === false ? '?topk=3' : '&topk=3');
    curl_setopt($ch, CURLOPT_URL, $urlWithTopk);

    $resp = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr = curl_error($ch);
    curl_close($ch);

    if ($resp === false) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to reach pestid server: ' . $curlErr]);
        return;
    }

    $respJson = json_decode($resp, true);
    if (!is_array($respJson)) {
        http_response_code(500);
        echo json_encode(['error' => 'Invalid response from pestid server']);
        return;
    }

    // Map pestid prediction into your existing UI schema.
    // pestid FastAPI server currently returns:
    //   { top1: {label, confidence}, topk: [{label, confidence}, ...] }
    // We still need description/damageSymptoms/treatments/severity.
    // To avoid inventing content, we mark as identified with minimal fields
    // and let the UI remain functional.

    $topk = $respJson['topk'] ?? [];
    if (!is_array($topk) || count($topk) === 0) {
        http_response_code(200);
        echo json_encode([
            'identified' => false,
            'pests' => [],
            'treatments' => [],
            'severity' => 'low',
            'urgency' => 'Unable to identify pest with sufficient confidence.',
            'preventionTips' => [
                'Take a clearer photo with better lighting',
                'Ensure the pest or plant damage is in sharp focus',
                'Include both the pest and the affected plant part',
            ],
            'additionalNotes' => $description ? ('Description received: ' . $description) : 'No prediction returned.'
        ]);
        return;
    }


    // Pick top match
    $top1 = $topk[0];
    $confidence = isset($top1['confidence']) ? floatval($top1['confidence']) : 0.0;


    // For now, we set: name=label, scientificName=label, type='pest', description='', damageSymptoms=[]
    // You can later wire pestid label->your KNOWLEDGE_BASE mappings.
    $pests = [];
    foreach ($topk as $item) {
        $label = $item['label'] ?? 'unknown';
        $c = isset($item['confidence']) ? floatval($item['confidence']) : 0.0;
        $pests[] = [
            'name' => $label,
            'scientificName' => $label,
            'type' => 'pest',
            'confidence' => max(0, min(100, round($c * 100, 0))),
            'description' => '',
            'damageSymptoms' => [],
        ];
    }

    // Basic severity heuristic from confidence.
    $severity = 'low';
    if ($confidence >= 0.85) $severity = 'high';
    else if ($confidence >= 0.65) $severity = 'medium';

    $urgencyMap = [
        'critical' => 'Immediate action required! This pest can cause complete crop loss if not controlled urgently.',
        'high' => 'Urgent action recommended. This pest can cause significant damage within days.',
        'medium' => 'Action needed within a week. Monitor the situation and prepare to treat.',
        'low' => 'Monitor the situation. This pest causes limited damage but should still be managed.',
    ];

    $preventionTips = [
        'Regular field scouting at least twice a week',
        'Remove and destroy infected plant material',
        'Practice crop rotation with non-host crops',
        'Maintain field hygiene - remove crop residues after harvest',
    ];

    $additionalNotes = 'pestid model predicted: ' . ($top1['label'] ?? 'unknown') . '. Confidence: ' . round($confidence * 100, 1) . '%.';
    if ($description) {
        $additionalNotes .= ' Description received: "' . $description . '".';
    }

    // No treatments mapped yet.
    $treatments = [];

    http_response_code(200);
    echo json_encode([
        'identified' => true,
        'pests' => $pests,
        'treatments' => $treatments,
        'severity' => $severity,
        'urgency' => $urgencyMap[$severity] ?? $urgencyMap['low'],
        'preventionTips' => $preventionTips,
        'additionalNotes' => $additionalNotes
    ]);
}

