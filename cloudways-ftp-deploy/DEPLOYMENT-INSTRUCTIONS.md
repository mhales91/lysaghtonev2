# 🚀 Cloudways FTP Deployment Instructions

## 📦 What's Included:
- ✅ Built React app (all files from dist/)
- ✅ Apache configuration (.htaccess)
- ✅ Environment template (env-template.txt)

## 🚀 FTP Deployment Steps:

### 1. Connect via FTP:
- **Host:** phpstack-820035-5797543.cloudwaysapps.com
- **Username:** Your Cloudways FTP username
- **Password:** Your Cloudways FTP password
- **Port:** 21 (standard FTP) or 22 (SFTP)

### 2. Navigate to public_html:
- Connect to your Cloudways server
- Navigate to the `public_html` directory
- This is where your website files should go

### 3. Backup Current Files (Optional):
- Create a backup folder: `public_html_backup`
- Move current files to backup folder
- This preserves your existing PHP application

### 4. Upload New Files:
- Upload ALL files from this package to `public_html`
- Make sure `.htaccess` is uploaded (it starts with a dot)
- Ensure all files maintain their directory structure

### 5. Configure Environment:
- Rename `env-template.txt` to `.env`
- Edit `.env` with your Supabase credentials:
  - Replace `your_anon_key_here` with your Supabase anon key
  - Replace `your_service_role_key_here` with your service role key

### 6. Test Your Application:
- Visit: https://phpstack-820035-5797543.cloudwaysapps.com/
- Check that the React app loads correctly
- Test all features and navigation

## 🔧 File Structure After Upload:
```
public_html/
├── index.html          # Main React app
├── assets/             # CSS, JS, images
├── .htaccess          # Apache configuration
├── .env               # Environment variables
└── ... (other React files)
```

## 🌐 Expected Result:
- **Main App:** https://phpstack-820035-5797543.cloudwaysapps.com/
- **All Routes:** Should work with client-side routing
- **Static Assets:** Properly cached and compressed

## 🔧 Troubleshooting:

### If React app doesn't load:
1. Check that `.htaccess` was uploaded correctly
2. Verify all files are in `public_html` (not in a subfolder)
3. Check Cloudways error logs

### If you see 404 errors:
1. Ensure `.htaccess` is present and readable
2. Check that mod_rewrite is enabled on Cloudways
3. Verify file permissions

### If environment variables don't work:
1. Check that `.env` file exists and has correct content
2. Verify Supabase credentials are correct
3. Check browser console for errors

## 📞 Support:
- Check Cloudways documentation for Apache configuration
- Verify your Supabase backend is accessible
- Test with browser developer tools

---

**🎉 Your Lysaght Consultants app is ready for Cloudways!**

**Next Steps:**
1. Upload files via FTP to `public_html`
2. Configure `.env` with your Supabase credentials
3. Test the application
4. Enjoy your new surveying business management system!
