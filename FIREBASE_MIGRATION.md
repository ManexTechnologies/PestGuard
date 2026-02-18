# Supabase to Firebase Migration Guide

## Overview
Your PEST application has been successfully migrated from Supabase to Firebase. This document outlines all the changes made and the next steps required to complete the migration.

## Changes Made

### 1. Dependencies Updated
- **Removed**: `@supabase/supabase-js` (^2.49.4)
- **Added**: `firebase` (^10.12.0)

Update your environment by running:
```bash
npm install
```

### 2. Configuration Files

#### `.env.example` Updated
Updated with Firebase configuration variables:
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

You need to create a `.env` file (not tracked by git) with your actual Firebase credentials from the Firebase Console.

### 3. New Firebase Configuration File
- **Location**: `src/lib/firebase.ts`
- **Exports**: 
  - `auth` - Firebase Authentication instance
  - `db` - Firestore Database instance
  - `functions` - Firebase Cloud Functions instance

### 4. Authentication System (`src/lib/auth.ts`)
**Major changes:**
- Now uses Firebase Authentication (built-in security)
- Passwords are securely handled by Firebase (no manual hashing)
- User data stored in Firestore `users` collection
- Farmer profiles stored in Firestore `farmer_profiles` collection
- Session tokens replaced with Firebase ID tokens
- All functions updated to use Firestore queries

**Function signatures remain the same:**
- `signup()` - Creates user and profile
- `login()` - Authenticates user
- `logout()` - Clears session
- `verifySession()` - Validates current session
- `updateProfile()` - Updates farmer profile

### 5. Component Updates

#### `src/components/AppLayout.tsx`
- Replaced `supabase` imports with Firebase Firestore queries
- `fetchReports()` - Now uses `getDocs()` with Firestore queries
- `handleRateEffectiveness()` - Now uses `updateDoc()` to update pest reports

#### `src/components/pest/PestScanner.tsx`
- Replaced Supabase Cloud Functions with Firebase Cloud Functions
- Cloud function name changed from `identify-pest` to `identifyPest` (camelCase)
- Reports now saved to Firestore using `addDoc()`
- Added `serverTimestamp()` for automatic timestamp generation

## Firestore Collection Schema

### `users` Collection
```
{
  email: string
  created_at: timestamp
  updated_at: timestamp
}
```

### `farmer_profiles` Collection
```
{
  user_id: string
  full_name: string
  farm_name: string | null
  farm_location: string | null
  province: string | null
  crops_grown: string[]
  phone: string | null
  created_at: timestamp
  updated_at: timestamp
}
```

### `pest_reports` Collection
```
{
  pest_name: string
  pest_type: string
  confidence: number
  crop_affected: string
  severity: string
  latitude: number
  longitude: number
  location_name: string
  province: string
  description: string
  image_url: string | null
  status: string
  effectiveness_rating?: number
  user_id?: string
  created_at: timestamp
}
```

## Next Steps

### 1. Set Up Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing one
3. Enable:
   - Authentication (Email/Password)
   - Firestore Database
   - Cloud Functions (for pest identification)
4. Copy your Firebase config values

### 2. Create `.env` File
Create a `.env` file in your project root with your Firebase credentials:
```
VITE_FIREBASE_API_KEY=your_actual_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Cloud Functions Migration
The `identifyPest` cloud function needs to be deployed to Firebase:
- Create a Firebase Cloud Function (TypeScript recommended)
- Function name: `identifyPest`
- HTTP trigger
- Deploy from `functions` directory in Firebase project
- The function should accept the same parameters as before:
  - `imageBase64`: Base64 encoded image
  - `description`: Text description of pest
  - `cropType`: Type of crop affected

### 4. Firestore Security Rules
Set up appropriate security rules in Firebase Console. Example:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own profile
    match /farmer_profiles/{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Allow reading all pest reports, writing if authenticated
    match /pest_reports/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Restrict user documents
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
    }
  }
}
```

### 5. Database Migration (if migrating existing data)
If you have existing Supabase data:
1. Export data from Supabase
2. Transform data to match Firestore schema
3. Use Firebase bulk import tools or write a migration script

### 6. Test the Application
```bash
npm install
npm run dev
```

Test authentication flows:
- User signup
- User login
- Profile updates
- Pest report submission

### 7. Build and Deploy
```bash
npm run build
npm run preview  # Test production build locally
```

## Important Notes

- **Passwords**: Firebase Authentication handles password security automatically
- **Session Tokens**: Firebase ID tokens are used instead of custom tokens
- **Timestamps**: Use `serverTimestamp()` for consistent timestamps
- **Cloud Functions**: The function name changed from snake_case to camelCase
- **User IDs**: Firebase uses UID instead of custom v4 UUIDs (but you can still use UUIDs if needed)

## Troubleshooting

### "Firebase config not found"
Ensure your `.env` file exists in the project root with all required Firebase variables.

### "Cloud Function not found"
Deploy the `identifyPest` cloud function to your Firebase project via the Firebase Console.

### "Firestore permission denied"
Update Firestore security rules to allow appropriate access.

### Type Errors
Ensure you've run `npm install` to update all packages.

## Support Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Guide](https://firebase.google.com/docs/firestore)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Cloud Functions for Firebase](https://firebase.google.com/docs/functions)
