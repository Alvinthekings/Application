<?php
require_once 'db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "message" => "Invalid request method"]);
    exit;
}

// Input validation
if (empty($data['username']) || empty($data['email']) || empty($data['password'])) {
    echo json_encode(["success" => false, "message" => "All fields are required"]);
    exit;
}

$username = $conn->real_escape_string($data['username']);
$email = $conn->real_escape_string($data['email']);
$password = password_hash($data['password'], PASSWORD_BCRYPT);

// Check if user exists (NOW USING `users` table)
$check = $conn->query("SELECT * FROM users WHERE username='$username' OR email='$email'");
if ($check->num_rows > 0) {
    echo json_encode(["success" => false, "message" => "Username or email already exists"]);
    exit;
}

// Insert new user (NOW USING `users` table)
$stmt = $conn->prepare("INSERT INTO users (username, email, password, created_at) VALUES (?, ?, ?, NOW())");
$stmt->bind_param("sss", $username, $email, $password);

if ($stmt->execute()) {
    $user_id = $stmt->insert_id;
    echo json_encode([
        "success" => true,
        "message" => "Registration successful",
        "user" => [
            "id" => $user_id,
            "username" => $username,
            "email" => $email
        ]
    ]);
} else {
    echo json_encode(["success" => false, "message" => "Registration failed: " . $conn->error]);
}

$stmt->close();
$conn->close();
?>
