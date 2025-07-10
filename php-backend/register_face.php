<?php
require_once("db_connect.php");

// PHP Server Configuration
ini_set('memory_limit', '256M');
ini_set('upload_max_filesize', '10M');
ini_set('post_max_size', '12M');
ini_set('max_execution_time', '300');
ini_set('mysql.connect_timeout', 60);
ini_set('default_socket_timeout', 60);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

$response = ["success" => false, "message" => ""];

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception("Only POST requests are allowed");
    }

    if (!isset($_FILES['image'])) {
        throw new Exception("No image file uploaded");
    }

    if ($_FILES['image']['error'] !== UPLOAD_ERR_OK) {
        throw new Exception("Upload error: " . $_FILES['image']['error']);
    }

    if ($_FILES['image']['size'] > 5000000) {
        throw new Exception("Image too large. Max 5MB allowed");
    }

    $allowed_types = ['image/jpeg', 'image/png'];
    $file_type = mime_content_type($_FILES['image']['tmp_name']);
    if (!in_array($file_type, $allowed_types)) {
        throw new Exception("Invalid file type. Only JPG/PNG allowed");
    }

    // Get input fields
    $name = isset($_POST['name']) ? trim($conn->real_escape_string($_POST['name'])) : '';
    $LRN = isset($_POST['LRN']) ? trim($conn->real_escape_string($_POST['LRN'])) : '';
    $Grade_level = isset($_POST['Grade_level']) ? trim($conn->real_escape_string($_POST['Grade_level'])) : '';
    $section = isset($_POST['section']) ? trim($conn->real_escape_string($_POST['section'])) : '';

    if (empty($name) || empty($LRN) || empty($Grade_level) || empty($section)) {
        throw new Exception("All fields are required");
    }

    // Image data
    $image_data = file_get_contents($_FILES['image']['tmp_name']);

    // Insert data using prepared statement
    $stmt = $conn->prepare("INSERT INTO studentd (name, LRN, Grade_level, section, photo) VALUES (?, ?, ?, ?, ?)");

    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }

    $null = null;
    $stmt->bind_param("ssssb", $name, $LRN, $Grade_level, $section, $null);
    $stmt->send_long_data(4, $image_data);

    if ($stmt->execute()) {
        $response["success"] = true;
        $response["message"] = "Student registered successfully!";
    } else {
        throw new Exception("Execute failed: " . $stmt->error);
    }

} catch (Exception $e) {
    $response["message"] = "Server Error: " . $e->getMessage();
    error_log("Register Error: " . $e->getMessage());
} finally {
    if (isset($stmt)) $stmt->close();
    if (isset($conn)) $conn->close();
    echo json_encode($response);
}
?>
