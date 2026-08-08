/* ============== KONFIGURASI ============== */
const ADMIN_PASSCODE = "donlando";

// Path ke API Serverless Vercel
const API_URL = "/api";

let allData = [];
let editingId = null;
let currentPrices = {};
let userFotoData = null;
let modalFotoData = null;

function goTo(view){
  if(view === 'admin' || view === 'user'){
    loadPrices().then(() => {
      document.querySelectorAll('body > div[id^="view-"]').forEach(el => el.classList.add('hidden'));
      document.getElementById('view-' + view).classList.remove('hidden');
      window.scrollTo(0,0);
      if(view === 'admin'){ loadData(); }
      if(view === 'user'){ renderPriceList(); }
    });
  } else {
    document.querySelectorAll('body > div[id^="view-"]').forEach(el => el.classList.add('hidden'));
    document.getElementById('view-' + view).classList.remove('hidden');
    window.scrollTo(0,0);
  }
}

function formatRupiah(n){
  n = Number(n) || 0;
  return 'Rp ' + n.toLocaleString('id-ID');
}
function formatDate(iso){
  if(!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', {day:'2-digit', month:'short', year:'numeric'}) + ' ' +
         d.toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'});
}
function showBanner(el, type, msg){
  el.className = 'banner show ' + type;
  el.textContent = msg;
}
function toggleCustom(prefix){
  const sel = document.getElementById(prefix + '-select');
  const custom = document.getElementById(prefix + '-custom');
  if(!sel || !custom) return;
  if(sel.value === 'Lainnya'){ custom.classList.remove('hidden'); custom.focus(); }
  else{ custom.classList.add('hidden'); custom.value=''; }
}

function resizeImage(file, maxDim, quality){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        let w = img.width, h = img.height;
        if(w > h && w > maxDim){ h = Math.round(h * maxDim / w); w = maxDim; }
        else if(h > maxDim){ w = Math.round(w * maxDim / h); h = maxDim; }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Fetch Pricelist dari API
async function loadPrices(){
  try{
    const res = await fetch(`${API_URL}?action=get_prices`);
    const json = await res.json();
    if(json.status === 'success'){
      currentPrices = json.data;
    }
  }catch(e){
    console.error('loadPrices error', e);
  }
}

function formatPriceDisplay(amount){
  if(amount >= 1000000) return 'Rp ' + (amount/1000000).toFixed(1) + 'M';
  if(amount >= 1000) return 'Rp ' + (amount/1000).toFixed(0) + 'K';
  return formatRupiah(amount);
}

function renderPriceList(){
  let html = '';
  for(const [category, items] of Object.entries(currentPrices)){
    html += `<div class="price-section"><h4>${category}</h4><div class="price-grid">`;
    items.forEach(item => {
      html += `<div class="price-item"><span class="label">${item.name}</span><span class="cell-money">${formatPriceDisplay(item.price)}</span></div>`;
    });
    html += '</div></div>';
  }
  const el = document.getElementById('price-list-display');
  if(el) el.innerHTML = html;
}

async function openPriceManager(){
  document.getElementById('price-modal-overlay').classList.add('show');
  let html = '';
  for(const [category, items] of Object.entries(currentPrices)){
    html += `<h4 style="font-family:'Teko'; font-size:16px; margin-top:14px; margin-bottom:8px; color:var(--purple-bright);">${category}</h4>`;
    items.forEach(item => {
      html += `<div class="field"><label>${item.name} (Rp)</label><input type="number" value="${item.price}" data-id="${item.id}" class="price-input"></div>`;
    });
  }
  document.getElementById('price-form').innerHTML = html;
}

async function savePriceChanges(){
  const inputs = document.querySelectorAll('.price-input');
  for(let input of inputs){
    const id = input.getAttribute('data-id');
    const price = input.value;
    await fetch(`${API_URL}?action=update_price`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({id: Number(id), price: Number(price)})
    });
  }
  await loadPrices();
  renderPriceList();
  document.getElementById('price-modal-overlay').classList.remove('show');
  alert('Harga berhasil diperbarui di database!');
}
function closePriceManager(){ document.getElementById('price-modal-overlay').classList.remove('show'); }

function setupDropzone(inputId, contentId, onDataUrl){
  const input = document.getElementById(inputId);
  const content = document.getElementById(contentId);
  if(!input || !content) return;
  input.addEventListener('change', async () => {
    const file = input.files[0];
    if(!file) return;
    content.innerHTML = '<div class="dz-label">Memproses foto…</div>';
    try{
      const dataUrl = await resizeImage(file, 900, 0.72);
      content.innerHTML = '<img class="preview-img" src="' + dataUrl + '">';
      onDataUrl(dataUrl);
    }catch(err){
      content.innerHTML = '<div class="dz-label" style="color:var(--danger)">Gagal memproses foto</div>';
    }
  });
}

// Fetch Semua Transaksi dari Database MySQL
async function loadAllTransactions(){
  try{
    const res = await fetch(`${API_URL}?action=get_transactions`);
    const json = await res.json();
    if(json.status === 'success') return json.data;
    return [];
  }catch(e){ console.error('loadAllTransactions error', e); return []; }
}

// Kirim Transaksi Baru (Form User)
async function submitTransaction(event){
  if(event && typeof event.preventDefault === 'function'){ event.preventDefault(); }
  const banner = document.getElementById('u-banner');
  const uang = document.getElementById('u-uang').value;
  const senjataSel = document.getElementById('u-senjata-select').value;
  const senjataCustom = document.getElementById('u-senjata-custom').value.trim();
  const peluruSel = document.getElementById('u-peluru-select').value;
  const peluruCustom = document.getElementById('u-peluru-custom').value.trim();
  const vestSel = document.getElementById('u-vest-select').value;
  const vestCustom = document.getElementById('u-vest-custom').value.trim();
  const catatan = document.getElementById('u-catatan').value.trim();

  const senjata = senjataSel === 'Lainnya' ? senjataCustom : senjataSel;
  const peluru = peluruSel === 'Lainnya' ? peluruCustom : peluruSel;
  const vest = vestSel === 'Lainnya' ? vestCustom : vestSel;

  // 1. Cek Uang Hitam
  if(!uang || Number(uang) <= 0){ 
    showBanner(banner, 'error', 'Isi jumlah uang hitam dengan benar.'); 
    return; 
  }

  // 2. Cek Minimal Salah Satu Barang Terisi
  if(!senjata && !peluru && !vest){ 
    showBanner(banner, 'error', 'Pilih minimal salah satu: Senjata, Peluru, atau Vest.'); 
    return; 
  }

  // 3. Cek Foto Bukti
  if(!userFotoData){ 
    showBanner(banner, 'error', 'Unggah foto bukti terlebih dahulu.'); 
    return; 
  }

  const btn = document.getElementById('u-submit');
  btn.disabled = true; btn.textContent = 'MENGIRIM…';

  try{
    const response = await fetch(`${API_URL}?action=create_transaction`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        uang: Number(uang),
        foto: userFotoData,
        senjata: senjata || '-',
        peluru: peluru || '-',
        vest: vest || '-',
        catatan,
        status: 'pending'
      })
    });
    const result = await response.json();
    if(result.status === 'success'){
      showBanner(banner, 'success', '✓ Transaksi berhasil dikirim ke database.');
      document.getElementById('u-uang').value = '';
      document.getElementById('u-senjata-select').value = '';
      document.getElementById('u-peluru-select').value = '';
      document.getElementById('u-vest-select').value = '';
      document.getElementById('u-senjata-custom').value = '';
      document.getElementById('u-peluru-custom').value = '';
      document.getElementById('u-vest-custom').value = '';
      document.getElementById('u-senjata-custom').classList.add('hidden');
      document.getElementById('u-peluru-custom').classList.add('hidden');
      document.getElementById('u-vest-custom').classList.add('hidden');
      document.getElementById('u-catatan').value = '';
      document.getElementById('u-dz-content').innerHTML = '<div class="dz-label"><b>Klik untuk upload</b> atau seret foto ke sini<br>JPG / PNG, otomatis dikompres</div>';
      userFotoData = null;
    } else {
      showBanner(banner, 'error', result.message || 'Gagal mengirim data.');
    }
  }catch(e){
    console.error('submitTransaction error', e);
    showBanner(banner, 'error', 'Terjadi kesalahan sistem/jaringan.');
  }
  btn.disabled = false; btn.textContent = 'KIRIM TRANSAKSI';
}

async function checkAdminPass() {
  const inputEl = document.getElementById('admin-pass');
  const val = inputEl ? inputEl.value.trim() : '';
  const banner = document.getElementById('gate-banner');
  
  if (!val) {
    showBanner(banner, 'error', 'Masukkan kode akses terlebih dahulu.');
    return;
  }

  try {
    const res = await fetch(`${API_URL}?action=admin_login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode: val })
    });

    const result = await res.json();

    if (result.status === 'success') {
      inputEl.value = '';
      if (banner) banner.classList.remove('show');
      goTo('admin');
    } else {
      showBanner(banner, 'error', result.message || 'Kode akses salah.');
    }
  } catch (e) {
    console.error("Login error:", e);
    showBanner(banner, 'error', 'Gagal terhubung ke server/database.');
  }
}

async function loadData(forceMsg){
  await loadPrices();
  renderPriceList();
  const tbody = document.getElementById('admin-tbody');
  tbody.innerHTML = '<tr class="empty-row"><td colspan="10">Memuat data…</td></tr>';
  allData = await loadAllTransactions();
  renderTable();
  renderStats();
}

function renderStats(){
  document.getElementById('stat-total').textContent = allData.length;
  const totalUang = allData.reduce((s,d) => s + (Number(d.uang)||0), 0);
  document.getElementById('stat-uang').textContent = formatRupiah(totalUang);
  document.getElementById('stat-pending').textContent = allData.filter(d => d.status === 'pending').length;
}

function badgeHtml(status){
  const map = {pending:'Pending', proses:'Diproses', selesai:'Selesai', ditolak:'Ditolak'};
  return '<span class="badge ' + (status||'pending') + '">' + (map[status]||'Pending') + '</span>';
}

function renderTable(){
  renderStats();
  const q = (document.getElementById('admin-search').value || '').toLowerCase();
  const tbody = document.getElementById('admin-tbody');
  const filtered = allData.filter(d =>
    !q ||
    (d.senjata||'').toLowerCase().includes(q) ||
    (d.peluru||'').toLowerCase().includes(q) ||
    (d.vest||'').toLowerCase().includes(q) ||
    (d.catatan||'').toLowerCase().includes(q)
  );
  if(filtered.length === 0){
    tbody.innerHTML = '<tr class="empty-row"><td colspan="10">Belum ada data transaksi.</td></tr>';
    return;
  }
  tbody.innerHTML = filtered.map((d, i) => `
    <tr>
      <td>${i+1}</td>
      <td style="white-space:nowrap; color:var(--text-dim); font-size:12px;">${formatDate(d.tanggal)}</td>
      <td>${d.foto ? `<img class="thumb" src="${d.foto}" onclick="openLightbox(${d.id})">` : '<div class="thumb-empty">—</div>'}</td>
      <td class="cell-money">${formatRupiah(d.uang)}</td>
      <td>${escapeHtml(d.senjata||'-')}</td>
      <td>${escapeHtml(d.peluru||'-')}</td>
      <td>${escapeHtml(d.vest||'-')}</td>
      <td style="max-width:180px; color:var(--text-dim); font-size:12.5px;">${escapeHtml(d.catatan||'-')}</td>
      <td>${badgeHtml(d.status)}</td>
      <td><div class="row-actions"><button class="btn-small" onclick="openModal(${d.id})">Edit</button><button class="btn-danger" onclick="deleteRow(${d.id})">Hapus</button></div></td>
    </tr>`
  ).join('');
}

function escapeHtml(str){
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function openLightbox(id){
  const d = allData.find(x => Number(x.id) === Number(id));
  if(!d || !d.foto) return;
  document.getElementById('lightbox-img').src = d.foto;
  document.getElementById('lightbox').classList.add('show');
}

function openModal(id){
  editingId = id || null;
  modalFotoData = null;
  document.getElementById('m-dz-content').innerHTML = '<div class="dz-label"><b>Klik untuk upload</b> foto</div>';
  if(id){
    const d = allData.find(x => Number(x.id) === Number(id));
    document.getElementById('modal-title').textContent = 'Edit Data';
    document.getElementById('m-uang').value = d.uang;
    document.getElementById('m-senjata').value = d.senjata === '-' ? '' : d.senjata;
    document.getElementById('m-peluru').value = d.peluru === '-' ? '' : d.peluru;
    document.getElementById('m-vest').value = d.vest === '-' ? '' : d.vest;
    document.getElementById('m-catatan').value = d.catatan || '';
    document.getElementById('m-status').value = d.status || 'pending';
    if(d.foto){
      document.getElementById('m-dz-content').innerHTML = '<img class="preview-img" src="' + d.foto + '">';
      modalFotoData = d.foto;
    }
  } else {
    document.getElementById('modal-title').textContent = 'Tambah Data';
    document.getElementById('m-uang').value = '';
    document.getElementById('m-senjata').value = '';
    document.getElementById('m-peluru').value = '';
    document.getElementById('m-vest').value = '';
    document.getElementById('m-catatan').value = '';
    document.getElementById('m-status').value = 'pending';
  }
  document.getElementById('modal-overlay').classList.add('show');
}
function closeModal(){ document.getElementById('modal-overlay').classList.remove('show'); editingId = null; }

async function saveModal(){
  const uang = document.getElementById('m-uang').value;
  const senjata = document.getElementById('m-senjata').value.trim();
  const peluru = document.getElementById('m-peluru').value.trim();
  const vest = document.getElementById('m-vest').value.trim();
  const catatan = document.getElementById('m-catatan').value.trim();
  const status = document.getElementById('m-status').value;

  if(!uang || Number(uang) <= 0){
    alert('Isi jumlah uang hitam dengan benar.');
    return;
  }

  if(!senjata && !peluru && !vest){
    alert('Isi minimal salah satu dari: senjata, peluru, atau vest.');
    return;
  }

  const action = editingId ? 'update_transaction' : 'create_transaction';
  const payload = {
    id: editingId,
    uang: Number(uang), 
    senjata: senjata || '-', 
    peluru: peluru || '-', 
    vest: vest || '-', 
    catatan, status,
    foto: modalFotoData
  };

  const response = await fetch(`${API_URL}?action=${action}`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(payload)
  });
  const res = await response.json();
  if(res.status === 'success'){
    closeModal();
    loadData();
  } else {
    alert(res.message || 'Gagal menyimpan data.');
  }
}

async function deleteRow(id){
  if(!confirm('Hapus data transaksi ini secara permanen dari MySQL?')) return;
  const response = await fetch(`${API_URL}?action=delete_transaction&id=${id}`);
  const res = await response.json();
  if(res.status === 'success'){
    loadData();
  } else {
    alert(res.message || 'Gagal menghapus data.');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setupDropzone('u-foto', 'u-dz-content', v => userFotoData = v);
  setupDropzone('m-foto', 'm-dz-content', v => modalFotoData = v);
  goTo('landing');
});