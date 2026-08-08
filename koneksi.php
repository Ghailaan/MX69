<?php
// koneksi.php (Versi Online Server)

// 1. Host (Biasanya 'localhost', tapi beberapa hosting seperti MySQL Remote menggunakan IP/Domain khusus)
$host = "localhost"; 

// 2. Username database dari Hosting (Contoh cPanel: u123456_userblackmarket)
$user = "NAMA_USER_DATABASE_HOSTING"; 

// 3. Password user database yang Anda buat di Hosting
$pass = "PASSWORD_DATABASE_HOSTING"; 

// 4. Nama Database dari Hosting (Contoh cPanel: u123456_blackmarket_db)
$dbname = "NAMA_DATABASE_HOSTING"; 

// Matikan error reporting bawaan agar tidak merusak respon JSON di frontend
mysqli_report(MYSQLI_REPORT_OFF);

$conn = @new mysqli($host, $user, $pass, $dbname);

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