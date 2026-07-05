export async function onRequest(context) {
  const url = new URL(context.request.url);
  const targetUrl = url.searchParams.get("url");

  if (!targetUrl) {
    return new Response("Missing url parameter", { status: 400 });
  }

  try {
    // Fetch the target image
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "PridePrintProxy/1.0",
        "Accept": "image/*"
      }
    });

    // Create a new response with the same body and status
    const newResponse = new Response(response.body, response);
    
    // Add CORS headers so the browser allows the request
    newResponse.headers.set("Access-Control-Allow-Origin", "*");
    newResponse.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    
    return newResponse;
  } catch (err) {
    return new Response("Failed to fetch image", { status: 500 });
  }
}
