# INFORM Tanzania Platform - Deployment Guide

## Domain Configuration

- **Frontend**: https://inform.co.tz
- **Backend API**: https://api.inform.co.tz

---

## 1. Frontend Deployment (Vercel)

### Option A: Deploy via Vercel CLI

```bash
cd masuby-model
npm install -g vercel
vercel login
vercel --prod
```

### Option B: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import from GitHub: `masuby/masuby`
4. Set root directory to `masuby-model`
5. Framework preset: Vite
6. Add environment variables:
   - `VITE_API_URL`: `https://api.inform.co.tz/api/v1`
   - `VITE_SUPABASE_URL`: Your Supabase URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
7. Click Deploy

### Custom Domain Setup (Vercel)

1. In Vercel dashboard, go to Project Settings > Domains
2. Add `inform.co.tz`
3. Add `www.inform.co.tz` (optional)
4. Vercel will provide DNS records to configure

---

## 2. Backend Deployment

### Option A: Deploy to Railway

```bash
# Install Railway CLI
npm install -g @railway/cli
railway login

cd inform-system
railway init
railway up
```

### Option B: Deploy to Render

1. Go to [render.com](https://render.com)
2. New Web Service
3. Connect GitHub repo: `masuby/masuby`
4. Root directory: `inform-system`
5. Build command: `go build -o server ./cmd/server`
6. Start command: `./server`
7. Add environment variables from `.env.example`

### Option C: Deploy to VPS (Ubuntu)

```bash
# On your server
sudo apt update
sudo apt install -y golang postgresql

# Clone repository
git clone https://github.com/masuby/masuby.git
cd masuby/inform-system

# Build
go build -o inform-server ./cmd/server

# Create systemd service
sudo tee /etc/systemd/system/inform-api.service << EOF
[Unit]
Description=INFORM Tanzania API
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/inform/inform-system
ExecStart=/opt/inform/inform-system/inform-server
Restart=always
Environment=DATABASE_URL=postgres://user:pass@localhost:5432/inform_db
Environment=JWT_SECRET=your-production-secret
Environment=SERVER_PORT=8080
Environment=CORS_ORIGINS=https://inform.co.tz

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable inform-api
sudo systemctl start inform-api
```

---

## 3. DNS Configuration

Add these DNS records at your domain registrar:

### For Frontend (Vercel)
| Type  | Name | Value                     |
|-------|------|---------------------------|
| A     | @    | 76.76.21.21              |
| CNAME | www  | cname.vercel-dns.com     |

### For Backend API (Your Server)
| Type  | Name | Value                     |
|-------|------|---------------------------|
| A     | api  | YOUR_SERVER_IP           |

Or if using Railway/Render:
| Type  | Name | Value                     |
|-------|------|---------------------------|
| CNAME | api  | your-app.railway.app     |

---

## 4. SSL Certificates

### Vercel (Frontend)
- SSL is automatic - Vercel provisions certificates via Let's Encrypt

### Backend API

**Option A: Caddy (Automatic SSL)**
```bash
sudo apt install caddy

# /etc/caddy/Caddyfile
api.inform.co.tz {
    reverse_proxy localhost:8080
}

sudo systemctl restart caddy
```

**Option B: Nginx + Certbot**
```bash
sudo apt install nginx certbot python3-certbot-nginx

# Create nginx config
sudo tee /etc/nginx/sites-available/inform-api << EOF
server {
    server_name api.inform.co.tz;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/inform-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Get SSL certificate
sudo certbot --nginx -d api.inform.co.tz
```

---

## 5. Database Setup

### PostgreSQL Setup
```sql
CREATE DATABASE inform_db;
CREATE USER inform_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE inform_db TO inform_user;
```

### Run Migrations
The Go backend auto-creates tables on startup, or run Supabase migrations:
```bash
cd masuby-model/supabase/migrations
# Run in Supabase SQL Editor or psql
psql -h your-db-host -U inform_user -d inform_db -f 001_users_committees.sql
psql -h your-db-host -U inform_user -d inform_db -f 002_indicators_data.sql
psql -h your-db-host -U inform_user -d inform_db -f 003_warning_system.sql
```

---

## 6. Environment Variables Summary

### Frontend (.env)
```env
VITE_API_URL=https://api.inform.co.tz/api/v1
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

### Backend (.env)
```env
DATABASE_URL=postgres://inform_user:password@localhost:5432/inform_db?sslmode=require
JWT_SECRET=generate-a-secure-random-string-here
SERVER_PORT=8080
CORS_ORIGINS=https://inform.co.tz,https://www.inform.co.tz
```

---

## 7. Verify Deployment

```bash
# Check frontend
curl -I https://inform.co.tz

# Check API health
curl https://api.inform.co.tz/api/v1/health

# Check API endpoints
curl https://api.inform.co.tz/api/v1/indicators
```

---

## Architecture Overview

```
                    ┌─────────────────┐
                    │   inform.co.tz  │
                    │   (Vercel)      │
                    │   React/Vite    │
                    └────────┬────────┘
                             │
                             ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Supabase      │◄─│ api.inform.co.tz│─►│   PostgreSQL    │
│   (Real-time)   │  │   (Go Backend)  │  │   (Database)    │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

---

## Support

For issues with deployment, check:
1. Environment variables are set correctly
2. DNS propagation (can take up to 48 hours)
3. SSL certificates are valid
4. Backend server is running and accessible
