import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

const server = http.createServer((req, res) => {
  const urlObj = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  let pathname = decodeURIComponent(urlObj.pathname);

  // Clean URLs & rewrites simulation
  if (pathname === "/" || pathname === "") {
    const host = (req.headers.host || "").toLowerCase();
    if (host.includes("cards.")) {
      pathname = "/portfolio.html";
    } else {
      pathname = "/portfolio.html"; // Default to portfolio in local dev
    }
  } else if (pathname === "/portfolio") {
    pathname = "/portfolio.html";
  } else if (pathname === "/card-reviews") {
    pathname = "/card-reviews.html";
  } else if (pathname === "/bank-support" || pathname === "/support") {
    pathname = "/support.html";
  } else if (pathname === "/disclaimer") {
    pathname = "/disclaimer.html";
  } else if (pathname === "/coming-soon") {
    pathname = "/coming-soon.html";
  }

  let filePath = path.join(__dirname, pathname);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }

  if (!fs.existsSync(filePath)) {
    const htmlFallback = filePath + ".html";
    if (fs.existsSync(htmlFallback)) {
      filePath = htmlFallback;
    } else {
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      res.end("<h1>404 Not Found</h1>");
      return;
    }
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  res.writeHead(200, { "Content-Type": contentType });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, () => {
  console.log(`Local dev server running on http://localhost:${PORT}`);
});
