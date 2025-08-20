export default {
  async fetch(request) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS,PUT,DELETE,PATCH",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Expose-Headers": "*",
      "Access-Control-Max-Age": "86400",
    };
    
    // The URL for the remote third party API you want to fetch from
    const API_URL = "https://examples.cloudflareworkers.com/demos/demoapi";
    const PROXY_ENDPOINT = "/corsproxy/";
    
    // Demo page function
    function rawHtmlResponse(html) {
      return new Response(html, {
        headers: {
          "content-type": "text/html;charset=UTF-8",
        },
      });
    }
    
    const DEMO_PAGE = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>CORS Proxy Demo</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .example { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }
        code { background: #e0e0e0; padding: 2px 4px; border-radius: 3px; }
      </style>
    </head>
    <body>
      <h1>CORS Proxy Demo</h1>
      <p>This worker acts as a CORS proxy. Use it by making requests to:</p>
      <div class="example">
        <code>${PROXY_ENDPOINT}?apiurl=YOUR_API_URL</code>
      </div>
      
      <h2>Example for Nextcloud Tasks API:</h2>
      <div class="example">
        <code>${PROXY_ENDPOINT}?apiurl=https://your-nextcloud.com/remote.php/dav/tasks/</code>
      </div>
      
      <h2>JavaScript Example:</h2>
      <div class="example">
        <pre>
fetch('${PROXY_ENDPOINT}?apiurl=https://your-nextcloud.com/remote.php/dav/tasks/', {
  method: 'GET',
  headers: {
    'Authorization': 'Basic ' + btoa('username:password'),
    'Content-Type': 'application/json'
  }
})
.then(response => response.text())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
        </pre>
      </div>
    </body>
    </html>
    `;
    
    async function handleRequest(request) {
      const url = new URL(request.url);
      let apiUrl = url.searchParams.get("apiurl");
      
      if (apiUrl == null) {
        apiUrl = API_URL;
      }
      
      // Neuen Request mit allen ursprünglichen Headern erstellen
      const proxyRequest = new Request(apiUrl, {
        method: request.method,
        headers: request.headers,
        body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : null
      });
      
      try {
        let response = await fetch(proxyRequest);
        
        // Neue Response mit CORS-Headern erstellen
        const corsResponse = new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: {
            // Alle ursprünglichen Response-Header beibehalten
            ...Object.fromEntries(response.headers.entries()),
            // CORS-Header hinzufügen/überschreiben
            ...corsHeaders
          }
        });
        
        return corsResponse;
        
      } catch (error) {
        console.error('Proxy request failed:', error);
        return new Response(JSON.stringify({
          error: 'Proxy request failed',
          message: error.message
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }
    }
    
    async function handleOptions(request) {
      // Pre-flight CORS request
      if (
        request.headers.get("Origin") !== null &&
        request.headers.get("Access-Control-Request-Method") !== null
      ) {
        const requestedHeaders = request.headers.get("Access-Control-Request-Headers");
        
        return new Response(null, {
          headers: {
            ...corsHeaders,
            "Access-Control-Allow-Headers": requestedHeaders || "*",
          },
        });
      } else {
        // Standard OPTIONS response
        return new Response(null, {
          headers: {
            "Allow": "GET, HEAD, POST, OPTIONS, PUT, DELETE, PATCH",
            ...corsHeaders
          },
        });
      }
    }
    
    // Main request handling
    const url = new URL(request.url);
    
    if (url.pathname.startsWith(PROXY_ENDPOINT)) {
      if (request.method === "OPTIONS") {
        return handleOptions(request);
      } else if (
        ["GET", "HEAD", "POST", "PUT", "DELETE", "PATCH"].includes(request.method)
      ) {
        return handleRequest(request);
      } else {
        return new Response(JSON.stringify({
          error: 'Method not allowed',
          allowed: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
        }), {
          status: 405,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }
    } else {
      return rawHtmlResponse(DEMO_PAGE);
    }
  },
};
