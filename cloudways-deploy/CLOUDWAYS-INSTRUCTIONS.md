# 🚀 Cloudways Deployment Instructions

## 📦 What's Included:
- ✅ Built React app (dist/)
- ✅ Environment template (.env.production)
- ✅ Apache configuration (.htaccess)
- ✅ Nginx configuration (nginx.conf)
- ✅ Package.json for reference

## 🚀 Deployment Steps:

### 1. Upload to Cloudways:
- Upload this entire folder to your Cloudways server
- Place it in your web root directory (usually public_html)

### 2. Configure Environment:
- Edit .env.production with your Supabase credentials
- Update VITE_SUPABASE_ANON_KEY and VITE_SUPABASE_SERVICE_ROLE_KEY

### 3. Configure Web Server:

#### For Apache:
- The .htaccess file is already included
- Make sure mod_rewrite is enabled
- Set document root to the dist/ folder

#### For Nginx:
- Copy nginx.conf to your Nginx configuration
- Update the root path and server_name
- Reload Nginx configuration

### 4. Set Up Domain:
- Point your domain to Cloudways IP
- Configure SSL certificate
- Test the application

## 🌐 Access Your Application:
- Main App: http://your-domain.com
- Health Check: http://your-domain.com/health (if using Node.js)

## 📊 Management:
- Use Cloudways dashboard for monitoring
- Enable automatic backups
- Set up staging environment if needed

## 🔧 Troubleshooting:
- Check Cloudways logs if issues occur
- Verify environment variables are set correctly
- Ensure web server is configured properly
- Test with browser developer tools

---

**🎉 Your Lysaght Consultants app is ready for Cloudways!**
