export async function api(path, method = "GET", body = null) {
  const res = await fetch(`https://api.relentlessbillionaire.com${path}`, {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : null
  });

  return res.json();
}
