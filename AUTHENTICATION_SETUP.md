# Supabase Authentication Setup Guide

To enable authentication in your Travel Hub app, you need to configure Supabase authentication:

## 1. Enable Authentication in Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to "Authentication" > "Settings"
3. Enable "Enable email confirmations" (optional)
4. Configure "Site URL" to your app's URL (e.g., http://localhost:5173)

## 2. Set up Email Templates (Optional)

1. Go to "Authentication" > "Email Templates"
2. Customize the "Confirm signup" and "Reset password" templates

## 3. Configure Authentication Providers

The app currently uses email/password authentication. You can enable additional providers like:
- Google
- GitHub
- Discord
- etc.

## 4. Database Schema

Your existing `Travel` table will work with authenticated users. The app will use:
- `user.email` or `user.user_metadata.username` as the `username` field
- Supabase user ID for user identification

## 5. Row Level Security (RLS) - Recommended

Consider enabling RLS on your Travel table:

```sql
-- Enable RLS
ALTER TABLE "Travel" ENABLE ROW LEVEL SECURITY;

-- Policy for users to see all posts
CREATE POLICY "Users can view all travel posts" ON "Travel"
  FOR SELECT USING (true);

-- Policy for users to insert their own posts
CREATE POLICY "Users can insert their own posts" ON "Travel"
  FOR INSERT WITH CHECK (auth.uid()::text = username OR auth.email() = username);

-- Policy for users to update their own posts
CREATE POLICY "Users can update their own posts" ON "Travel"
  FOR UPDATE USING (auth.uid()::text = username OR auth.email() = username);

-- Policy for users to delete their own posts
CREATE POLICY "Users can delete their own posts" ON "Travel"
  FOR DELETE USING (auth.uid()::text = username OR auth.email() = username);
```

## Features Now Available:

✅ **User Registration** - Users can create accounts with email/password
✅ **User Login** - Secure authentication with Supabase
✅ **Session Management** - Automatic login persistence
✅ **User-specific Content** - Posts are associated with authenticated users
✅ **Secure Logout** - Proper session termination
✅ **Email Verification** - Optional email confirmation

## Usage:

1. Users must sign up/login before accessing the app
2. Their username/email is used as the post author
3. Only authenticated users can create, edit, or delete posts
4. Theme preferences and user sessions are preserved
5. Logout clears all user data and returns to login screen

The app is now ready with full authentication! Users will see the login/signup page first, then gain access to the travel collection features after authentication.