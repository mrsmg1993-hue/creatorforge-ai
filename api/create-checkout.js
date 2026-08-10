// api/create-checkout.js
import Stripe from "stripe";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const { priceId, email, userId } = req.body || {};

  if (!priceId || !email || !userId) {
    return res.status(400).json({ error: "Dados ausentes" });
  }

  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["host"];
  const baseUrl = `${proto}://${host}`;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      client_reference_id: userId,
      success_url: `${baseUrl}/?checkout=sucesso`,
      cancel_url: `${baseUrl}/?checkout=cancelado`,
      locale: "pt-BR",
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao criar checkout" });
  }
}
