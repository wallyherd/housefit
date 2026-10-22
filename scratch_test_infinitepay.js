const apiKey = "inchk_0pswc_PCLuoj9qlC6O7ddtrkyvSpgdXz6OcuLWU0irY";

async function testFullLink() {
  const payload = {
    order_nsu: "HF-TESTE-" + Date.now(),
    redirect_url: "https://housefit-alpha.vercel.app",
    items: [
      {
        quantity: 1,
        price: 78450, // R$ 784,50
        description: "Pedido HouseFit (3 Combos + Entrega Cuiaba)"
      }
    ]
  };

  const res = await fetch("https://api.checkout.infinitepay.io/links", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": apiKey
    },
    body: JSON.stringify(payload)
  });

  console.log("Status:", res.status);
  const data = await res.json();
  console.log("Data:", data);
}

testFullLink();
