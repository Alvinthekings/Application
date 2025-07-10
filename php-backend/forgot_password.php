<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");

require_once 'db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);

$email = $data['email'];

$stmt = $conn->prepare("SELECT id FROM guards WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $token = bin2hex(random_bytes(32));
    $expires = date("Y-m-d H:i:s", time() + 3600);
    
    $stmt = $conn->prepare("UPDATE guards SET reset_token = ?, reset_expires = ? WHERE email = ?");
    $stmt->bind_param("sss", $token, $expires, $email);
    $stmt->execute();
    
    echo json_encode([
        "success" => true,
        "message" => "Password reset link sent to your email",
        "token" => $token
    ]);
} else {
    echo json_encode(["success" => false, "message" => "Email not found"]);
}

$stmt->close();
$conn->close();
?>