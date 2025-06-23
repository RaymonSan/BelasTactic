# 🏗️ Phase 2 Setup: Infrastructure & Authentication

Welcome to Phase 2! Let's set up your cloud Supabase instance and authentication system.

## 📋 Prerequisites

- [x] Phase 1 completed (Ollama + AI working)
- [ ] Supabase account ([sign up here](https://app.supabase.com))
- [ ] GitHub personal access token for backups

## 🚀 Step 1: Create Cloud Supabase Project

1. **Go to [app.supabase.com](https://app.supabase.com)**

2. **Create a new project:**
   - Click "New Project"
   - Choose your organization
   - Project name: `belastactic`
   - Database password: Generate a secure one (save it!)
   - Region: **Choose EU region** (for GDPR compliance)
   - Plan: Free tier is perfect for development

3. **Wait for setup** (2-3 minutes)

## 🔑 Step 2: Get Your API Keys

Once your project is ready:

1. **Go to Settings → API**
2. **Copy these values:**
   - Project URL (looks like `https://abcdefgh.supabase.co`)
   - `anon` `public` key 
   - `service_role` `secret` key

## ⚙️ Step 3: Configure Environment

1. **Copy the environment template:**
   ```bash
   cp env-template.txt .env.local
   ```

2. **Edit `.env.local` with your values:**
   ```bash
   # Replace with your actual Supabase values
   SUPABASE_URL=https://your-project-ref.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   
   # Generate a random JWT secret
   JWT_SECRET=$(openssl rand -base64 32)
   ```

3. **Generate secrets:**
   ```bash
   # JWT Secret
   echo "JWT_SECRET=$(openssl rand -base64 32)" >> .env.local
   
   # Database encryption key
   echo "DATABASE_ENCRYPTION_KEY=$(openssl rand -base64 32)" >> .env.local
   ```

## 🗄️ Step 4: Run Database Migrations

We need to create our database schema in the cloud:

1. **Link to your Supabase project:**
   ```bash
   npx supabase link --project-ref your-project-ref
   ```

2. **Push the database schema:**
   ```bash
   npx supabase db push
   ```

   This will create all our tables:
   - ✅ `users` (with GDPR compliance)
   - ✅ `households` (tax filing units)
   - ✅ `questions` (dynamic questionnaire)
   - ✅ `answers` (encrypted tax data)
   - ✅ `scenarios` (tax optimization results)
   - ✅ `public_docs` (RAG knowledge base)
   - ✅ `audit_logs` (GDPR audit trail)
   - ✅ `backup_metadata` (backup tracking)

## 🔐 Step 5: GitHub Backup Setup (Optional)

For automated backups to GitHub:

1. **Create GitHub personal access token:**
   - Go to GitHub → Settings → Developer settings → Personal access tokens
   - Generate new token (classic)
   - Select `repo` scope
   - Copy the token

2. **Add to environment:**
   ```bash
   echo "BACKUP_GITHUB_TOKEN=ghp_your_token_here" >> .env.local
   ```

## 🧪 Step 6: Test the Setup

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Test authentication:**
   - Go to `http://localhost:3000/login`
   - Enter your email
   - Click "Get Code"
   - Check the browser console/network tab for the access code
   - Enter the code to login

3. **Verify database:**
   - Login should create a user record
   - Check your Supabase dashboard → Table Editor
   - You should see data in the `users` and `audit_logs` tables

## 🎯 Step 7: Verify Phase 2 Completion

Run our verification script:

```bash
node scripts/verify-phase2.js
```

This checks:
- ✅ Supabase connection
- ✅ Database schema
- ✅ Authentication flow
- ✅ JWT token system
- ✅ GDPR compliance features

## 🔍 Troubleshooting

### "Failed to connect to Supabase"
- Check your `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Ensure your project is in EU region for GDPR compliance
- Verify the project is fully set up (not still creating)

### "JWT_SECRET is required"
- Make sure you generated and set the JWT_SECRET in `.env.local`

### "Table does not exist"
- Run `npx supabase db push` to create the schema
- Check your database in the Supabase dashboard

### Login not working
- Check browser console for errors
- Verify API routes are accessible at `/api/auth/*`
- Check that access codes are being generated (dev mode shows them)

## 🎉 Success!

Once everything is working:
- ✅ You can login with access codes
- ✅ User data is stored securely in Supabase
- ✅ GDPR compliance is active
- ✅ GitHub repository is set up
- ✅ Ready for Phase 3!

## 📞 Need Help?

If you run into issues:
1. Check the troubleshooting section above
2. Verify your environment variables
3. Check the Supabase dashboard for errors
4. Look at browser console for client-side errors

---

**Next:** Once Phase 2 is complete, we'll move to Phase 3 and build the dynamic tax questionnaire! 🚀 