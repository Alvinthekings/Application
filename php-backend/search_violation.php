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

    if (empty($query)) {
        throw new Exception("Search query is required");
    }

    // Updated query without guard_id reference
    $sql = "SELECT 
            id,
            student_id,
            student_name,
            grade_level,
            section,
            violation_type,
            date,
            status,
            evidence_image,
            confidence
        FROM violations
        WHERE ";

    if ($searchType === 'student_name') {
        $sql .= "student_name LIKE ?";
    } else {
        $sql .= "violation_type LIKE ?";
    }

    $sql .= " ORDER BY date DESC LIMIT 50";

    $stmt = $conn->prepare($sql);
    if ($stmt === false) {
        throw new Exception("SQL preparation failed: " . $conn->error);
    }

    $params = ["%$query%"];
    $types = str_repeat('s', count($params));
    $stmt->bind_param($types, ...$params);
    
    if (!$stmt->execute()) {
        throw new Exception("Execution failed: " . $stmt->error);
    }

    $result = $stmt->get_result();
    $violations = $result->fetch_all(MYSQLI_ASSOC);

    // Format dates
    foreach ($violations as &$violation) {
        $violation['date_formatted'] = date('M d, Y h:i A', strtotime($violation['date']));
        $violation['reported_by'] = 'System'; // Default value since we don't have guard info
    }

    echo json_encode([
        'success' => true,
        'violations' => $violations
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>