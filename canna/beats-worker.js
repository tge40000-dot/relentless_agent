// beats-worker.js
// RELENTLESS BILLIONAIRE – Beats Worker
// - Beat uploads
// - Beat listings
// - Search
// - Purchase flow
// - Delivery links

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
      return new Response(JSON.stringify({ ok: true, worker: "beats" }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // List beats
    if (pathname === "/beats/list" && request.method === "GET") {
      return handleListBeats(request, env);
    }

    // Upload beat
    if (pathname === "/beats/upload" && request.method === "POST") {
      return handleUploadBeat(request, env);
    }

    // Get beat details
    if (pathname.startsWith("/beats/") && request.method === "GET") {
      const beatId = pathname.split("/beats/")[1];
      return handleGetBeat(beatId, env);
    }

    // Delete beat
    if (pathname.startsWith("/beats/") && request.method === "DELETE") {
      const beatId = pathname.split("/beats/")[1];
      return handleDeleteBeat(beatId, env);
    }

    // Search beats
    if (pathname === "/beats/search" && request.method === "GET") {
      return handleSearchBeats(request, env);
    }

    // Purchase flow
    if (pathname === "/beats/purchase" && request.method === "POST") {
      return handlePurchase(request, env);
    }

    // Delivery link
    if (pathname === "/beats/delivery" && request.method === "POST") {
      return handleDelivery(request, env);
    }

    return json({ error: "Not found" }, 404);
  }
};

async function handleListBeats(request, env) {
  try {
    const url = new URL(request.url);
    const genre = url.searchParams.get("genre");
    const sortBy = url.searchParams.get("sort") || "newest";

    let beats = [];
    const list = await env.RB_ARTISTS.list({ prefix: "beats:" });

    for (const key of list.keys) {
      const beatData = await env.RB_ARTISTS.get(key.name);
      if (beatData) {
        beats.push(JSON.parse(beatData));
      }
    }

    // Filter by genre
    if (genre && genre !== "all") {
      beats = beats.filter(beat => beat.genre === genre);
    }

    // Sort
    switch (sortBy) {
      case "price-asc":
        beats.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        beats.sort((a, b) => b.price - a.price);
        break;
      case "newest":
        beats.sort((a, b) => b.createdAt - a.createdAt);
        break;
      default:
        beats.sort((a, b) => b.createdAt - a.createdAt);
    }

    return json({ beats });
  } catch (error) {
    console.error("List beats error:", error);
    return json({ error: "Failed to list beats" }, 500);
  }
}

async function handleUploadBeat(request, env) {
  try {
    const { title, artist, genre, bpm, key, price, audioUrl, coverImageUrl } = await request.json();

    if (!title || !artist || !price || !audioUrl) {
      return json({ error: "Missing required fields" }, 400);
    }

    const beat = {
      id: generateId(),
      title,
      artist,
      genre: genre || "Hip-Hop",
      bpm: bpm || 120,
      key: key || "C",
      price: parseFloat(price),
      audioUrl,
      coverImageUrl: coverImageUrl || null,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await env.RB_ARTISTS.put(`beats:${beat.id}`, JSON.stringify(beat));

    return json({ beat });
  } catch (error) {
    console.error("Upload beat error:", error);
    return json({ error: "Failed to upload beat" }, 500);
  }
}

async function handleGetBeat(beatId, env) {
  try {
    const beatData = await env.RB_ARTISTS.get(`beats:${beatId}`);

    if (!beatData) {
      return json({ error: "Beat not found" }, 404);
    }

    return json(JSON.parse(beatData));
  } catch (error) {
    console.error("Get beat error:", error);
    return json({ error: "Failed to get beat" }, 500);
  }
}

async function handleDeleteBeat(beatId, env) {
  try {
    await env.RB_ARTISTS.delete(`beats:${beatId}`);
    return json({ success: true });
  } catch (error) {
    console.error("Delete beat error:", error);
    return json({ error: "Failed to delete beat" }, 500);
  }
}

async function handleSearchBeats(request, env) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get("q");

    if (!query) {
      return json({ error: "Missing search query" }, 400);
    }

    const beats = [];
    const list = await env.RB_ARTISTS.list({ prefix: "beats:" });

    for (const key of list.keys) {
      const beatData = await env.RB_ARTISTS.get(key.name);
      if (beatData) {
        const beat = JSON.parse(beatData);
        const searchFields = [beat.title, beat.artist, beat.genre].join(" ").toLowerCase();
        if (searchFields.includes(query.toLowerCase())) {
          beats.push(beat);
        }
      }
    }

    return json({ beats, query });
  } catch (error) {
    console.error("Search beats error:", error);
    return json({ error: "Failed to search beats" }, 500);
  }
}

async function handlePurchase(request, env) {
  try {
    const { beatId, customerId } = await request.json();

    if (!beatId || !customerId) {
      return json({ error: "Missing beatId or customerId" }, 400);
    }

    const beatData = await env.RB_ARTISTS.get(`beats:${beatId}`);
    if (!beatData) {
      return json({ error: "Beat not found" }, 404);
    }

    const beat = JSON.parse(beatData);

    // In production, this would integrate with Stripe
    const purchase = {
      id: generateId(),
      beatId,
      customerId,
      amount: beat.price,
      status: "pending",
      createdAt: Date.now()
    };

    // Store purchase in RB_TASKS for processing
    await env.RB_TASKS.put(`purchase:${purchase.id}`, JSON.stringify(purchase));

    return json({ 
      purchase, 
      message: "Purchase initiated - integrate with Stripe for payment processing" 
    });
  } catch (error) {
    console.error("Purchase error:", error);
    return json({ error: "Failed to process purchase" }, 500);
  }
}

async function handleDelivery(request, env) {
  try {
    const { purchaseId } = await request.json();

    if (!purchaseId) {
      return json({ error: "Missing purchaseId" }, 400);
    }

    const purchaseData = await env.RB_TASKS.get(`purchase:${purchaseId}`);
    if (!purchaseData) {
      return json({ error: "Purchase not found" }, 404);
    }

    const purchase = JSON.parse(purchaseData);

    if (purchase.status !== "paid") {
      return json({ error: "Purchase not paid" }, 400);
    }

    const beatData = await env.RB_ARTISTS.get(`beats:${purchase.beatId}`);
    if (!beatData) {
      return json({ error: "Beat not found" }, 404);
    }

    const beat = JSON.parse(beatData);

    // Generate delivery link (signed URL in production)
    const deliveryLink = beat.audioUrl;

    return json({ 
      deliveryLink, 
      beat: { 
        title: beat.title, 
        artist: beat.artist 
      } 
    });
  } catch (error) {
    console.error("Delivery error:", error);
    return json({ error: "Failed to generate delivery link" }, 500);
  }
}

function cors(response) {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  return new Response(response.body, { status: response.status, headers });
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
