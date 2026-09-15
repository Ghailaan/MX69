<?php
// koneksi.php
$host = "blackmarket-blackmarket-mx.l.aivencloud.com"; 
$user = "avnadmin"; 
// Ganti password asli dengan variabel getenv agar tidak terdeteksi rahasia oleh GitHub
$pass = getenv('DB_PASS') ?: "AVNS_DUMMY_PASSWORD"; 
$dbname = "defaultdb"; 
$port = 23531;

mysqli_report(MYSQLI_REPORT_OFF);

$conn = @new mysqli($host, $user, $pass, $dbname, $port);

if ($conn->connect_error) {
    header("Content-Type: application/json; charset=UTF-8");
    http_response_code(500);
    echo json_encode([
        "status" => "error", 
        "message" => "Gagal terhubung ke MySQL Server: " . $conn->connect_error
    ]);
    exit();
}

$conn->set_charset("utf8mb4");
?>