# Lysaght Consultants - Production Deployment

## 🚀 Quick Start

1. **Set up environment variables:**
   ```bash
   # Edit .env.production with your Supabase credentials
   nano .env.production
   ```

2. **Deploy the application:**
   ```bash
   # For Unix/Linux
   ./deploy.sh
   
   # For Windows
   npm run setup
   ```

3. **Check application status:**
   ```bash
   pm2 status
   pm2 logs lysaght-consultants
   ```

## 🔄 Updates

To update the application:
```bash
# For Unix/Linux
./update.sh

# For Windows
npm run deploy
```

## 📊 Monitoring

- **Health Check:** http://localhost:3000/health
- **API Status:** http://localhost:3000/api/status
- **Main App:** http://localhost:3000

## 🛠️ Management Commands

```bash
# Start application
pm2 start lysaght-consultants

# Stop application
pm2 stop lysaght-consultants

# Restart application
pm2 restart lysaght-consultants

# Reload application (zero-downtime)
pm2 reload lysaght-consultants

# View logs
pm2 logs lysaght-consultants

# Monitor resources
pm2 monit

# Save PM2 configuration
pm2 save

# Delete application
pm2 delete lysaght-consultants
```

## 🔧 Configuration

- **Port:** 3000 (configurable via PORT environment variable)
- **Process Manager:** PM2
- **Auto-restart:** Enabled
- **Memory limit:** 1GB
- **Logs:** ./logs/ directory

## 🆘 Troubleshooting

1. **Check application status:**
   ```bash
   pm2 status
   ```

2. **View error logs:**
   ```bash
   pm2 logs lysaght-consultants --err
   ```

3. **Restart if needed:**
   ```bash
   pm2 restart lysaght-consultants
   ```

4. **Check health endpoint:**
   ```bash
   curl http://localhost:3000/health
   ```

## 📁 File Structure

```
lysaght-consultants/
├── dist/                 # Built application
├── logs/                 # PM2 logs
├── backups/              # Backup directory
├── server.js             # Express server
├── ecosystem.config.js   # PM2 configuration
├── deploy.sh             # Deployment script
├── update.sh             # Update script
├── .env.production       # Environment variables
└── package.json          # Dependencies
```
