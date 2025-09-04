# 🚀 Lysaght Consultants - Production Upload Instructions

## 📦 What's Included:
- ✅ Built application (dist/)
- ✅ Production server (server.js)
- ✅ PM2 configuration (ecosystem.config.cjs)
- ✅ Deployment scripts (deploy.sh, update.sh)
- ✅ Dependencies (node_modules/)
- ✅ Environment template (.env.production.template)
- ✅ Documentation (PRODUCTION-README.md)

## 🚀 Quick Start:

### 1. Upload to Server:
```bash
# Upload this entire folder to your production server
# Example using SCP:
scp -r lysaght-upload/ user@your-server:/path/to/lysaght-consultants/
```

### 2. On Your Server:
```bash
# Navigate to the uploaded directory
cd /path/to/lysaght-consultants/

# Make scripts executable
chmod +x *.sh

# Start the application
./start-production.sh
```

### 3. Configure Environment:
```bash
# Edit the environment file
nano .env.production

# Add your Supabase credentials:
VITE_SUPABASE_URL=http://134.199.146.249:8000
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
NODE_ENV=production
PORT=3000
```

### 4. Restart Application:
```bash
pm2 restart lysaght-consultants
```

## 🌐 Access Your Application:
- **Main App:** http://your-server:3000
- **Health Check:** http://your-server:3000/health
- **API Status:** http://your-server:3000/api/status

## 📊 Management Commands:
```bash
# Check status
pm2 status

# View logs
pm2 logs lysaght-consultants

# Restart
pm2 restart lysaght-consultants

# Stop
pm2 stop lysaght-consultants
```

## 🔧 Web Server Configuration:

### Apache (.htaccess):
```apache
RewriteEngine On
RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]
```

### Nginx:
```nginx
location / {
    proxy_pass http://localhost:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

## 📞 Support:
- Check PM2 logs: `pm2 logs lysaght-consultants`
- Check health: `curl http://localhost:3000/health`
- View documentation: `cat PRODUCTION-README.md`
