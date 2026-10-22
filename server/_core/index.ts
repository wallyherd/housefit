import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { publicPlatformScript } from "./publicConfig";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app.get("/api/platform/config.js", (_req, res) => {
    res.set("Cache-Control", "no-store").type("application/javascript").send(publicPlatformScript());
  });

  app.post("/api/infinitepay", async (req, res) => {
    const apiKey = process.env.INFINITEPAY_API_KEY || "inchk_0pswc_PCLuoj9qlC6O7ddtrkyvSpgdXz6OcuLWU0irY";
    try {
      const { orderNumber, amount, description } = req.body || {};
      if (!amount || amount <= 0) {
        return res.status(400).json({ success: false, message: "Valor inválido" });
      }
      const cleanOrderNumber = (orderNumber || "HF-PEDIDO").toString().replace(/[^a-zA-Z0-9]/g, "");
      const priceInCents = Math.round(Number(amount) * 100);
      const cleanDescription = (description || `Pedido HouseFit #${cleanOrderNumber}`).slice(0, 100);

      const payload = {
        order_nsu: cleanOrderNumber,
        redirect_url: "https://housefit-alpha.vercel.app",
        items: [
          {
            quantity: 1,
            price: priceInCents,
            description: cleanDescription,
          },
        ],
      };

      const resp = await fetch("https://api.checkout.infinitepay.io/links", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": apiKey.trim(),
        },
        body: JSON.stringify(payload),
      });

      const data = await resp.json();
      if (resp.ok && data?.url) {
        return res.status(200).json({ success: true, url: data.url, orderNsu: cleanOrderNumber });
      }
      return res.status(resp.status || 500).json({ success: false, message: data?.message || "Erro InfinitePay", details: data });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = Number(process.env.PORT || "3000");
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid PORT");
  server.on("error", error => { console.error("Server failed:", error.message); process.exit(1); });
  server.listen(port, "0.0.0.0", () => console.log(`Server listening on port ${port}`));
}

startServer().catch(error => { console.error(error); process.exit(1); });
