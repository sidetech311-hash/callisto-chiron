import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory "active downloads" state
  const downloads = new Map();

  // API: Probe a URL for metadata
  app.post("/api/probe", async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    try {
      const response = await axios.head(url, {
        timeout: 5000,
        validateStatus: () => true
      });

      const contentLength = response.headers["content-length"];
      const contentType = response.headers["content-type"];
      let filename = "download";

      // Try to get filename from content-disposition
      const disposition = response.headers["content-disposition"];
      if (disposition && typeof disposition === "string" && disposition.includes("filename=")) {
        filename = disposition.split("filename=")[1].replace(/"/g, "").split(";")[0].trim();
      } else {
        // Fallback to URL path
        try {
          const urlObj = new URL(url);
          const pathParts = urlObj.pathname.split("/");
          const lastPart = pathParts[pathParts.length - 1];
          if (lastPart) filename = lastPart;
        } catch (e) {}
      }

      res.json({
        filename,
        size: typeof contentLength === "string" ? parseInt(contentLength) : (typeof contentLength === "number" ? contentLength : 0),
        type: typeof contentType === "string" ? contentType : "application/octet-stream",
        acceptRanges: response.headers["accept-ranges"] === "bytes"
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API: Get active downloads
  app.get("/api/downloads", (req, res) => {
    res.json(Array.from(downloads.values()));
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Nexus IDM Server running on http://localhost:${PORT}`);
  });
}

startServer();
