# R2 Bucket Setup for Relentless Billionaire

## Bucket Information
- **Name**: rbb
- **Location**: Western North America (WNAM)
- **S3 API**: https://0a7be075f32d9d615349825b83ab8fcb.r2.cloudflarestorage.com/rbb

## Setup Instructions

### 1. Apply CORS Policy
In Cloudflare Dashboard → R2 → rbb → Settings → CORS Policy:
- Copy contents of `r2-cors-policy.json`
- Apply to enable cross-origin requests from your domains

### 2. Apply Lifecycle Rules
In Cloudflare Dashboard → R2 → rbb → Settings → Object Lifecycle Rules:
- Copy contents of `r2-lifecycle-rules.json`
- Apply to automatically manage old media

### 3. Enable Public Development URL (for testing)
- In Cloudflare Dashboard → R2 → rbb → Settings → Public Development URL
- Enable for testing media access
- **Note**: For production, use Custom Domain instead

### 4. Recommended Folder Structure
```
rbb/
├── videos/
│   ├── ads/
│   └── content/
├── images/
│   ├── banners/
│   ├── thumbnails/
│   └── assets/
├── documents/
└── backups/
```

### 5. Update wrangler.toml
Add R2 binding to your wrangler.toml:
```toml
[[r2_buckets]]
binding = "MEDIA_BUCKET"
bucket_name = "rbb"
```

## CORS Policy Details
- **Allowed Origins**: All relentlessbillionaire.com domains
- **Allowed Methods**: GET, POST, PUT, DELETE, HEAD
- **Max Age**: 1 hour

## Lifecycle Rules Details
- **Videos**: Delete after 90 days
- **Images**: Delete after 365 days
- **Banners**: Archive to Infrequent Access after 180 days

## Security Notes
- Never store sensitive data in R2
- Use signed URLs for temporary access when needed
- Monitor bucket usage and costs
- Regular cleanup of unused media
