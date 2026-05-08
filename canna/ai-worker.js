// ai-worker.js
// RELENTLESS BILLIONAIRE – AI Worker
// - OCR ingestion
// - Task queue (RB_TASKS, RB_AI_QUEUE)
// - AI processing
// - AI → KV → Dashboard pipeline

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
      return new Response(JSON.stringify({ ok: true, worker: "ai" }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // OCR ingest
    if (pathname === "/ocr/ingest" && request.method === "POST") {
      return handleOCRIngest(request, env);
    }

    // Task queue management
    if (pathname === "/task/queue" && request.method === "GET") {
      return handleGetQueue(request, env);
    }

    if (pathname === "/task/queue" && request.method === "POST") {
      return handleAddToQueue(request, env);
    }

    // Generate content via AI
    if (pathname === "/generate" && request.method === "POST") {
      return handleGenerate(request, env);
    }

    // Process background task
    if (pathname === "/process" && request.method === "POST") {
      return handleProcess(request, env);
    }

    // Get task status
    if (pathname.startsWith("/task/") && request.method === "GET") {
      const taskId = pathname.split("/task/")[1];
      return handleGetTask(taskId, env);
    }

    return json({ error: "Not found" }, 404);
  }
};

async function handleOCRIngest(request, env) {
  try {
    const { imageUrl, type = "text" } = await request.json();

    if (!imageUrl) {
      return json({ error: "Missing imageUrl" }, 400);
    }

    // Create OCR task
    const task = {
      id: generateId(),
      type: "ocr",
      input: { imageUrl, type },
      status: "queued",
      createdAt: Date.now()
    };

    // Add to AI queue
    await env.RB_AI_QUEUE.put(`task:${task.id}`, JSON.stringify(task));

    // Also add to RB_TASKS for general task tracking
    await env.RB_TASKS.put(`task:${task.id}`, JSON.stringify(task));

    return json({ task, message: "OCR task queued for processing" });
  } catch (error) {
    console.error("OCR ingest error:", error);
    return json({ error: "Failed to queue OCR task" }, 500);
  }
}

async function handleGetQueue(request, env) {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");

    const tasks = [];
    const list = await env.RB_AI_QUEUE.list({ prefix: "task:" });

    for (const key of list.keys) {
      const taskData = await env.RB_AI_QUEUE.get(key.name);
      if (taskData) {
        const task = JSON.parse(taskData);
        if (!status || task.status === status) {
          tasks.push(task);
        }
      }
    }

    return json({ tasks });
  } catch (error) {
    console.error("Get queue error:", error);
    return json({ error: "Failed to get queue" }, 500);
  }
}

async function handleAddToQueue(request, env) {
  try {
    const { type, input, priority = "normal" } = await request.json();

    if (!type || !input) {
      return json({ error: "Missing type or input" }, 400);
    }

    const task = {
      id: generateId(),
      type,
      input,
      priority,
      status: "queued",
      createdAt: Date.now()
    };

    // Add to AI queue
    await env.RB_AI_QUEUE.put(`task:${task.id}`, JSON.stringify(task));

    // Also add to RB_TASKS for general task tracking
    await env.RB_TASKS.put(`task:${task.id}`, JSON.stringify(task));

    return json({ task });
  } catch (error) {
    console.error("Add to queue error:", error);
    return json({ error: "Failed to add task to queue" }, 500);
  }
}

async function handleGenerate(request, env) {
  try {
    const { prompt, model = "gpt-4", type = "text" } = await request.json();

    if (!prompt) {
      return json({ error: "Missing prompt" }, 400);
    }

    // Create generation task
    const task = {
      id: generateId(),
      type: "generation",
      input: { prompt, model, type },
      status: "queued",
      createdAt: Date.now()
    };

    // Add to AI queue
    await env.RB_AI_QUEUE.put(`task:${task.id}`, JSON.stringify(task));

    // Also add to RB_TASKS for general task tracking
    await env.RB_TASKS.put(`task:${task.id}`, JSON.stringify(task));

    return json({ task, message: "Generation task queued" });
  } catch (error) {
    console.error("Generate error:", error);
    return json({ error: "Failed to queue generation task" }, 500);
  }
}

async function handleProcess(request, env) {
  try {
    const { taskId } = await request.json();

    if (!taskId) {
      return json({ error: "Missing taskId" }, 400);
    }

    const taskData = await env.RB_AI_QUEUE.get(`task:${taskId}`);
    if (!taskData) {
      return json({ error: "Task not found" }, 404);
    }

    const task = JSON.parse(taskData);

    // Update task status to processing
    task.status = "processing";
    task.processedAt = Date.now();
    await env.RB_AI_QUEUE.put(`task:${taskId}`, JSON.stringify(task));
    await env.RB_TASKS.put(`task:${taskId}`, JSON.stringify(task));

    // In production, this would call external AI APIs
    // For now, simulate processing
    setTimeout(async () => {
      task.status = "completed";
      task.completedAt = Date.now();
      task.output = { message: "Processing completed - integrate with external AI API" };
      await env.RB_AI_QUEUE.put(`task:${taskId}`, JSON.stringify(task));
      await env.RB_TASKS.put(`task:${taskId}`, JSON.stringify(task));
    }, 1000);

    return json({ task, message: "Task processing started" });
  } catch (error) {
    console.error("Process error:", error);
    return json({ error: "Failed to process task" }, 500);
  }
}

async function handleGetTask(taskId, env) {
  try {
    const taskData = await env.RB_AI_QUEUE.get(`task:${taskId}`);

    if (!taskData) {
      return json({ error: "Task not found" }, 404);
    }

    return json(JSON.parse(taskData));
  } catch (error) {
    console.error("Get task error:", error);
    return json({ error: "Failed to get task" }, 500);
  }
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
