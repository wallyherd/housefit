export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const apiKey =
    process.env.INFINITEPAY_API_KEY ||
    "inchk_0pswc_PCLuoj9qlC6O7ddtrkyvSpgdXz6OcuLWU0irY";

  try {
    const { orderNumber, amount, description } = req.body || {};

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Valor inválido" });
    }

    const cleanOrderNumber = (orderNumber || "HF-PEDIDO")
      .toString()
      .replace(/[^a-zA-Z0-9]/g, "");

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

    const response = await fetch("https://api.checkout.infinitepay.io/links", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": apiKey.trim(),
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok && data?.url) {
      return res.status(200).json({
        success: true,
        url: data.url,
        orderNsu: cleanOrderNumber,
      });
    }

    console.error("InfinitePay API error response:", data);
    return res.status(response.status || 500).json({
      success: false,
      message: data?.message || "Erro ao gerar link com a InfinitePay",
      details: data,
    });
  } catch (err) {
    console.error("InfinitePay Serverless error:", err);
    return res.status(500).json({
      success: false,
      message: "Erro interno no servidor ao conectar com a InfinitePay",
      error: err.message,
    });
  }
}
