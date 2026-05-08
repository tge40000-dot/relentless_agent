// media-worker.js
// RELENTLESS BILLIONAIRE – Media Worker
// - R2 uploads
// - Signed URLs
// - Video/image proxy
// - Asset metadata
// - Media transformations

function generateId() {
  return crypto.randomUUID();
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname } = url;

    // CORS preflight
    if (request.method === "OPTIONS") {
      return cors(new Response(null, { status: 204 }));
    }

    // Test endpoint
    if (pathname === "/test") {
      return new Response(JSON.stringify({ ok: true, worker: "media" }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // Upload media
    if (pathname === "/upload" && request.method === "POST") {
      return handleUpload(request, env);
    }

    // Generate signed URL
    if (pathname === "/signed-url" && request.method === "POST") {
      return handleSignedUrl(request, env);
    }

    // Thumbnail generation
    if (pathname === "/thumbnail" && request.method === "POST") {
      return handleThumbnail(request, env);
    }

    // Asset proxy
    if (pathname.startsWith("/proxy/") && request.method === "GET") {
      return handleProxy(request, env);
    }

    // Get media metadata
    if (pathname === "/metadata" && request.method === "GET") {
      return handleMetadata(request, env);
    }

    return json({ error: "Not found" }, 404);
  }
};

async function handleUpload(request, env) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const category = formData.get("category") || "general";
    const bucket = formData.get("bucket") || "RB_MEDIA_BUCKET";

    if (!file) {
      return json({ error: "No file provided" }, 400);
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4", "video/webm", "audio/mpeg", "audio/mp3", "audio/wav"];
    if (!validTypes.includes(file.type)) {
      return json({ error: "Invalid file type" }, 400);
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      return json({ error: "File too large. Max size is 100MB." }, 400);
    }

    // Get the appropriate bucket
    const r2Bucket = getBucket(env, bucket);
    if (!r2Bucket) {
      return json({ error: "Invalid bucket specified" }, 400);
    }

    // Generate unique filename
    const ext = file.name.split(".").pop();
    const filename = `${generateId()}.${ext}`;
    const key = `${category}/${filename}`;

    // Upload to R2
    await r2Bucket.put(key, file);

    // Store metadata in KV
    const metadata = {
      id: generateId(),
      key,
      filename,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      category,
      bucket,
      url: `https://0a7be075f32d9d615349825b83ab8fcb.r2.cloudflarestorage.com/${bucket}/${key}`,
      createdAt: Date.now()
    };

    await env.RB_MEDIA_MAP.put(`media:${metadata.id}`, JSON.stringify(metadata));

    return json({ file: metadata });
  } catch (error) {
    console.error("Media upload error:", error);
    return json({ error: "Failed to upload media" }, 500);
  }
}

async function handleSignedUrl(request, env) {
  try {
    const { key, bucket, expiresIn = 3600 } = await request.json();

    if (!key || !bucket) {
      return json({ error: "Missing key or bucket" }, 400);
    }

    const r2Bucket = getBucket(env, bucket);
    if (!r2Bucket) {
      return json({ error: "Invalid bucket specified" }, 400);
    }

    // In production, this would generate a signed URL using R2's presigned URLs
    // For now, return the public URL
    const url = `https://0a7be075f32d9d615349825b83ab8fcb.r2.cloudflarestorage.com/${bucket}/${key}`;

    return json({ url, expiresIn });
  } catch (error) {
    console.error("Signed URL error:", error);
    return json({ error: "Failed to generate signed URL" }, 500);
  }
}

async function handleThumbnail(request, env) {
  try {
    const { key, bucket, width = 200, height = 200 } = await request.json();

    if (!key || !bucket) {
      return json({ error: "Missing key or bucket" }, 400);
    }

    // In production, this would use an image processing service
    // For now, return a placeholder response
    return json({
      message: "Thumbnail generation not yet implemented",
      key,
      bucket,
      width,
      height
    });
  } catch (error) {
    console.error("Thumbnail error:", error);
    return json({ error: "Failed to generate thumbnail" }, 500);
  }
}

async function handleProxy(request, env) {
  try {
    const url = new URL(request.url);
    const key = url.pathname.replace("/proxy/", "");
    const bucket = url.searchParams.get("bucket") || "RB_MEDIA_BUCKET";

    const r2Bucket = getBucket(env, bucket);
    if (!r2Bucket) {
      return json({ error: "Invalid bucket specified" }, 400);
    }

    const object = await r2Bucket.get(key);

    if (!object) {
      return json({ error: "File not found" }, 404);
    }

    const headers = new Headers();
    headers.set("Content-Type", object.httpMetadata?.contentType || "application/octet-stream");
    headers.set("Cache-Control", "public, max-age=31536000");

    return new Response(object.body, { headers });
  } catch (error) {
    console.error("Proxy error:", error);
    return json({ error: "Failed to proxy asset" }, 500);
  }
}

async function handleMetadata(request, env) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return json({ error: "Missing id parameter" }, 400);
    }

    const metadata = await env.RB_MEDIA_MAP.get(`media:${id}`);

    if (!metadata) {
      return json({ error: "Metadata not found" }, 404);
    }

    return json(JSON.parse(metadata));
  } catch (error) {
    console.error("Metadata error:", error);
    return json({ error: "Failed to get metadata" }, 500);
  }
}

function getBucket(env, bucketName) {
  const bucketMap = {
    "RB_MEDIA_BUCKET": env.RB_MEDIA_BUCKET,
    "RB_BEATS_BUCKET": env.RB_BEATS_BUCKET,
    "RB_ARTIST_BUCKET": env.RB_ARTIST_BUCKET,
    "RB_AI_BUCKET": env.RB_AI_BUCKET,
    "MEDIA_BUCKET": env.MEDIA_BUCKET
  };
  return bucketMap[bucketName];
}

function cors(response) {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  return new Response(response.body, { status: response.status, headers });
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
