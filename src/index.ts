export default {
  async fetch(request) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
      "Access-Control-Max-Age": "86400",
    };
    
    // The URL for the remote third party API you want to fetch from
    const API_URL = "https://examples.cloudflareworkers.com/demos/demoapi";
    const PROXY_ENDPOINT = "/corsproxy/";
    
    // Demo page function (unchanged)
    function rawHtmlResponse(html) {
      return new Response(html, {
        headers: {
          "content-type": "text/html;charset=UTF-8",
        },
      });
    }
    
    const DEMO_PAGE = `...`; // Demo HTML unchanged
    
    async function handleRequest(request) {
      const url = new URL(request.url);
      let apiUrl = url.searchParams.get("apiurl");
      if (apiUrl == null) {
        apiUrl = API_URL;
      }
      
      request = new Request(apiUrl, request);
      request.headers.set("Origin", new URL(apiUrl).origin);
      let response = await fetch(request);
      response = new Response(response.body, response);
      
      // GEÄNDERT: Universeller Zugriff statt domain-spezifisch
      response.headers.set("Access-Control-Allow-Origin", "*");
      
      // Optional: Vary header entfernen da nicht mehr nötig
      // response.headers.append("Vary", "Origin");
      
      return response;
    }
    
    async function handleOptions(request) {
      if (
        request.headers.get("Origin") !== null &&
        request.headers.get("Access-Control-Request-Method") !== null &&
        request.headers.get("Access-Control-Request-Headers") !== null
      ) {
        return new Response(null, {
          headers: {
            ...corsHeaders, // Verwendet bereits "*" für Access-Control-Allow-Origin
            "Access-Control-Allow-Headers": request.headers.get(
              "Access-Control-Request-Headers",
            ),
          },
        });
      } else {
        return new Response(null, {
          headers: {
            Allow: "GET, HEAD, POST, OPTIONS",
          },
        });
      }
    }
    
    // Rest des Codes unverändert...
    const url = new URL(request.url);
    if (url.pathname.startsWith(PROXY_ENDPOINT)) {
      if (request.method === "OPTIONS") {
        return handleOptions(request);
      } else if (
        request.method === "GET" ||
        request.method === "HEAD" ||
        request.method === "POST"
      ) {
        return handleRequest(request);
      } else {
        return new Response(null, {
          status: 405,
          statusText: "Method Not Allowed",
        });
      }
    } else {
      return rawHtmlResponse(DEMO_PAGE);
    }
  },
};
