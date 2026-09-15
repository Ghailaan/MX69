<?php
// test_db.php
require_once "koneksi.php";

if ($conn) {
    echo "<h2 style='color:green;'>✓ Koneksi ke Database MySQL Berhasil!</h2>";
    
    // Cek apakah tabel transactions ada
    $check = $conn->query("SHOW TABLES LIKE 'transactions'");
    if ($check->num_rows > 0) {
        echo "<p>✓ Tabel <b>transactions</b> ditemukan.</p>";
    } else {
        echo "<p style='color:red;'>✗ Tabel <b>transactions</b> BELUM dibuat! Silakan jalankan query SQL pembuatan tabel.</p>";
    }
}
?>