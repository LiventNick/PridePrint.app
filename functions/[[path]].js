export async function onRequest(context) {
  // Fetch the original request (which will serve the static index.html for SPA routes)
  const response = await context.next();
  
  // Only process HTML responses
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) {
    return response;
  }

  const url = new URL(context.request.url);
  
  // Default metadata (matches what's in index.html)
  let title = "Nick's Pride Print Shop";
  let description = "A suite of powerful, client-side PDF tools designed for print shop workflows.";
  
  // Dynamic overrides based on the route
  if (url.pathname.includes('/poster-optimizer')) {
    title = "Poster Optimizer - Nick's Pride Print Shop";
    description = "Perfectly scale and organize your Canva exports for regular printing. Features side-by-side layouts and advanced rasterization.";
  } else if (url.pathname.includes('/button-printer')) {
    title = "Button Printer - Nick's Pride Print Shop";
    description = "Automatically crop and perfectly arrange your photos onto a print-ready PDF sheet for button making!";
  }

  // Use Cloudflare's HTMLRewriter to inject the correct metadata for social scrapers
  return new HTMLRewriter()
    .on('title', {
      element(element) {
        element.setInnerContent(title);
      }
    })
    .on('meta[name="description"]', {
      element(element) {
        element.setAttribute("content", description);
      }
    })
    .on('meta[property="og:title"]', {
      element(element) {
        element.setAttribute("content", title);
      }
    })
    .on('meta[property="og:description"]', {
      element(element) {
        element.setAttribute("content", description);
      }
    })
    .on('meta[property="twitter:title"]', {
      element(element) {
        element.setAttribute("content", title);
      }
    })
    .on('meta[property="twitter:description"]', {
      element(element) {
        element.setAttribute("content", description);
      }
    })
    .transform(response);
}
