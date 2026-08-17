// Cloudflare Worker — CORS-прокси для Kimi API
// Деплой: wrangler deploy (нужен бесплатный аккаунт Cloudflare)
//
// 1. Установите Wrangler: npm install -g wrangler
// 2. Авторизуйтесь: wrangler login
// 3. Задеплойте: wrangler deploy
// 4. Полученный URL вставьте в настройки приложения (поле «Прокси»)

export default {
  async fetch(request) {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(request),
      });
    }

    // Proxy to Kimi API
    const url = new URL(request.url);
    const target = new URL(url.pathname, "https://api.moonshot.cn/v1");

    try {
      const proxyHeaders = new Headers(request.headers);
      proxyHeaders.delete("origin");
      proxyHeaders.delete("referer");
      proxyHeaders.delete("host");

      const response = await fetch(target.toString(), {
        method: request.method,
        headers: proxyHeaders,
        body: request.body,
      });

      const body = await response.text();
      return new Response(body, {
        status: response.status,
        headers: {
          "Content-Type": response.headers.get("Content-Type") || "application/json",
          ...corsHeaders(request),
        },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ error: err.message || "Proxy error" }),
        {
          status: 502,
          headers: { "Content-Type": "application/json", ...corsHeaders(request) },
        }
      );
    }
  },
};

function corsHeaders(request) {
  const origin = request.headers.get("origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}
