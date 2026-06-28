// dashboard-worker.js
// RELENTLESS BILLIONAIRE – Dashboard Worker
// - Artist profiles
// - Time To Eat podium
// - Tier logic
// - Analytics
// - Admin UI API

function generateId() {
  return crypto.randomUUID();
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname } = url;

    // Validate required environment bindings
    if (!env.RB_ARTISTS || !env.RB_TASKS || !env.RB_TIERS) {
      return json({ error: "Missing required bindings (RB_ARTISTS, RB_TASKS, RB_TIERS)" }, 500);
    }

    // CORS preflight
    if (request.method === "OPTIONS") {
      return cors(new Response(null, { status: 204 }));
    }

    // Test endpoint
    if (pathname === "/test") {
      return new Response(JSON.stringify({ ok: true, worker: "dashboard" }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // Analytics
    if (pathname === "/analytics" && request.method === "GET") {
      return handleAnalytics(request, env);
    }

    // Tiers
    if (pathname === "/tiers" && request.method === "GET") {
      return handleGetTiers(request, env);
    }

    if (pathname === "/tiers" && request.method === "POST") {
      return handleCreateTier(request, env);
    }

    if (pathname.startsWith("/tiers/") && request.method === "PUT") {
      const tierId = pathname.split("/tiers/")[1];
      return handleUpdateTier(tierId, request, env);
    }

    // Artists
    if (pathname === "/artists" && request.method === "GET") {
      return handleGetArtists(request, env);
    }

    if (pathname === "/artists" && request.method === "POST") {
      return handleCreateArtist(request, env);
    }

    if (pathname.startsWith("/artists/") && request.method === "GET") {
      const artistId = pathname.split("/artists/")[1];
      return handleGetArtist(artistId, env);
    }

    // Time To Eat podium
    if (pathname === "/podium" && request.method === "GET") {
      return handleGetPodium(request, env);
    }

    if (pathname === "/podium" && request.method === "POST") {
      return handleUpdatePodium(request, env);
    }

    // Admin UI endpoints
    if (pathname.startsWith("/admin/") && request.method === "GET") {
      return handleAdminEndpoint(pathname, env);
    }

    return json({ error: "Not found" }, 404);
  }
};

async function handleAnalytics(request, env) {
  try {
    const url = new URL(request.url);
    const period = url.searchParams.get("period") || "7d";

    // Get beats analytics
    const beatsList = await env.RB_ARTISTS.list({ prefix: "beats:" });
    const beats = [];
    for (const key of beatsList.keys) {
      const beatData = await env.RB_ARTISTS.get(key.name);
      if (beatData) beats.push(JSON.parse(beatData));
    }

    // Get task analytics
    const taskList = await env.RB_TASKS.list({ prefix: "task:" });
    const tasks = [];
    for (const key of taskList.keys) {
      const taskData = await env.RB_TASKS.get(key.name);
      if (taskData) tasks.push(JSON.parse(taskData));
    }

    // Calculate metrics
    const analytics = {
      period,
      beats: {
        total: beats.length,
        byGenre: beats.reduce((acc, beat) => {
          acc[beat.genre] = (acc[beat.genre] || 0) + 1;
          return acc;
        }, {}),
        avgPrice: beats.length > 0 ? beats.reduce((sum, beat) => sum + beat.price, 0) / beats.length : 0
      },
      tasks: {
        total: tasks.length,
        byStatus: tasks.reduce((acc, task) => {
          acc[task.status] = (acc[task.status] || 0) + 1;
          return acc;
        }, {}),
        completed: tasks.filter(t => t.status === "completed").length
      },
      generatedAt: Date.now()
    };

    return json(analytics);
  } catch (error) {
    console.error("Analytics error:", error);
    return json({ error: "Failed to get analytics" }, 500);
  }
}

async function handleGetTiers(request, env) {
  try {
    const tiers = [];
    const list = await env.RB_TIERS.list({ prefix: "tier:" });

    for (const key of list.keys) {
      const tierData = await env.RB_TIERS.get(key.name);
      if (tierData) tiers.push(JSON.parse(tierData));
    }

    return json({ tiers });
  } catch (error) {
    console.error("Get tiers error:", error);
    return json({ error: "Failed to get tiers" }, 500);
  }
}

async function handleCreateTier(request, env) {
  try {
    const { name, rank, description, color } = await request.json();

    if (!name || !rank) {
      return json({ error: "Missing name or rank" }, 400);
    }

    const tier = {
      id: generateId(),
      name,
      rank: parseInt(rank),
      description: description || "",
      color: color || "#666",
      createdAt: Date.now()
    };

    await env.RB_TIERS.put(`tier:${tier.id}`, JSON.stringify(tier));

    return json({ tier });
  } catch (error) {
    console.error("Create tier error:", error);
    return json({ error: "Failed to create tier" }, 500);
  }
}

async function handleUpdateTier(tierId, request, env) {
  try {
    const updates = await request.json();

    const tierData = await env.RB_TIERS.get(`tier:${tierId}`);
    if (!tierData) {
      return json({ error: "Tier not found" }, 404);
    }

    const tier = JSON.parse(tierData);
    Object.assign(tier, updates, { updatedAt: Date.now() });

    await env.RB_TIERS.put(`tier:${tierId}`, JSON.stringify(tier));

    return json({ tier });
  } catch (error) {
    console.error("Update tier error:", error);
    return json({ error: "Failed to update tier" }, 500);
  }
}

async function handleGetArtists(request, env) {
  try {
    const url = new URL(request.url);
    const tier = url.searchParams.get("tier");

    const artists = [];
    const list = await env.RB_ARTISTS.list({ prefix: "artist:" });

    for (const key of list.keys) {
      const artistData = await env.RB_ARTISTS.get(key.name);
      if (artistData) {
        const artist = JSON.parse(artistData);
        if (!tier || artist.tier === tier) {
          artists.push(artist);
        }
      }
    }

    return json({ artists });
  } catch (error) {
    console.error("Get artists error:", error);
    return json({ error: "Failed to get artists" }, 500);
  }
}

async function handleCreateArtist(request, env) {
  try {
    const { name, bio, tier, imageUrl, socialLinks } = await request.json();

    if (!name) {
      return json({ error: "Missing name" }, 400);
    }

    const artist = {
      id: generateId(),
      name,
      bio: bio || "",
      tier: tier || "unranked",
      imageUrl: imageUrl || null,
      socialLinks: socialLinks || {},
      stats: {
        beatsCount: 0,
        totalPlays: 0,
        totalRevenue: 0
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await env.RB_ARTISTS.put(`artist:${artist.id}`, JSON.stringify(artist));

    return json({ artist });
  } catch (error) {
    console.error("Create artist error:", error);
    return json({ error: "Failed to create artist" }, 500);
  }
}

async function handleGetArtist(artistId, env) {
  try {
    const artistData = await env.RB_ARTISTS.get(`artist:${artistId}`);

    if (!artistData) {
      return json({ error: "Artist not found" }, 404);
    }

    return json(JSON.parse(artistData));
  } catch (error) {
    console.error("Get artist error:", error);
    return json({ error: "Failed to get artist" }, 500);
  }
}

async function handleGetPodium(request, env) {
  try {
    // Get all artists sorted by tier rank
    const artists = [];
    const list = await env.RB_ARTISTS.list({ prefix: "artist:" });

    for (const key of list.keys) {
      const artistData = await env.RB_ARTISTS.get(key.name);
      if (artistData) artists.push(JSON.parse(artistData));
    }

    // Get tiers for ranking
    const tiers = [];
    const tierList = await env.RB_TIERS.list({ prefix: "tier:" });
    for (const key of tierList.keys) {
      const tierData = await env.RB_TIERS.get(key.name);
      if (tierData) tiers.push(JSON.parse(tierData));
    }

    // Sort tiers by rank
    tiers.sort((a, b) => a.rank - b.rank);

    // Build podium (top 3 from highest tier)
    const podium = [];
    const topTier = tiers[0];
    
    if (topTier) {
      const topArtists = artists
        .filter(a => a.tier === topTier.name)
        .sort((a, b) => b.stats.totalRevenue - a.stats.totalRevenue)
        .slice(0, 3);
      
      podium.push(...topArtists.map((artist, index) => ({
        ...artist,
        podiumPosition: index + 1
      })));
    }

    return json({ podium, tiers });
  } catch (error) {
    console.error("Get podium error:", error);
    return json({ error: "Failed to get podium" }, 500);
  }
}

async function handleUpdatePodium(request, env) {
  try {
    const { tierId, artistIds } = await request.json();

    if (!tierId || !artistIds) {
      return json({ error: "Missing tierId or artistIds" }, 400);
    }

    // Update tier rankings
    const tierData = await env.RB_TIERS.get(`tier:${tierId}`);
    if (!tierData) {
      return json({ error: "Tier not found" }, 404);
    }

    const tier = JSON.parse(tierData);
    tier.artistIds = artistIds;
    tier.updatedAt = Date.now();

    await env.RB_TIERS.put(`tier:${tierId}`, JSON.stringify(tier));

    return json({ tier });
  } catch (error) {
    console.error("Update podium error:", error);
    return json({ error: "Failed to update podium" }, 500);
  }
}

async function handleAdminEndpoint(pathname, env) {
  try {
    const endpoint = pathname.replace("/admin/", "");

    switch (endpoint) {
      case "overview":
        return json({
          message: "Admin overview endpoint",
          workers: ["ops", "media", "beats", "ai", "dashboard"],
          status: "operational"
        });
      case "users":
        return json({ users: [] });
      case "settings":
        return json({ settings: {} });
      default:
        return json({ error: "Unknown admin endpoint" }, 404);
    }
  } catch (error) {
    console.error("Admin endpoint error:", error);
    return json({ error: "Failed to handle admin endpoint" }, 500);
  }
}

function cors(response) {
  const headers = new Headers(response.headers);
  // Use environment variable for CORS origin, fallback to wildcard for development
  const corsOrigin = typeof process !== 'undefined' && process.env?.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN 
    : "*";
  headers.set("Access-Control-Allow-Origin", corsOrigin);
  headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
  return new Response(response.body, { status: response.status, headers });
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
