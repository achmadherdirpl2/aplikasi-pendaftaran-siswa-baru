const form = document.getElementById("registrationForm");
const confirmOverlay = document.getElementById("confirmOverlay");
const successOverlay = document.getElementById("successOverlay");
let pendingData = null;
let lastRegistration = null;

const labels = {
  nama:"Nama lengkap", nisn:"NISN", gender:"Jenis kelamin",
  tempatLahir:"Tempat lahir", tanggalLahir:"Tanggal lahir",
  alamat:"Alamat lengkap", asalSekolah:"Asal sekolah",
  jurusan:"Pilihan jurusan", wali:"Nama orang tua / wali",
  telepon:"Nomor HP orang tua / wali"
};

function getFormData() {
  const data = {};
  Object.keys(labels).forEach(key => {
    data[key] = document.getElementById(key).value.trim();
  });
  return data;
}

function validateForm() {
  let valid = true;
  Object.keys(labels).forEach(key => {
    const input = document.getElementById(key);
    const field = input.closest(".field");
    let message = "";
    if (!input.value.trim()) message = "Bagian ini wajib diisi.";
    if (key === "nisn" && input.value.trim() && !/^\d{10}$/.test(input.value.trim())) message = "NISN harus terdiri dari 10 angka.";
    if (key === "telepon" && input.value.trim() && !/^[0-9+\\-\\s]{9,15}$/.test(input.value.trim())) message = "Masukkan nomor HP yang valid.";
    if (key === "tanggalLahir" && input.value && new Date(input.value) > new Date()) message = "Tanggal lahir tidak boleh di masa depan.";
    field.classList.toggle("invalid", Boolean(message));
    field.querySelector(".error").textContent = message;
    if (message) valid = false;
  });
  return valid;
}

function showOverlay(element) {
  element.classList.add("show");
  element.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}
function hideOverlay(element) {
  element.classList.remove("show");
  element.setAttribute("aria-hidden", "true");
  if (!document.querySelector(".overlay.show")) document.body.style.overflow = "";
}
function renderReview(data) {
  document.getElementById("reviewData").innerHTML = Object.keys(labels).map(key => `
    <div class="review-item"><small>${labels[key]}</small><b>${escapeHTML(data[key])}</b></div>
  `).join("");
}
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]));
}
function createRegistrationNumber() {
  const date = new Date();
  const dateCode = `${date.getFullYear()}${String(date.getMonth()+1).padStart(2,"0")}${String(date.getDate()).padStart(2,"0")}`;
  const random = Math.floor(1000 + Math.random() * 9000);
  return `PPDB-${dateCode}-${random}`;
}

form.addEventListener("submit", event => {
  event.preventDefault();
  if (!validateForm()) {
    const firstInvalid = form.querySelector(".field.invalid input, .field.invalid select, .field.invalid textarea");
    if (firstInvalid) firstInvalid.focus();
    return;
  }
  pendingData = getFormData();
  renderReview(pendingData);
  showOverlay(confirmOverlay);
});

document.getElementById("confirmSubmit").addEventListener("click", () => {
  if (!pendingData) return;
  const registration = {
    nomor: createRegistrationNumber(),
    tanggal: new Date().toLocaleDateString("id-ID", {day:"2-digit",month:"long",year:"numeric"}),
    data: pendingData
  };
  const records = JSON.parse(localStorage.getItem("ppdb-records") || "[]");
  records.push(registration);
  localStorage.setItem("ppdb-records", JSON.stringify(records));
  lastRegistration = registration;
  hideOverlay(confirmOverlay);
  document.getElementById("registrationNumber").textContent = registration.nomor;
  document.getElementById("successSummary").innerHTML =
    `<b>${escapeHTML(registration.data.nama)}</b><br>${escapeHTML(registration.data.jurusan)}<br>Tanggal daftar: ${registration.tanggal}`;
  showOverlay(successOverlay);
});

document.querySelectorAll("[data-close]").forEach(button => {
  button.addEventListener("click", () => hideOverlay(document.getElementById(button.dataset.close)));
});
[confirmOverlay, successOverlay].forEach(overlay => {
  overlay.addEventListener("click", event => {
    if (event.target === overlay) hideOverlay(overlay);
  });
});
document.getElementById("newRegistration").addEventListener("click", () => {
  hideOverlay(successOverlay);
  form.reset();
  form.querySelectorAll(".field").forEach(field => {
    field.classList.remove("invalid");
    field.querySelector(".error").textContent = "";
  });
  pendingData = null;
  window.scrollTo({top:0,behavior:"smooth"});
});

document.getElementById("printButton").addEventListener("click", () => {
  if (!lastRegistration) return;
  const r = lastRegistration;
  const printWindow = window.open("", "_blank", "width=800,height=900");
  if (!printWindow) {
    alert("Izinkan pop-up browser untuk mencetak bukti pendaftaran.");
    return;
  }
  const rows = Object.keys(labels).map(key =>
    `<tr><td>${labels[key]}</td><td>${escapeHTML(r.data[key])}</td></tr>`).join("");
  printWindow.document.write(`<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><title>Bukti Pendaftaran</title>
  <style>body{font-family:Arial,sans-serif;color:#1b2c4a;padding:35px}h1{text-align:center;font-size:22px;margin-bottom:5px}.sub{text-align:center;color:#64748b;font-size:12px}.number{margin:25px 0;padding:15px;background:#f1f5ff;border:1px dashed #7895ff;text-align:center;font-size:20px;font-weight:bold;color:#315cff}table{width:100%;border-collapse:collapse;margin-top:20px}td{border:1px solid #dce3ef;padding:10px;font-size:12px}td:first-child{width:38%;font-weight:bold;background:#f7f9fc}.foot{margin-top:35px;text-align:right;font-size:12px}@media print{button{display:none}}</style></head><body>
  <h1>BUKTI PENDAFTARAN SISWA BARU</h1><div class="sub">Penerimaan Peserta Didik Baru Tahun Ajaran 2026/2027</div>
  <div class="number">${r.nomor}</div><p style="font-size:12px">Data calon peserta didik:</p><table>${rows}</table>
  <div class="foot">Tanggal pendaftaran: ${r.tanggal}<br><br>Panitia PPDB</div><script>window.onload=()=>window.print()<\/script></body></html>`);
  printWindow.document.close();
});

Object.keys(labels).forEach(key => {
  const input = document.getElementById(key);
  input.addEventListener("input", () => {
    if (input.closest(".field").classList.contains("invalid")) {
      input.closest(".field").classList.remove("invalid");
      input.closest(".field").querySelector(".error").textContent = "";
    }
  });
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    hideOverlay(confirmOverlay);
    hideOverlay(successOverlay);
  }
});
