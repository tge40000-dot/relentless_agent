// api-worker.js
// RELENTLESS BILLIONAIRE – Unified API Worker
// - Admin auth (email/password, reset)
// - Content CRUD (artists, services, vendors, events, memberships, bookings)
// - Site config (settings, theme, typography, branding, social)
// - Payments (Stripe checkout + webhook stub)
// - Messaging (SMS via Telnyx, email via Resend)
// - Health + basic metrics

// Web Crypto API helpers for Workers compatibility
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(password, hash) {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

function generateId() {
  return crypto.randomUUID();
}

// Expected bindings:
// KV: ADMIN_AUTH (CONTENT, SETTINGS, METRICS, SESSIONS - using ADMIN_AUTH as fallback)
// R2: MEDIA_BUCKET
// ENV: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, TELNYX_API_KEY, RESEND_API_KEY, EMAIL_FROM, ADMIN_EMAIL

// Fallback KV namespace helpers for operational system
const getKV = (env, binding) => env[binding] || env.ADMIN_AUTH;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname } = url;

    // Ensure KV bindings exist (use ADMIN_AUTH as fallback)
    env.CONTENT = getKV(env, 'CONTENT');
    env.SETTINGS = getKV(env, 'SETTINGS');
    env.METRICS = getKV(env, 'METRICS');
    env.SESSIONS = getKV(env, 'SESSIONS');

    // Validate KV and R2 bindings (only check for configured ones)
    if (!env.ADMIN_AUTH || !env.MEDIA_BUCKET) {
      return json({ error: "Missing required bindings (ADMIN_AUTH, MEDIA_BUCKET)" }, 500);
    }

    // CORS preflight
    if (request.method === "OPTIONS") {
      return cors(new Response(null, { status: 204 }));
    }

    // Health
    if (pathname === "/api/health") {
      return cors(json({ ok: true, time: Date.now() }));
    }

    // Route to specialized workers (hybrid architecture)
    if (url.pathname.startsWith("/api/media/")) {
      url.pathname = url.pathname.replace("/api/media", "");
      return env.MEDIA_WORKER.fetch(new Request(url, request));
    }

    if (url.pathname.startsWith("/api/beats/")) {
      url.pathname = url.pathname.replace("/api/beats", "");
      return env.BEATS_WORKER.fetch(new Request(url, request));
    }

    if (url.pathname.startsWith("/api/ai/")) {
      url.pathname = url.pathname.replace("/api/ai", "");
      return env.AI_WORKER.fetch(new Request(url, request));
    }

    if (url.pathname.startsWith("/api/dashboard/")) {
      url.pathname = url.pathname.replace("/api/dashboard", "");
      return env.DASHBOARD_WORKER.fetch(new Request(url, request));
    }

    if (url.pathname.startsWith("/api/ops/")) {
      url.pathname = url.pathname.replace("/api/ops", "");
      return env.OPS_WORKER.fetch(new Request(url, request));
    }

    // Admin auth routes
    if (pathname.startsWith("/api/admin/")) {
      const res = await handleAdminAuth(request, env);
      return cors(res);
    }

    // Protected admin routes
    if (pathname.startsWith("/api/admin/secure/")) {
      const sessionOk = await validateSession(request, env);
      if (!sessionOk) return cors(json({ error: "Unauthorized" }, 401));

      const res = await handleAdminSecure(request, env);
      return cors(res);
    }

    // Public content routes (read-only)
    if (pathname.startsWith("/api/public/")) {
      const res = await handlePublic(request, env);
      return cors(res);
    }

    // Payments
    if (pathname === "/api/payments/checkout" && request.method === "POST") {
      const res = await handleCheckout(request, env);
      return cors(res);
    }

    if (pathname === "/api/payments/webhook" && request.method === "POST") {
      const res = await handleStripeWebhook(request, env);
      return cors(res);
    }

    // Messaging
    if (pathname === "/api/messaging/sms" && request.method === "POST") {
      const res = await handleSMS(request, env);
      return cors(res);
    }

    if (pathname === "/api/messaging/email" && request.method === "POST") {
      const res = await handleEmail(request, env);
      return cors(res);
    }

    // Media management (protected)
    if (pathname.startsWith("/api/admin/secure/media")) {
      const sessionOk = await validateSession(request, env);
      if (!sessionOk) return cors(json({ error: "Unauthorized" }, 401));

      const res = await handleMedia(request, env);
      return cors(res);
    }

    // Public media access
    if (pathname.startsWith("/api/public/media")) {
      const res = await handlePublicMedia(request, env);
      return cors(res);
    }

    return cors(json({ error: "Not found" }, 404));
  }
};

// ---------- CORS ----------

function cors(response) {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", "https://admin.relentlessbillionaire.com");
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  return new Response(response.body, { status: response.status, headers });
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

// ---------- ADMIN AUTH ----------

async function handleAdminAuth(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (path === "/api/admin/login" && request.method === "POST") {
    return adminLogin(request, env);
  }

  if (path === "/api/admin/logout" && request.method === "POST") {
    return adminLogout(request, env);
  }

  if (path === "/api/admin/request-reset" && request.method === "POST") {
    return requestPasswordReset(request, env);
  }

  if (path === "/api/admin/reset-password" && request.method === "POST") {
    return confirmPasswordReset(request, env);
  }

  return json({ error: "Unknown admin auth route" }, 404);
}

async function getAdmin(env) {
  const raw = await env.ADMIN_AUTH.get("admin");
  if (!raw) {
    // bootstrap admin if missing
    const passwordHash = await hashPassword("ChangeMeNow!123");
    const admin = {
      email: env.ADMIN_EMAIL || "relentlessbillionaire@outlook.com",
      passwordHash,
      resetToken: null,
      resetExpires: null
    };
    await env.ADMIN_AUTH.put("admin", JSON.stringify(admin));
    return admin;
  }
  return JSON.parse(raw);
}

async function saveAdmin(env, admin) {
  await env.ADMIN_AUTH.put("admin", JSON.stringify(admin));
}

async function adminLogin(request, env) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return json({ error: "Email and password required" }, 400);
    }

    const admin = await getAdmin(env);

    if (email !== admin.email) return json({ error: "Invalid credentials" }, 401);

    const ok = await verifyPassword(password, admin.passwordHash);
    if (!ok) return json({ error: "Invalid credentials" }, 401);

    const sessionToken = generateId();
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    // Store session in KV
    await env.SESSIONS.put(sessionToken, JSON.stringify({
      email: admin.email,
      expiresAt
    }), {
      expirationTtl: 86400 // 24 hours
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": `session=${sessionToken}; HttpOnly; Secure; Path=/; Max-Age=86400; SameSite=Lax` 
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    return json({ error: "Internal server error" }, 500);
  }
}

async function adminLogout(request, env) {
  try {
    const cookie = request.headers.get("Cookie") || "";
    const sessionMatch = cookie.match(/session=([^;]+)/);
    
    if (sessionMatch) {
      const sessionToken = sessionMatch[1];
      await env.SESSIONS.delete(sessionToken);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": "session=; HttpOnly; Secure; Path=/; Max-Age=0; SameSite=Lax"
      }
    });
  } catch (error) {
    console.error("Logout error:", error);
    return json({ error: "Internal server error" }, 500);
  }
}

async function requestPasswordReset(request, env) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return json({ error: "Email required" }, 400);
    }

    const admin = await getAdmin(env);

    if (email !== admin.email) {
      // don't leak
      return json({ success: true });
    }

    const token = generateId();
    const expires = Date.now() + 15 * 60 * 1000;

    admin.resetToken = token;
    admin.resetExpires = expires;
    await saveAdmin(env, admin);

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to: admin.email,
        subject: "Relentless Billionaire Admin Password Reset",
        html: `
          <p>You requested a password reset.</p>
          <p>Click below to reset your password:</p>
          <a href="https://admin.relentlessbillionaire.com/reset?token=${token}">
            Reset Password
          </a>
          <p>This link expires in 15 minutes.</p>
        `
      })
    });

    if (!emailResponse.ok) {
      console.error("Failed to send reset email:", await emailResponse.text());
      return json({ error: "Failed to send reset email" }, 500);
    }

    return json({ success: true });
  } catch (error) {
    console.error("Password reset request error:", error);
    return json({ error: "Internal server error" }, 500);
  }
}

async function confirmPasswordReset(request, env) {
  try {
    const { token, newPassword } = await request.json();
    
    if (!token || !newPassword) {
      return json({ error: "Token and new password required" }, 400);
    }

    if (newPassword.length < 8) {
      return json({ error: "Password must be at least 8 characters" }, 400);
    }

    const admin = await getAdmin(env);

    if (!admin.resetToken || admin.resetToken !== token) {
      return json({ error: "Invalid token" }, 400);
    }

    if (Date.now() > admin.resetExpires) {
      return json({ error: "Token expired" }, 400);
    }

    const passwordHash = await hashPassword(newPassword);
    admin.passwordHash = passwordHash;
    admin.resetToken = null;
    admin.resetExpires = null;

    await saveAdmin(env, admin);

    return json({ success: true });
  } catch (error) {
    console.error("Password reset confirmation error:", error);
    return json({ error: "Internal server error" }, 500);
  }
}

async function validateSession(request, env) {
  try {
    const cookie = request.headers.get("Cookie") || "";
    const sessionMatch = cookie.match(/session=([^;]+)/);
    
    if (!sessionMatch) return false;

    const sessionToken = sessionMatch[1];
    const sessionData = await env.SESSIONS.get(sessionToken);
    
    if (!sessionData) return false;

    const session = JSON.parse(sessionData);
    
    // Check if session is expired
    if (Date.now() > session.expiresAt) {
      await env.SESSIONS.delete(sessionToken);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Session validation error:", error);
    return false;
  }
}

// ---------- ADMIN SECURE (CRUD + SETTINGS) ----------

async function handleAdminSecure(request, env) {
  const url = new URL(request.url);
  const path = url.pathname.replace("/api/admin/secure", "");

  // Example: /content/:collection
  if (path.startsWith("/content/")) {
    const [, , collection] = path.split("/");
    return handleContentCRUD(request, env, collection);
  }

  // Example: /settings/:key
  if (path.startsWith("/settings/")) {
    const [, , key] = path.split("/");
    return handleSettingsCRUD(request, env, key);
  }

  // Backups / metrics / system health could be added here
  if (path === "/system/health" && request.method === "GET") {
    return json({ ok: true, time: Date.now() });
  }

  return json({ error: "Unknown admin secure route" }, 404);
}

async function handleContentCRUD(request, env, collection) {
  const keyPrefix = `content:${collection}:`;

  // Validate collection name
  const validCollections = ["artists", "services", "vendors", "events", "memberships", "bookings", "beats"];
  if (!validCollections.includes(collection)) {
    return json({ error: "Invalid collection" }, 400);
  }

  if (request.method === "GET") {
    try {
      const list = await env.CONTENT.list({ prefix: keyPrefix });
      const items = [];
      for (const k of list.keys) {
        const raw = await env.CONTENT.get(k.name);
        if (raw) items.push(JSON.parse(raw));
      }
      return json({ items });
    } catch (error) {
      console.error("Content list error:", error);
      return json({ error: "Failed to list content" }, 500);
    }
  }

  if (request.method === "POST") {
    try {
      const data = await request.json();
      
      // Basic validation
      if (!data || typeof data !== "object") {
        return json({ error: "Invalid data" }, 400);
      }

      const id = data.id || generateId();
      const record = { ...data, id, collection, createdAt: Date.now() };
      await env.CONTENT.put(`${keyPrefix}${id}`, JSON.stringify(record));
      return json({ item: record });
    } catch (error) {
      console.error("Content create error:", error);
      return json({ error: "Failed to create content" }, 500);
    }
  }

  if (request.method === "PUT") {
    try {
      const data = await request.json();
      
      if (!data.id) return json({ error: "Missing id" }, 400);
      
      const record = { ...data, collection, updatedAt: Date.now() };
      await env.CONTENT.put(`${keyPrefix}${data.id}`, JSON.stringify(record));
      return json({ item: record });
    } catch (error) {
      console.error("Content update error:", error);
      return json({ error: "Failed to update content" }, 500);
    }
  }

  if (request.method === "DELETE") {
    try {
      const { id } = await request.json();
      
      if (!id) return json({ error: "Missing id" }, 400);
      
      await env.CONTENT.delete(`${keyPrefix}${id}`);
      return json({ success: true });
    } catch (error) {
      console.error("Content delete error:", error);
      return json({ error: "Failed to delete content" }, 500);
    }
  }

  return json({ error: "Method not allowed" }, 405);
}

async function handleSettingsCRUD(request, env, key) {
  const kvKey = `settings:${key}`;

  if (request.method === "GET") {
    try {
      const raw = await env.SETTINGS.get(kvKey);
      return json({ key, value: raw ? JSON.parse(raw) : null });
    } catch (error) {
      console.error("Settings get error:", error);
      return json({ error: "Failed to get setting" }, 500);
    }
  }

  if (request.method === "PUT") {
    try {
      const value = await request.json();
      await env.SETTINGS.put(kvKey, JSON.stringify(value));
      return json({ key, value });
    } catch (error) {
      console.error("Settings put error:", error);
      return json({ error: "Failed to save setting" }, 500);
    }
  }

  return json({ error: "Method not allowed" }, 405);
}

// ---------- PUBLIC CONTENT (READ-ONLY) ----------

async function handlePublic(request, env) {
  const url = new URL(request.url);
  const path = url.pathname.replace("/api/public", "");

  // /content/:collection
  if (path.startsWith("/content/")) {
    const [, , collection] = path.split("/");
    
    const validCollections = ["artists", "services", "vendors", "events", "memberships", "bookings", "beats"];
    if (!validCollections.includes(collection)) {
      return json({ error: "Invalid collection" }, 400);
    }
    
    try {
      const list = await env.CONTENT.list({ prefix: `content:${collection}:` });
      const items = [];
      for (const k of list.keys) {
        const raw = await env.CONTENT.get(k.name);
        if (raw) items.push(JSON.parse(raw));
      }
      return json({ items });
    } catch (error) {
      console.error("Public content list error:", error);
      return json({ error: "Failed to list content" }, 500);
    }
  }

  // /settings/:key
  if (path.startsWith("/settings/")) {
    const [, , key] = path.split("/");
    try {
      const raw = await env.SETTINGS.get(`settings:${key}`);
      return json({ key, value: raw ? JSON.parse(raw) : null });
    } catch (error) {
      console.error("Public settings get error:", error);
      return json({ error: "Failed to get setting" }, 500);
    }
  }

  return json({ error: "Unknown public route" }, 404);
}

// ---------- PAYMENTS (STRIPE) ----------

async function handleCheckout(request, env) {
  try {
    const body = await request.json();
    
    if (!body.priceId || !body.successUrl || !body.cancelUrl) {
      return json({ error: "Missing required fields: priceId, successUrl, cancelUrl" }, 400);
    }

    // Support beat purchases
    const isBeatPurchase = body.type === 'beat';
    
    // TODO: Implement actual Stripe Checkout session creation
    // This requires stripe npm package and proper integration
    // For now, return a placeholder response
    
    const checkoutData = {
      priceId: body.priceId,
      successUrl: body.successUrl,
      cancelUrl: body.cancelUrl,
      metadata: body.metadata || {}
    };

    if (isBeatPurchase) {
      checkoutData.metadata.type = 'beat';
      checkoutData.metadata.beatId = body.beatId;
      checkoutData.metadata.beatTitle = body.beatTitle;
    }

    return json({ 
      error: "Stripe integration not yet implemented",
      checkoutUrl: "https://stripe.com/placeholder",
      checkoutData
    }, 501);
  } catch (error) {
    console.error("Checkout error:", error);
    return json({ error: "Failed to create checkout session" }, 500);
  }
}

async function handleStripeWebhook(request, env) {
  try {
    // Read raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get("Stripe-Signature");

    if (!signature) {
      return json({ error: "Missing Stripe signature" }, 400);
    }

    // TODO: Implement actual Stripe webhook signature verification
    // This requires stripe npm package and STRIPE_WEBHOOK_SECRET
    return json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return json({ error: "Failed to process webhook" }, 500);
  }
}

// ---------- MESSAGING (SMS + EMAIL) ----------

async function handleSMS(request, env) {
  try {
    const { to, text } = await request.json();
    
    if (!to || !text) {
      return json({ error: "Missing required fields: to, text" }, 400);
    }

    if (!env.TELNYX_API_KEY || !env.TELNYX_FROM) {
      return json({ error: "Telnyx not configured" }, 500);
    }

    const response = await fetch("https://api.telnyx.com/v2/messages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.TELNYX_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: env.TELNYX_FROM,
        to,
        text
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Telnyx API error:", errorText);
      return json({ error: "Failed to send SMS" }, 500);
    }

    return json({ success: true });
  } catch (error) {
    console.error("SMS error:", error);
    return json({ error: "Failed to send SMS" }, 500);
  }
}

async function handleEmail(request, env) {
  try {
    const { to, subject, html } = await request.json();
    
    if (!to || !subject || !html) {
      return json({ error: "Missing required fields: to, subject, html" }, 400);
    }

    if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
      return json({ error: "Resend not configured" }, 500);
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to,
        subject,
        html
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Resend API error:", errorText);
      return json({ error: "Failed to send email" }, 500);
    }

    return json({ success: true });
  } catch (error) {
    console.error("Email error:", error);
    return json({ error: "Failed to send email" }, 500);
  }
}

// ---------- MEDIA MANAGEMENT (R2) ----------

async function handleMedia(request, env) {
  const url = new URL(request.url);
  const path = url.pathname.replace("/api/admin/secure/media", "");

  // Upload media
  if (path === "/upload" && request.method === "POST") {
    return uploadMedia(request, env);
  }

  // List media
  if (path === "/list" && request.method === "GET") {
    return listMedia(request, env);
  }

  // Delete media
  if (path === "/delete" && request.method === "DELETE") {
    return deleteMedia(request, env);
  }

  return json({ error: "Unknown media route" }, 404);
}

async function uploadMedia(request, env) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const category = formData.get("category") || "misc";

    if (!file) {
      return json({ error: "No file provided" }, 400);
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4", "video/webm", "audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/m4a"];
    if (!validTypes.includes(file.type)) {
      return json({ error: "Invalid file type. Only images, videos, and audio files allowed." }, 400);
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      return json({ error: "File too large. Max size is 100MB." }, 400);
    }

    // Generate unique filename
    const ext = file.name.split(".").pop();
    const filename = `${generateId()}.${ext}`;
    const key = `${category}/${filename}`;

    // Upload to R2
    await env.MEDIA_BUCKET.put(key, file);

    // Store metadata in KV
    const metadata = {
      id: generateId(),
      key,
      filename,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      category,
      url: `https://0a7be075f32d9d615349825b83ab8fcb.r2.cloudflarestorage.com/rbb/${key}`,
      createdAt: Date.now()
    };

    await env.CONTENT.put(`content:media:${metadata.id}`, JSON.stringify(metadata));

    return json({ file: metadata });
  } catch (error) {
    console.error("Media upload error:", error);
    return json({ error: "Failed to upload media" }, 500);
  }
}

async function listMedia(request, env) {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get("category");

    let prefix = "";
    if (category) {
      prefix = `${category}/`;
    }

    const listed = await env.MEDIA_BUCKET.list({ prefix });
    const files = [];

    for (const object of listed.objects) {
      files.push({
        key: object.key,
        size: object.size,
        uploaded: object.uploaded
      });
    }

    return json({ files });
  } catch (error) {
    console.error("Media list error:", error);
    return json({ error: "Failed to list media" }, 500);
  }
}

async function deleteMedia(request, env) {
  try {
    const { key } = await request.json();

    if (!key) {
      return json({ error: "Missing key" }, 400);
    }

    await env.MEDIA_BUCKET.delete(key);

    return json({ success: true });
  } catch (error) {
    console.error("Media delete error:", error);
    return json({ error: "Failed to delete media" }, 500);
  }
}

async function handlePublicMedia(request, env) {
  const url = new URL(request.url);
  const path = url.pathname.replace("/api/public/media", "");

  // Get media by key
  if (path.startsWith("/get/") && request.method === "GET") {
    const key = path.replace("/get/", "");
    return getMedia(key, env);
  }

  // List public media
  if (path === "/list" && request.method === "GET") {
    return listMedia(request, env);
  }

  return json({ error: "Unknown public media route" }, 404);
}

async function getMedia(key, env) {
  try {
    const object = await env.MEDIA_BUCKET.get(key);

    if (!object) {
      return json({ error: "File not found" }, 404);
    }

    const headers = new Headers();
    headers.set("Content-Type", object.httpMetadata?.contentType || "application/octet-stream");
    headers.set("Cache-Control", "public, max-age=31536000");

    return new Response(object.body, { headers });
  } catch (error) {
    console.error("Media get error:", error);
    return json({ error: "Failed to get media" }, 500);
  }
}
