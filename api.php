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

// 0. MIGRASI SKEMA DATABASE AIVEN
case 'migrate_db':
    $checkCol = $conn->query("SHOW COLUMNS FROM transactions LIKE 'nama_pembeli'");
    if ($checkCol && $checkCol->num_rows == 0) {
        $conn->query("ALTER TABLE transactions ADD COLUMN nama_pembeli VARCHAR(100) NOT NULL AFTER id");
    }

    $conn->query("CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    $conn->query("CREATE TABLE IF NOT EXISTS items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        price DECIMAL(15,2) NOT NULL,
        box_qty INT DEFAULT NULL,
        description TEXT DEFAULT NULL,
        is_dynamic_price TINYINT(1) DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    )");

    echo json_encode([
        "status" => "success", 
        "message" => "Database Aiven Berhasil Di-update ke Skema Terbaru!"
    ]);
    break;

case 'admin_login':
    $json = file_get_contents("php://input");
    $data = json_decode($json, true);
    $passcode = isset($data['passcode']) ? trim($data['passcode']) : '';
    $correct_pass = "donlando";

    if ($passcode === $correct_pass) {
        echo json_encode(["status" => "success", "message" => "Login Berhasil"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Kode akses salah!"]);
    }
    break;

    // 1. Ambil Semua Pricelist
    case 'get_prices':
        $resCat = $conn->query("SELECT * FROM categories ORDER BY id ASC");
        $categories = [];
        if ($resCat) {
            while ($cat = $resCat->fetch_assoc()) {
                $catId = $cat['id'];
                $resItems = $conn->query("SELECT id, name, price, box_qty, is_dynamic_price FROM items WHERE category_id = $catId ORDER BY id ASC");
                $items = [];
                if ($resItems) {
                    while ($item = $resItems->fetch_assoc()) {
                        $items[] = [
                            "id" => (int)$item['id'],
                            "name" => $item['name'] . ($item['box_qty'] ? " ({$item['box_qty']}pc)" : ""),
                            "price" => (float)$item['price'],
                            "is_dynamic" => (bool)$item['is_dynamic_price']
                        ];
                    }
                }
                $categories[$cat['name']] = $items;
            }
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

    // 3. Tambah Barang Baru (Admin)
    case 'add_item':
        $data = json_decode(file_get_contents("php://input"), true);
        $category_id = isset($data['category_id']) ? (int)$data['category_id'] : 0;
        $name = isset($data['name']) ? trim($data['name']) : '';
        $price = isset($data['price']) ? (float)$data['price'] : 0;

        if ($category_id <= 0 || empty($name) || $price <= 0) {
            echo json_encode(["status" => "error", "message" => "Data barang tidak lengkap"]);
            exit();
        }

        $stmt = $conn->prepare("INSERT INTO items (category_id, name, price) VALUES (?, ?, ?)");
        $stmt->bind_param("isd", $category_id, $name, $price);

        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Barang baru berhasil ditambahkan"]);
        } else {
            echo json_encode(["status" => "error", "message" => "Gagal menambahkan barang ke database"]);
        }
        $stmt->close();
        break;

    // 4. Ambil Transaksi
    case 'get_transactions':
        $sql = "SELECT id, nama_pembeli AS nama, created_at AS tanggal, uang_hitam AS uang, foto_bukti AS foto, 
                       jenis_senjata AS senjata, jenis_peluru AS peluru, jenis_vest AS vest, 
                       catatan, status 
                FROM transactions ORDER BY created_at DESC";
        $result = $conn->query($sql);
        $transactions = [];
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $row['uang'] = (float)$row['uang'];
                $transactions[] = $row;
            }
        }
        echo json_encode(["status" => "success", "data" => $transactions]);
        break;

    // 5. Tambah Transaksi (User)
    case 'create_transaction':
        $data = json_decode(file_get_contents("php://input"), true);
        $nama = isset($data['nama']) ? trim($data['nama']) : '';
        $uang = isset($data['uang']) ? (float)$data['uang'] : 0;
        $foto = isset($data['foto']) ? $data['foto'] : NULL;
        $senjata = isset($data['senjata']) ? $data['senjata'] : '';
        $peluru = isset($data['peluru']) ? $data['peluru'] : '';
        $vest = isset($data['vest']) ? $data['vest'] : '-';
        $catatan = isset($data['catatan']) ? $data['catatan'] : '';
        $status = isset($data['status']) ? $data['status'] : 'pending';

        if (empty($nama) || $uang <= 0) {
            echo json_encode(["status" => "error", "message" => "Nama dan jumlah uang wajib diisi"]);
            exit();
        }

        $stmt = $conn->prepare("INSERT INTO transactions (nama_pembeli, uang_hitam, foto_bukti, jenis_senjata, jenis_peluru, jenis_vest, catatan, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("sdssssss", $nama, $uang, $foto, $senjata, $peluru, $vest, $catatan, $status);
        
        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Transaksi berhasil disimpan"]);
        } else {
            echo json_encode(["status" => "error", "message" => "Gagal menyimpan ke database"]);
        }
        $stmt->close();
        break;

    // 6. Update Transaksi (Admin)
    case 'update_transaction':
        $data = json_decode(file_get_contents("php://input"), true);
        $id = (int)$data['id'];
        $nama = trim($data['nama']);
        $uang = (float)$data['uang'];
        $senjata = $data['senjata'];
        $peluru = $data['peluru'];
        $vest = isset($data['vest']) ? $data['vest'] : '-';
        $catatan = $data['catatan'];
        $status = $data['status'];
        $foto = isset($data['foto']) ? $data['foto'] : NULL;

        if ($foto) {
            $stmt = $conn->prepare("UPDATE transactions SET nama_pembeli=?, uang_hitam=?, jenis_senjata=?, jenis_peluru=?, jenis_vest=?, catatan=?, status=?, foto_bukti=? WHERE id=?");
            $stmt->bind_param("sdssssssi", $nama, $uang, $senjata, $peluru, $vest, $catatan, $status, $foto, $id);
        } else {
            $stmt = $conn->prepare("UPDATE transactions SET nama_pembeli=?, uang_hitam=?, jenis_senjata=?, jenis_peluru=?, jenis_vest=?, catatan=?, status=? WHERE id=?");
            $stmt->bind_param("sdsssssi", $nama, $uang, $senjata, $peluru, $vest, $catatan, $status, $id);
        }

        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Data berhasil diperbarui"]);
        } else {
            echo json_encode(["status" => "error", "message" => "Gagal mengupdate database"]);
        }
        $stmt->close();
        break;

    // 7. Hapus Transaksi (Admin)
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