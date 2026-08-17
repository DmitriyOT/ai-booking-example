const PORT = 3001;

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(req.headers.get("origin") || "*"),
      });
    }

    const url = new URL(req.url);
    const target = url.searchParams.get("url");
    if (!target) {
      return new Response(JSON.stringify({ error: "Missing ?url= param" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin") || "*") },
      });
    }

    try {
      const proxyReq = new Request(target, {
        method: req.method,
        headers: stripHopHeaders(req.headers),
        body: req.body,
      });
      const res = await fetch(proxyReq);
      const body = await res.text();
      return new Response(body, {
        status: res.status,
        headers: {
          "Content-Type": res.headers.get("Content-Type") || "application/json",
          ...corsHeaders(req.headers.get("origin") || "*"),
        },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ error: err instanceof Error ? err.message : "Proxy error" }),
        { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin") || "*") } }
      );
    }
  },
});

function corsHeaders(origin: string) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

function stripHopHeaders(headers: Headers): Headers {
  const out = new Headers(headers);
  for (const h of ["host", "connection", "keep-alive", "transfer-encoding", "te", "trailer", "upgrade", "proxy-authorization", "proxy-authenticate"]) {
    out.delete(h);
  }
  out.delete("origin");
  out.delete("referer");
  return out;
}

console.log(`CORS proxy running on http://localhost:${PORT}`);
