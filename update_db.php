<?php
require_once "koneksi.php";

// Query untuk menambahkan kolom nama_pembeli
$sql = "ALTER TABLE transactions ADD COLUMN nama_pembeli VARCHAR(100) NOT NULL AFTER id";

if ($conn->query($sql) === TRUE) {
    echo "<h1 style='color:green; font-family:sans-serif;'>✓ SUCCESS! Kolom nama_pembeli berhasil ditambahkan ke database Aiven.</h1>";
} else {
    echo "<h1 style='color:red; font-family:sans-serif;'>✗ ERROR: " . $conn->error . "</h1>";
}
?>