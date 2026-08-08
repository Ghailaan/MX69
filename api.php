<?php
// api.php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once "koneksi.php";

$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {

// Tambahkan case ini di dalam switch ($action) pada file api.php
case 'admin_login':
    // Ambil data JSON yang dikirim dari script.js
    $json = file_get_contents("php://input");
    $data = json_decode($json, true);
    
    $passcode = isset($data['passcode']) ? trim($data['passcode']) : '';
    
    // Kata sandi yang ditentukan
    $correct_pass = "donlando";

    if ($passcode === $correct_pass) {
        echo json_encode([
            "status" => "success", 
            "message" => "Login Berhasil"
        ]);
    } else {
        // Jangan gunakan http_response_code(401) jika fetch di JS tidak menangani HTTP Error
        echo json_encode([
            "status" => "error", 
            "message" => "Kode akses salah!"
        ]);
    }
    break;

    // 1. Ambil Semua Pricelist
    case 'get_prices':
        $resCat = $conn->query("SELECT * FROM categories ORDER BY id ASC");
        $categories = [];
        while ($cat = $resCat->fetch_assoc()) {
            $catId = $cat['id'];
            $resItems = $conn->query("SELECT id, name, price, box_qty, is_dynamic_price FROM items WHERE category_id = $catId ORDER BY id ASC");
            $items = [];
            while ($item = $resItems->fetch_assoc()) {
                $items[] = [
                    "id" => (int)$item['id'],
                    "name" => $item['name'] . ($item['box_qty'] ? " ({$item['box_qty']}pc)" : ""),
                    "price" => (float)$item['price'],
                    "is_dynamic" => (bool)$item['is_dynamic_price']
                ];
            }
            $categories[$cat['name']] = $items;
        }
        echo json_encode(["status" => "success", "data" => $categories]);
        break;

    // 2. Update Pricelist (Admin)
    case 'update_price':
        $data = json_decode(file_get_contents("php://input"), true);
        if (isset($data['id']) && isset($data['price'])) {
            $id = (int)$data['id'];
            $price = (float)$data['price'];
            $stmt = $conn->prepare("UPDATE items SET price = ? WHERE id = ?");
            $stmt->bind_param("di", $price, $id);
            if ($stmt->execute()) {
                echo json_encode(["status" => "success", "message" => "Harga berhasil diperbarui"]);
            } else {
                echo json_encode(["status" => "error", "message" => "Gagal mengupdate harga"]);
            }
            $stmt->close();
        } else {
            echo json_encode(["status" => "error", "message" => "Parameter tidak lengkap"]);
        }
        break;

    // 3. Ambil Semua Transaksi (Admin Dashboard)
    case 'get_transactions':
        $sql = "SELECT id, created_at AS tanggal, uang_hitam AS uang, foto_bukti AS foto, 
                       jenis_senjata AS senjata, jenis_peluru AS peluru, jenis_vest AS vest, 
                       catatan, status 
                FROM transactions ORDER BY created_at DESC";
        $result = $conn->query($sql);
        $transactions = [];
        while ($row = $result->fetch_assoc()) {
            $row['uang'] = (float)$row['uang'];
            $transactions[] = $row;
        }
        echo json_encode(["status" => "success", "data" => $transactions]);
        break;

    // 4. Tambah Transaksi Baru (Form User / Admin)
    case 'create_transaction':
        $data = json_decode(file_get_contents("php://input"), true);
        $uang = isset($data['uang']) ? (float)$data['uang'] : 0;
        $foto = isset($data['foto']) ? $data['foto'] : NULL;
        $senjata = isset($data['senjata']) ? $data['senjata'] : '';
        $peluru = isset($data['peluru']) ? $data['peluru'] : '';
        $vest = isset($data['vest']) ? $data['vest'] : '-';
        $catatan = isset($data['catatan']) ? $data['catatan'] : '';
        $status = isset($data['status']) ? $data['status'] : 'pending';

        if ($uang <= 0 || empty($senjata) || empty($peluru)) {
            echo json_encode(["status" => "error", "message" => "Data tidak lengkap"]);
            exit();
        }

        $stmt = $conn->prepare("INSERT INTO transactions (uang_hitam, foto_bukti, jenis_senjata, jenis_peluru, jenis_vest, catatan, status) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("dssssss", $uang, $foto, $senjata, $peluru, $vest, $catatan, $status);
        
        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Transaksi berhasil disimpan"]);
        } else {
            echo json_encode(["status" => "error", "message" => "Gagal menyimpan ke database"]);
        }
        $stmt->close();
        break;

    // 5. Update Transaksi (Admin Modal)
    case 'update_transaction':
        $data = json_decode(file_get_contents("php://input"), true);
        $id = (int)$data['id'];
        $uang = (float)$data['uang'];
        $senjata = $data['senjata'];
        $peluru = $data['peluru'];
        $vest = isset($data['vest']) ? $data['vest'] : '-';
        $catatan = $data['catatan'];
        $status = $data['status'];
        $foto = isset($data['foto']) ? $data['foto'] : NULL;

        if ($foto) {
            $stmt = $conn->prepare("UPDATE transactions SET uang_hitam=?, jenis_senjata=?, jenis_peluru=?, jenis_vest=?, catatan=?, status=?, foto_bukti=? WHERE id=?");
            $stmt->bind_param("dssssssi", $uang, $senjata, $peluru, $vest, $catatan, $status, $foto, $id);
        } else {
            $stmt = $conn->prepare("UPDATE transactions SET uang_hitam=?, jenis_senjata=?, jenis_peluru=?, jenis_vest=?, catatan=?, status=? WHERE id=?");
            $stmt->bind_param("dsssssi", $uang, $senjata, $peluru, $vest, $catatan, $status, $id);
        }

        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Data berhasil diperbarui"]);
        } else {
            echo json_encode(["status" => "error", "message" => "Gagal mengupdate database"]);
        }
        $stmt->close();
        break;

    // 6. Hapus Transaksi (Admin)
    case 'delete_transaction':
        $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
        if ($id > 0) {
            $stmt = $conn->prepare("DELETE FROM transactions WHERE id = ?");
            $stmt->bind_param("i", $id);
            if ($stmt->execute()) {
                echo json_encode(["status" => "success", "message" => "Transaksi berhasil dihapus"]);
            } else {
                echo json_encode(["status" => "error", "message" => "Gagal menghapus data"]);
            }
            $stmt->close();
        } else {
            echo json_encode(["status" => "error", "message" => "ID tidak valid"]);
        }
        break;

    default:
        echo json_encode(["status" => "error", "message" => "Aksi tidak dikenal"]);
        break;
}

$conn->close();
?>