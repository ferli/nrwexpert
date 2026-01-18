# Panduan Deployment

Dokumen ini menjelaskan cara deploy Kalkulator Neraca Air di berbagai environment.

## Requirements

- Web browser modern (Chrome, Firefox, Safari, Edge)
- Untuk self-hosted: Web server sederhana (Python, Nginx, Apache, atau Docker)

## Option 1: Python Simple Server (Development)

Cara tercepat untuk testing lokal:

```bash
cd water-balance-calculator

# Python 3
python3 -m http.server 8080

# Python 2 (legacy)
python -m SimpleHTTPServer 8080
```

Buka: `http://localhost:8080`

## Option 2: Ubuntu/WSL dengan Nginx

### Install Nginx

```bash
# Update packages
sudo apt update

# Install Nginx
sudo apt install nginx -y

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Deploy Aplikasi

```bash
# Clone atau copy files
git clone https://github.com/fdiskandar/water-balance-calculator.git

# Copy ke web root
sudo cp -r water-balance-calculator/src/* /var/www/html/water-balance/

# Set permissions
sudo chown -R www-data:www-data /var/www/html/water-balance/
```

### Konfigurasi Nginx (Opsional)

Jika ingin sub-path atau custom domain:

```nginx
# /etc/nginx/sites-available/water-balance
server {
    listen 80;
    server_name water-balance.local;
    
    root /var/www/html/water-balance;
    index index.html;
    
    location / {
        try_files $uri $uri/ =404;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/water-balance /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Option 3: Docker

### Dockerfile

```dockerfile
FROM nginx:alpine
COPY src/ /usr/share/nginx/html/
EXPOSE 80
```

### Build & Run

```bash
# Build image
docker build -t water-balance .

# Run container
docker run -d -p 8080:80 water-balance

# Atau dengan docker-compose
docker-compose up -d
```

### docker-compose.yml

```yaml
version: '3'
services:
  water-balance:
    build: .
    ports:
      - "8080:80"
    restart: unless-stopped
```

## Option 4: Cloudflare Pages (Production)

### Via Dashboard

1. Fork repository ke GitHub Anda
2. Login ke [Cloudflare Dashboard](https://dash.cloudflare.com)
3. Pilih "Pages" → "Create a project"
4. Connect GitHub repository
5. Build settings:
   - Build command: (kosong)
   - Build output directory: `src`
6. Deploy

### Via Wrangler CLI

```bash
# Install Wrangler
npm install -g wrangler

# Login
wrangler login

# Deploy
wrangler pages deploy src --project-name=water-balance
```

## Option 5: GitHub Pages

1. Fork repository
2. Go to Settings → Pages
3. Source: Deploy from branch `main`
4. Folder: `/src`
5. Save

URL: `https://[username].github.io/water-balance-calculator/`

## Konfigurasi Gemini API

### Untuk Self-Hosted (User Bawa API Key)

Aplikasi akan meminta user memasukkan API key sendiri. Tidak perlu konfigurasi server.

### Untuk Production dengan Proxy (Opsional)

Jika ingin hide API key dari client:

1. Setup Cloudflare Worker atau backend sederhana
2. Store API key di environment variable
3. Proxy request ke Gemini API

Contoh Cloudflare Worker:

```javascript
// functions/api/gemini-proxy.js
export async function onRequest(context) {
  const GEMINI_API_KEY = context.env.GEMINI_API_KEY;
  
  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': GEMINI_API_KEY
    },
    body: await context.request.text()
  });
  
  return response;
}
```

## Troubleshooting

### CORS Error saat akses Gemini API

Jika self-hosted dan mengalami CORS error:
- Pastikan user memasukkan API key yang valid
- Gunakan proxy backend jika perlu

### Halaman tidak muncul

- Cek apakah file `index.html` ada di root folder
- Cek permissions (`chmod 644` untuk files, `chmod 755` untuk folders)
- Cek Nginx error log: `sudo tail -f /var/log/nginx/error.log`

### LocalStorage tidak berfungsi

- Pastikan bukan mode Incognito/Private
- Cek browser storage quota
- Clear cache dan reload

---

## Support

Jika ada masalah deployment, silakan buka issue di GitHub repository.
