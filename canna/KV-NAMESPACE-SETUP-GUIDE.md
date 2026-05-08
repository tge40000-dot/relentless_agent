# KV Namespace Setup Guide

**Purpose:** Configure additional KV namespaces for full separation of concerns  
**Current Status:** System operational with ADMIN_AUTH fallback  
**Priority:** Medium (system works without this, but recommended for production)

## Overview

Currently, the Relentless Billionaire API Worker is using a single KV namespace (ADMIN_AUTH) with fallback logic. This guide explains how to configure separate KV namespaces for better data organization and scalability.

## Current Configuration

### Working Configuration
- **ADMIN_AUTH** KV Namespace: `a5a8acb98514418184de30c1eb8f4dff`
- **Fallback Mode:** CONTENT, SETTINGS, METRICS, SESSIONS all use ADMIN_AUTH
- **Status:** Fully operational

### Target Configuration
- **ADMIN_AUTH** KV Namespace: Admin authentication data
- **CONTENT** KV Namespace: Content collections (artists, services, vendors, events, memberships, bookings, beats)
- **SETTINGS** KV Namespace: Site settings and configuration
- **METRICS** KV Namespace: Analytics and performance metrics
- **SESSIONS** KV Namespace: User session tokens

## Benefits of Separate Namespaces

✅ **Better Data Organization:** Logical separation of data types  
✅ **Scalability:** Each namespace can be scaled independently  
✅ **Performance:** Reduced key-space per namespace improves read/write speed  
✅ **Security:** Fine-grained access control per namespace  
✅ **Maintenance:** Easier to backup and manage individual namespaces  
✅ **Cost Efficiency:** Can optimize storage per namespace based on usage patterns  

## Step-by-Step Setup

### Step 1: Access Cloudflare Dashboard

1. Log in to Cloudflare Dashboard
2. Navigate to: **Workers & Pages** → **KV**
3. Click **"Create a Namespace"**

### Step 2: Create CONTENT Namespace

1. Enter namespace name: `relentless-billionaire-content`
2. Click **"Add"**
3. Copy the **Namespace ID** (you'll need this later)
4. Example ID format: `abc123def456...`

### Step 3: Create SETTINGS Namespace

1. Click **"Create a Namespace"** again
2. Enter namespace name: `relentless-billionaire-settings`
3. Click **"Add"**
4. Copy the **Namespace ID**

### Step 4: Create METRICS Namespace

1. Click **"Create a Namespace"** again
2. Enter namespace name: `relentless-billionaire-metrics`
3. Click **"Add"**
4. Copy the **Namespace ID**

### Step 5: Create SESSIONS Namespace

1. Click **"Create a Namespace"** again
2. Enter namespace name: `relentless-billionaire-sessions`
3. Click **"Add"**
4. Copy the **Namespace ID**

### Step 6: Update wrangler.toml

Open `wrangler.toml` in your project directory and update the KV namespaces section:

```toml
# KV Namespaces
[[kv_namespaces]]
binding = "ADMIN_AUTH"
id = "a5a8acb98514418184de30c1eb8f4dff"
preview_id = "YOUR_ADMIN_AUTH_KV_PREVIEW_ID"

[[kv_namespaces]]
binding = "CONTENT"
id = "YOUR_CONTENT_NAMESPACE_ID"  # Replace with actual ID from Step 2
preview_id = "YOUR_CONTENT_KV_PREVIEW_ID"

[[kv_namespaces]]
binding = "SETTINGS"
id = "YOUR_SETTINGS_NAMESPACE_ID"  # Replace with actual ID from Step 3
preview_id = "YOUR_SETTINGS_KV_PREVIEW_ID"

[[kv_namespaces]]
binding = "METRICS"
id = "YOUR_METRICS_NAMESPACE_ID"  # Replace with actual ID from Step 4
preview_id = "YOUR_METRICS_KV_PREVIEW_ID"

[[kv_namespaces]]
binding = "SESSIONS"
id = "YOUR_SESSIONS_NAMESPACE_ID"  # Replace with actual ID from Step 5
preview_id = "YOUR_SESSIONS_KV_PREVIEW_ID"
```

**Important:** Replace the placeholder IDs with the actual Namespace IDs you copied in Steps 2-5.

### Step 7: Remove Fallback Logic from api-worker.js

Once all KV namespaces are configured, remove the fallback logic from `api-worker.js`:

**Remove these lines:**
```javascript
// Fallback KV namespace helpers for operational system
const getKV = (env, binding) => env[binding] || env.ADMIN_AUTH;

// Ensure KV bindings exist (use ADMIN_AUTH as fallback)
env.CONTENT = getKV(env, 'CONTENT');
env.SETTINGS = getKV(env, 'SETTINGS');
env.METRICS = getKV(env, 'METRICS');
env.SESSIONS = getKV(env, 'SESSIONS');
```

**Restore original validation:**
```javascript
// Validate KV and R2 bindings
if (!env.ADMIN_AUTH || !env.CONTENT || !env.SETTINGS || !env.METRICS || !env.SESSIONS || !env.MEDIA_BUCKET) {
  return json({ error: "Missing required bindings" }, 500);
}
```

### Step 8: Redeploy Worker

```bash
npm run deploy
```

### Step 9: Verify Deployment

After deployment, verify that all bindings are correctly configured:

```bash
wrangler kv:namespace list
```

Check the deployment output to ensure all KV namespaces are listed:
```
Binding             Resource
env.ADMIN_AUTH      KV Namespace
  a5a8acb98514418184de30c1eb8f4dff
env.CONTENT         KV Namespace
  YOUR_CONTENT_NAMESPACE_ID
env.SETTINGS        KV Namespace
  YOUR_SETTINGS_NAMESPACE_ID
env.METRICS         KV Namespace
  YOUR_METRICS_NAMESPACE_ID
env.SESSIONS        KV Namespace
  YOUR_SESSIONS_NAMESPACE_ID
env.MEDIA_BUCKET    R2 Bucket
  rbb
```

### Step 10: Test Endpoints

Test that all endpoints work correctly with the new configuration:

1. **Health Check:**
   ```bash
   curl https://relentless-billionaire-api.tge40000.workers.dev/api/health
   ```

2. **Content CRUD:**
   - Test creating content in each collection
   - Test reading content
   - Test updating content
   - Test deleting content

3. **Settings:**
   - Test reading settings
   - Test updating settings

4. **Sessions:**
   - Test admin login
   - Test session validation

## Migration Strategy

### Option 1: Fresh Start (Recommended for New Deployments)

If this is a new deployment or you don't have critical data in ADMIN_AUTH:

1. Configure all KV namespaces as above
2. Remove fallback logic
3. Deploy
4. Start fresh with proper separation

### Option 2: Gradual Migration (For Existing Data)

If you have existing data in ADMIN_AUTH that needs to be preserved:

1. Export data from ADMIN_AUTH
2. Configure new KV namespaces
3. Import data to appropriate namespaces
4. Update wrangler.toml
5. Remove fallback logic
6. Deploy
7. Verify data integrity

### Data Migration Script (Example)

```javascript
// Example migration script
const migrateData = async (sourceKV, targetKV, keyPrefix) => {
  const list = await sourceKV.list({ prefix: keyPrefix });
  for (const key of list.keys) {
    const value = await sourceKV.get(key.name);
    await targetKV.put(key.name, value);
  }
};

// Usage:
// migrateData(env.ADMIN_AUTH, env.CONTENT, 'content:');
// migrateData(env.ADMIN_AUTH, env.SETTINGS, 'settings:');
// migrateData(env.ADMIN_AUTH, env.METRICS, 'metrics:');
// migrateData(env.ADMIN_AUTH, env.SESSIONS, 'session:');
```

## Troubleshooting

### Error: "KV namespace 'YOUR_CONTENT_KV_ID' is not valid"

**Cause:** Placeholder ID not replaced with actual namespace ID

**Solution:**
1. Go to Cloudflare Dashboard → Workers & Pages → KV
2. Find the CONTENT namespace
3. Copy the actual Namespace ID
4. Update wrangler.toml with the correct ID
5. Redeploy

### Error: "Missing required bindings"

**Cause:** KV namespace not configured or binding name mismatch

**Solution:**
1. Verify all namespaces are created in Cloudflare Dashboard
2. Verify binding names in wrangler.toml match expected names
3. Ensure fallback logic is removed after configuration
4. Redeploy

### Error: "Failed to create content"

**Cause:** KV namespace not accessible or permissions issue

**Solution:**
1. Verify KV namespace exists
2. Check wrangler.toml binding configuration
3. Ensure worker has permission to access namespace
4. Check Cloudflare Access permissions

## Best Practices

### Naming Conventions
- Use descriptive namespace names: `project-purpose`
- Example: `relentless-billionaire-content`
- Keep names consistent across environments

### Key Organization
- Use consistent key prefixes: `type:id`
- Example: `content:artists:123`, `settings:theme:primary`
- Document key structure in your project

### Preview Environments
- Create separate preview namespaces for development
- Use preview_id in wrangler.toml for preview environments
- Test changes in preview before production

### Monitoring
- Monitor KV usage in Cloudflare Dashboard
- Set up alerts for high read/write operations
- Review storage costs regularly
- Optimize key structure for performance

## Cost Considerations

### KV Pricing
- Read operations: $0.50 per million reads
- Write operations: $5.00 per million writes
- Storage: $0.50 per GB per month

### Optimization Tips
- Use separate namespaces to isolate high-traffic data
- Implement caching for frequently accessed data
- Consider TTL for temporary data (sessions, metrics)
- Regular cleanup of stale data

## Rollback Plan

If issues occur after configuration change:

1. **Immediate Rollback:**
   ```toml
   # Restore wrangler.toml to fallback configuration
   # Remove new KV namespace bindings
   # Restore fallback logic in api-worker.js
   npm run deploy
   ```

2. **Data Recovery:**
   - Data remains in original namespaces
   - No data loss during configuration changes
   - Can revert to fallback mode at any time

## Next Steps After Configuration

1. **Test All Endpoints:** Verify all CRUD operations work
2. **Monitor Performance:** Check KV operation metrics
3. **Update Documentation:** Reflect new configuration in docs
4. **Team Training:** Educate team on new namespace structure
5. **Process Updates:** Update deployment and maintenance procedures

---

**This setup guide ensures a smooth transition from fallback mode to full namespace separation while maintaining system availability.**
