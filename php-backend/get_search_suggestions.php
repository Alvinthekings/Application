<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Disable error display in production
error_reporting(0);
ini_set('display_errors', 0);

require_once 'db_connect.php';

try {
    $json = file_get_contents('php://input');
    if ($json === false) {
        throw new Exception("Failed to read input data");
    }

    $data = json_decode($json, true);
    if ($data === null) {
        throw new Exception("Invalid JSON data");
    }

    $query = $data['query'] ?? '';
    $searchType = $data['type'] ?? 'student_name';

    if (strlen($query) < 2) {
        echo json_encode([
            'success' => true,
            'suggestions' => []
        ]);
        exit;
    }

    $sql = "SELECT DISTINCT ";
    
    if ($searchType === 'student_name') {
        $sql .= "student_name AS suggestion FROM violations WHERE student_name LIKE ?";
    } else {
        $sql .= "violation_type AS suggestion FROM violations WHERE violation_type LIKE ?";
    }

    $sql .= " ORDER BY suggestion ASC LIMIT 10";

    $stmt = $conn->prepare($sql);
    if ($stmt === false) {
        throw new Exception("SQL preparation failed: " . $conn->error);
    }

    $searchParam = $query . '%';
    $stmt->bind_param('s', $searchParam);
    
    if (!$stmt->execute()) {
        throw new Exception("Execution failed: " . $stmt->error);
    }

    $result = $stmt->get_result();
    $suggestions = $result->fetch_all(MYSQLI_ASSOC);

    // Extract just the suggestion values
    $suggestions = array_column($suggestions, 'suggestion');

    echo json_encode([
        'success' => true,
        'suggestions' => $suggestions
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>