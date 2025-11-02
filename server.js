import { createServer } from "https";
import { parse } from "url";
import fs from "fs";
import next from "next";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const httpsOptions = {
  key: fs.readFileSync("localhost-key.pem"),
  cert: fs.readFileSync("localhost.pem"),
};

app.prepare().then(() => {
  createServer(httpsOptions, (req, res) => {
    // Header para protección contra downgrade attacks
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
    
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(3000, (err) => {
    if (err) throw err;
    console.log("🚀 Next.js HTTPS listo en https://localhost:3000");
    console.log("🔐 Canal Seguro habilitado: HTTPS + HSTS");
  });
});
