<?php
require_once 'db_connect.php';

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Invalid request method"]);
    exit;
}

// Validate required fields
if (!isset($_POST['id'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Missing required fields"]);
    exit;
}

$id = (int)$_POST['id'];
$full_name = $_POST['full_name'] ?? '';
$email = $_POST['email'] ?? '';
$address = $_POST['address'] ?? '';
$contact_number = $_POST['contact_number'] ?? '';
$password = $_POST['password'] ?? null;
$profile_photo = null;

// Handle file upload
if (!empty($_FILES['profile_photo']['name'])) {
    $target_dir = __DIR__ . "/uploads/";
    
    // Create uploads directory if not exists
    if (!file_exists($target_dir)) {
        if (!mkdir($target_dir, 0755, true)) {
            error_log("Failed to create uploads directory");
        }
    }
    
    $file_ext = pathinfo($_FILES['profile_photo']['name'], PATHINFO_EXTENSION);
    $file_name = "profile_{$id}_" . time() . ".{$file_ext}";
    $target_file = $target_dir . $file_name;

    if (move_uploaded_file($_FILES['profile_photo']['tmp_name'], $target_file)) {
        $profile_photo = "uploads/" . $file_name;
    }
}

try {
    // Build SQL dynamically
    $sql = "UPDATE users SET full_name = ?, email = ?, address = ?, contact_number = ?";
    $params = [$full_name, $email, $address, $contact_number];
    $types = "ssss";
    
    // Add password if provided
    if ($password) {
        $sql .= ", password = ?";
        $params[] = password_hash($password, PASSWORD_DEFAULT);
        $types .= "s";
    }
    
    // Add profile photo if uploaded
    if ($profile_photo) {
        $sql .= ", profile_photo = ?";
        $params[] = $profile_photo;
        $types .= "s";
    }
    
    $sql .= " WHERE id = ?";
    $params[] = $id;
    $types .= "i";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param($types, ...$params);
    
    if ($stmt->execute()) {
        $response = ["success" => true, "message" => "Profile updated successfully"];
        if ($profile_photo) {
            $response["profile_photo"] = $profile_photo;
        }
        echo json_encode($response);
    } else {
        throw new Exception("Update failed: " . $stmt->error);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
} finally {
    if (isset($stmt)) $stmt->close();
    $conn->close();
}
?>