# INFORM Tanzania - Supabase Setup Guide

This guide explains how to set up Supabase as the backend database for INFORM Tanzania, enabling real database storage, user authentication, and real-time sync for 30+ million users.

## Quick Start (15 minutes)

### Step 1: Create Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" and sign up (free tier available)
3. Create a new project called `inform-tanzania`
4. Choose a database password (save it securely)
5. Select a region close to Tanzania (e.g., `eu-central-1` or `ap-south-1`)
6. Wait ~2 minutes for project to initialize

### Step 2: Get API Keys

1. In your Supabase dashboard, go to **Settings** > **API**
2. Copy these values:
   - **Project URL**: `https://your-project-ref.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIs...`

### Step 3: Configure Environment Variables

1. Create `.env` file in the project root:

```bash
# Copy from .env.example
cp .env.example .env
```

2. Edit `.env` and add your keys:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

### Step 4: Initialize Database

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New query**
3. Copy the contents of `supabase/schema.sql` and paste it
4. Click **Run** to create all tables

### Step 5: Enable Authentication

1. Go to **Authentication** > **Providers**
2. Enable **Email** provider
3. (Optional) Configure email templates in **Email Templates**

### Step 6: Enable Real-time

1. Go to **Database** > **Replication**
2. Enable real-time for these tables:
   - `submissions`
   - `approved_risk_data`
   - `audit_log`

### Step 7: Restart Application

```bash
npm run dev
```

The console should show: `✅ Supabase connected: https://your-project.supabase.co`

---

## Database Schema Overview

### Tables Created

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles linked to auth |
| `admin_units` | Regions & Districts |
| `institutions` | Government agencies, NGOs |
| `committees` | Ward/District/Regional committees |
| `indicator_definitions` | INFORM indicators |
| `submissions` | Data submissions from committees |
| `approved_risk_data` | PMO-approved risk data |
| `audit_log` | System audit trail |

### Row Level Security (RLS)

All tables have RLS enabled:
- Users can only see/edit their own submissions
- PMO/Admin can see all submissions
- Approved data is publicly readable
- Audit logs are admin-only

---

## Creating Users

### Option 1: Supabase Dashboard

1. Go to **Authentication** > **Users**
2. Click **Add user** > **Create new user**
3. Enter email and password
4. User will appear in `profiles` table automatically

### Option 2: Sign Up API

```javascript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'securepassword',
  options: {
    data: {
      full_name: 'John Doe',
      role: 'pmo_officer'  // admin, pmo_officer, regional_officer, institution_user
    }
  }
});
```

### Option 3: Bulk Import

Use the SQL Editor to insert multiple users:

```sql
-- First create auth users via dashboard or API, then update roles:
UPDATE profiles SET role = 'pmo_officer' WHERE email = 'kai@pmo.go.tz';
UPDATE profiles SET role = 'regional_officer', region_code = 'TZ-02' WHERE email = 'kai@dar.go.tz';
```

---

## API Usage Examples

### Create Submission

```javascript
import { createSubmission } from './services/supabaseDataService';

const submission = await createSubmission({
  committeeId: 'committee-123',
  committeeName: 'Ilala District Committee',
  adm1Code: 'TZ-02',
  adm1Name: 'Dar es Salaam',
  adm2Name: 'Ilala',
  indicators: {
    flood_exposure: { value: 7.5 },
    drought_exposure: { value: 3.2 },
    // ... more indicators
  },
  submittedBy: 'Committee Secretary'
});
```

### Get Submissions (with filters)

```javascript
import { getSubmissions } from './services/supabaseDataService';

// All pending submissions
const pending = await getSubmissions({ status: 'pending' });

// Submissions for specific region
const darSubmissions = await getSubmissions({ regionCode: 'TZ-02' });
```

### Real-time Updates

```javascript
import { subscribeToSubmissions } from './services/supabaseDataService';

const subscription = subscribeToSubmissions((event) => {
  if (event.type === 'INSERT') {
    console.log('New submission:', event.data);
    // Update UI
  }
  if (event.type === 'UPDATE' && event.data.status === 'approved') {
    console.log('Submission approved:', event.data);
    // Refresh risk data
  }
});

// Cleanup on unmount
subscription.unsubscribe();
```

---

## Scaling for 30M Users

### Database Optimization

1. **Connection Pooling**: Enabled by default in Supabase
2. **Indexes**: Created on frequently queried columns
3. **Partitioning**: Consider partitioning `submissions` by year for large datasets

### Upgrade Path

| Users | Supabase Plan | Monthly Cost |
|-------|---------------|--------------|
| < 50,000 | Free | $0 |
| 50K - 500K | Pro | $25 |
| 500K - 5M | Pro + Add-ons | $25 + usage |
| 5M+ | Enterprise | Custom |

### Performance Tips

1. Use `limit()` on queries
2. Enable caching for read-heavy operations
3. Use Edge Functions for complex calculations
4. Consider read replicas for high traffic

---

## Troubleshooting

### "Supabase not configured"

- Check `.env` file exists and has correct values
- Restart dev server after changing `.env`
- Ensure variables start with `VITE_`

### "Row Level Security policy violation"

- User may not have permission for that operation
- Check user role in `profiles` table
- Review RLS policies in Supabase dashboard

### Real-time not working

- Check if replication is enabled for the table
- Ensure subscription is properly initialized
- Check browser console for WebSocket errors

---

## Security Best Practices

1. **Never expose service_role key** - only use anon key in frontend
2. **Enable email verification** for production
3. **Set up rate limiting** in Supabase dashboard
4. **Regular backups** - Supabase does daily automatic backups
5. **Monitor usage** - Set up alerts for unusual activity

---

## Support

- Supabase Documentation: https://supabase.com/docs
- INFORM Methodology: https://drmkc.jrc.ec.europa.eu/inform-index
- GitHub Issues: https://github.com/masuby/model/issues
