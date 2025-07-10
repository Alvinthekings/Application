<?php
require_once 'db_connect.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "message" => "Invalid request method"]);
    exit;
}

$id = $_POST['id'];

$stmt = $conn->prepare("SELECT full_name, email, address, contact_number, profile_photo FROM users WHERE id = ?");
$stmt->bind_param("i", $id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $profile = $result->fetch_assoc();
    echo json_encode([
        "success" => true,
        "profile" => $profile
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "Profile not found"
    ]);
}

$stmt->close();
$conn->close();
?>