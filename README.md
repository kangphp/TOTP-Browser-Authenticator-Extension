# Browser Authenticator Extension

## Deskripsi
Ekstensi ini adalah aplikasi authenticator berbasis browser yang menggunakan algoritma TOTP (Time-based One-Time Password) untuk menghasilkan kode verifikasi dua faktor (2FA) yang aman dan mudah digunakan. Ekstensi ini dirancang minimalis, mudah dibaca, dan dapat dikembangkan lebih lanjut.

## Fitur Utama
- Menghasilkan kode 6 digit yang berubah setiap 30 detik secara otomatis
- Menyimpan beberapa akun dengan nama dan kunci rahasia
- Tampilan kode dan timer yang sederhana dan informatif
- Menambahkan akun secara manual
- Menyalin kode ke clipboard dengan klik

## Struktur Folder
browser-authenticator/
├── manifest.json
├── src/
│ ├── popup.html # Halaman utama popup ekstensi
│ ├── popup.js # Logika utama ekstensi
│ ├── background.js # Script background untuk pengelolaan ekstensi
│ ├── settings.html # Halaman pengaturan ekstensi
│ ├── settings.js # Logika pengaturan
│ ├── qr-scan.html # Halaman pemindaian QR code
│ └── qr-scan.js # Logika pemindaian QR code
├── styles/
│ └── styles.css # Styling CSS untuk semua halaman
├── libs/
│ ├── crypto.js # Implementasi algoritma TOTP dan HMAC
│ └── html5-qrcode.min.js # Library pemindaian QR code
└── images/
└── icon128.png # Ikon ekstensi

## Cara Kerja
1. Pengguna menambahkan akun dengan memasukkan nama dan kunci rahasia (base32).
2. Ekstensi mengonversi kunci rahasia ke format byte dan menggunakan algoritma HMAC-SHA1 untuk menghasilkan kode TOTP.
3. Kode 6 digit ditampilkan dan diperbarui setiap 30 detik.
4. Pengguna dapat memilih akun yang berbeda untuk melihat kode masing-masing.
5. Kode dapat disalin ke clipboard dengan klik pada kode.

## Cara Instalasi
1. Download atau clone repository ini.
2. Buka browser Chrome dan akses `chrome://extensions/`.
3. Aktifkan mode pengembang (Developer mode).
4. Klik "Load unpacked" dan pilih folder `browser-authenticator`.
5. Ekstensi akan muncul di toolbar browser.

## Cara Penggunaan
- Klik ikon ekstensi untuk membuka popup.
- Klik "Add Account" untuk menambahkan akun baru.
- Masukkan nama akun dan kunci rahasia.
- Kode akan muncul dan diperbarui otomatis.
- Klik kode untuk menyalin ke clipboard.

## Fitur Lanjutan (Opsional)
- Pemindaian QR code untuk menambahkan akun secara otomatis.
- Pengaturan panjang kode dan periode refresh.
- Ekspor dan impor data akun.
- Backup otomatis data akun.

## Testing
- Gunakan QR code dari layanan 2FA atau generator QR code online seperti:
  - [Stefan Sundin's 2FA QR Code Generator](https://stefansundin.github.io/2fa-qr/)
  - [Authentication Test](https://authenticationtest.com/totpChallenge/)
- Bandingkan kode yang dihasilkan dengan Google Authenticator asli.
- Pastikan kode cocok dan berubah setiap 30 detik.

## Algoritma
Ekstensi ini mengimplementasikan standar TOTP sesuai dengan [RFC 6238](https://tools.ietf.org/html/rfc6238) dan menggunakan HMAC-SHA1 untuk menghasilkan kode yang kompatibel dengan mayoritas layanan 2FA.

## Keamanan
- Semua data akun disimpan secara lokal menggunakan Chrome Storage API.
- Tidak ada data yang dikirim ke server eksternal.
- Gunakan ekstensi ini dengan tanggung jawab dan selalu simpan cadangan kunci 2FA Anda.

## Kontribusi
Silakan berkontribusi ke proyek ini dengan membuat pull request atau melaporkan issue.

## Lisensi
Proyek ini bersifat open-source dan dapat dikembangkan lebih lanjut sesuai kebutuhan.

---

Terima kasih telah menggunakan ekstensi ini! Jika ada pertanyaan atau saran, silakan buka issue di repository ini.