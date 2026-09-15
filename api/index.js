// api/index.js
const mysql = require('mysql2/promise');

// Pool Koneksi ke Database Cloud Aiven
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 23531,
  ssl: { rejectUnauthorized: false },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = async (req, res) => {
  // CORS Header
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;

  try {
    // 1. Admin Login
    if (action === 'admin_login') {
      const { passcode } = req.body || {};
      if (passcode === "donlando") {
        return res.json({ status: 'success', message: 'Login Berhasil' });
      } else {
        return res.json({ status: 'error', message: 'Kode akses salah!' });
      }
    }

    // 2. Get All Prices (Pricelist)
    if (action === 'get_prices') {
      const [categories] = await pool.query('SELECT * FROM categories ORDER BY id ASC');
      const data = {};

      for (const cat of categories) {
        const [items] = await pool.query(
          'SELECT id, name, price, box_qty, is_dynamic_price FROM items WHERE category_id = ? ORDER BY id ASC',
          [cat.id]
        );

        data[cat.name] = items.map(item => ({
          id: Number(item.id),
          name: item.name + (item.box_qty ? ` (${item.box_qty}pc)` : ''),
          price: Number(item.price),
          is_dynamic: Boolean(item.is_dynamic_price)
        }));
      }

      return res.json({ status: 'success', data });
    }

    // 3. Update Item Price
    if (action === 'update_price') {
      const { id, price } = req.body || {};
      if (id && price !== undefined) {
        await pool.query('UPDATE items SET price = ? WHERE id = ?', [price, id]);
        return res.json({ status: 'success', message: 'Harga berhasil diperbarui' });
      }
      return res.json({ status: 'error', message: 'Parameter tidak lengkap' });
    }

    // 4. Get All Transactions
    if (action === 'get_transactions') {
      const [rows] = await pool.query(
        'SELECT id, created_at AS tanggal, uang_hitam AS uang, foto_bukti AS foto, jenis_senjata AS senjata, jenis_peluru AS peluru, jenis_vest AS vest, catatan, status FROM transactions ORDER BY created_at DESC'
      );
      const formatted = rows.map(r => ({ ...r, uang: Number(r.uang) }));
      return res.json({ status: 'success', data: formatted });
    }

    // 5. Create Transaction (Opsional untuk Senjata, Peluru, atau Vest)
    if (action === 'create_transaction') {
      const { uang, foto, senjata, peluru, vest, catatan, status } = req.body || {};
      if (!uang || Number(uang) <= 0) {
        return res.json({ status: 'error', message: 'Uang hitam harus diisi' });
      }

      const sql = 'INSERT INTO transactions (uang_hitam, foto_bukti, jenis_senjata, jenis_peluru, jenis_vest, catatan, status) VALUES (?, ?, ?, ?, ?, ?, ?)';
      await pool.query(sql, [
        uang,
        foto || null,
        senjata || '-',
        peluru || '-',
        vest || '-',
        catatan || '',
        status || 'pending'
      ]);

      return res.json({ status: 'success', message: 'Transaksi berhasil disimpan' });
    }

    // 6. Update Transaction
    if (action === 'update_transaction') {
      const { id, uang, senjata, peluru, vest, catatan, status, foto } = req.body || {};
      const sql = foto 
        ? 'UPDATE transactions SET uang_hitam=?, jenis_senjata=?, jenis_peluru=?, jenis_vest=?, catatan=?, status=?, foto_bukti=? WHERE id=?'
        : 'UPDATE transactions SET uang_hitam=?, jenis_senjata=?, jenis_peluru=?, jenis_vest=?, catatan=?, status=? WHERE id=?';
      
      const params = foto 
        ? [uang, senjata, peluru, vest || '-', catatan, status, foto, id]
        : [uang, senjata, peluru, vest || '-', catatan, status, id];

      await pool.query(sql, params);
      return res.json({ status: 'success', message: 'Data berhasil diperbarui' });
    }

    // 7. Delete Transaction
    if (action === 'delete_transaction') {
      const { id } = req.query;
      if (id) {
        await pool.query('DELETE FROM transactions WHERE id = ?', [id]);
        return res.json({ status: 'success', message: 'Transaksi berhasil dihapus' });
      }
      return res.json({ status: 'error', message: 'ID tidak valid' });
    }

    return res.status(400).json({ status: 'error', message: 'Aksi tidak dikenal' });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};