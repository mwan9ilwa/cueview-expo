# Firebase Firestore Setup Guide

## Data Sync Behavior (Important!)

**🔄 Firestore is now the authoritative source for your show library.**

When you sign in after configuring Firestore:

- **Your Firestore data will be loaded** (this is the "source of truth")
- **Local SQLite data will be replaced** with Firestore data
- **Old local data that's not in Firestore will be cleared**

If you had shows stored locally before setting up Firestore:

1. Your local data will only be preserved if it was already synced to Firestore
2. If Firestore is empty, your old local shows will be gone
3. To migrate local data to Firestore, you can use the manual migration option

**🛡️ This prevents old/deleted data from resyncing back to your devices.**

## Firestore Security Rules Configuration

To fix the "Missing or insufficient permissions" error, you need to configure Firestore security rules in the Firebase Console.

### 1. Open Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your CueView project
3. Navigate to **Firestore Database** in the left sidebar
4. Click on the **Rules** tab

### 2. Configure Security Rules

Replace the default rules with the following configuration:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Users can read and write their own shows subcollection
      match /shows/{showId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
    
    // Cached shows collection - readable by authenticated users, writable for caching
    match /user_shows/{showId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

### 3. Publish Rules
1. Click **Publish** to apply the new security rules
2. The rules will take effect immediately

## What These Rules Do

### User Data Protection
- **Personal Library**: Each user can only access their own show library (`/users/{userId}/shows/`)
- **Authentication Required**: All operations require user authentication
- **Data Isolation**: Users cannot see or modify other users' data

### Cached Shows
- **Shared Cache**: All authenticated users can read cached show data
- **Performance**: Reduces API calls by sharing show metadata across users
- **Write Access**: Users can contribute to the shared cache

### Security Features
- **Authentication Check**: `request.auth != null` ensures user is signed in
- **User Ownership**: `request.auth.uid == userId` ensures users only access their own data
- **Granular Permissions**: Separate rules for different data types

## Alternative: Development Rules (NOT FOR PRODUCTION)

If you're still developing and want to temporarily allow all access (NOT SECURE):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**⚠️ WARNING**: Only use development rules during development. Always implement proper security rules before production deployment.

## Testing the Setup

After configuring the rules:

1. **Sign in** to your app with a test account
2. **Add a show** to your library
3. **Check the sync buttons** in the Library tab
4. The app should now sync data to Firestore without permission errors

## Troubleshooting

### Still getting permission errors?
1. **Check Authentication**: Ensure the user is properly signed in
2. **Verify Rules**: Double-check the security rules in Firebase Console
3. **Check User ID**: Ensure the user ID in your app matches Firebase Auth
4. **Clear Cache**: Try signing out and back in

### Testing with Firebase Emulator (Optional)
For local development, you can use Firebase emulators:
```bash
npm install -g firebase-tools
firebase init emulators
firebase emulators:start
```

This allows offline development with Firestore without affecting production data.
