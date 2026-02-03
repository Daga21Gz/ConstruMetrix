# 🚀 DEPLOYMENT GUIDE - ConstruMetrix Firebase Functions

## Prerequisites
- Node.js 18+ installed
- Firebase CLI installed (`npm install -g firebase-tools`)
- Firebase project configured

## Setup Instructions

### 1. Install Dependencies
```bash
cd functions
npm install
```

### 2. Test Locally (Emulator)
```bash
firebase emulators:start --only functions
```

### 3. Deploy to Production
```bash
firebase deploy --only functions
```

## Function Endpoints

### `igacProxy`
**Type:** Callable Function (HTTPS)
**Purpose:** Secure proxy for IGAC cadastral queries with built-in caching

**Usage from Frontend:**
```javascript
const igacProxy = firebase.functions().httpsCallable('igacProxy');
const result = await igacProxy({ cedula: '156900000000000070199000000000' });
console.log(result.data.data); // Merged R1 + R2 data
```

**Features:**
- ✅ Authentication required
- ✅ 48-hour Firestore cache (TTL)
- ✅ Smart merge of Registry 1 & 2
- ✅ Error handling & logging

## Cache Management

Cache documents are stored in Firestore:
- **Collection:** `cache_igac`
- **Document ID:** Cadastral ID (cedula)
- **TTL:** 48 hours

To manually clear cache:
```javascript
// In Firebase Console or via script
db.collection('cache_igac').doc('CEDULA_ID').delete();
```

## Monitoring

View function logs:
```bash
firebase functions:log
```

## Security Rules

Ensure Firestore has proper rules:
```javascript
match /cache_igac/{document} {
  allow read, write: if request.auth != null;
}
```

## Cost Optimization

- Cache reduces external API calls by ~95%
- Average cost: $0.40/1M invocations
- Firestore reads: Cached queries = 1 read vs 2+ external calls

## Troubleshooting

**Error: "unauthenticated"**
- Ensure user is logged in via Firebase Auth before calling function

**Error: "invalid-argument"**
- Check that `cedula` parameter is provided and valid

**Slow response times**
- First call: ~2-3s (external IGAC query)
- Cached calls: ~200-400ms

## Next Steps

1. Monitor usage in Firebase Console
2. Set up alerts for function errors
3. Consider upgrading to Blaze plan for production traffic
