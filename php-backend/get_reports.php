<?php
header('Content-Type: application/json');

// Database connection
$servername = "localhost";
$username = "your_username";
$password = "your_password";
$dbname = "your_database";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die(json_encode([
        'success' => false,
        'message' => 'Database connection failed'
    ]));
}

// Fetch reports
$sql = "SELECT * FROM reports ORDER BY timestamp DESC";
$result = $conn->query($sql);

if ($result->num_rows > 0) {
    $reports = [];
    while($row = $result->fetch_assoc()) {
        $reports[] = $row;
    }
    echo json_encode([
        'success' => true,
        'data' => $reports
    ]);
} else {
    echo json_encode([
        'success' => true,
        'data' => [],
        'message' => 'No reports found'
    ]);
}

$conn->close();
?>