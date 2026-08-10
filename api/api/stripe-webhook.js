// api/stripe-webhook.js
// A Stripe chama esta URL sempre que algo acontece (pagamento aprovado,
// assinatura cancelada, etc). É aqui que liberamos o plano do usuário.

import Stripe from "stripe";

export const config = { api: { bodyParser: false } };

// Mapa dos IDs de preço da Stripe para o nome do plano no nosso banco
const PRICE_TO_PLANO = {
  price_1U2wSzAdNZPVFECJyDjBVhlw: "starter",
  price_1U2wWBAdNZPVFECJocXPpv8T: "pro",
  price_1U2wX1AdNZPVFECJgmturYPs: "anual",
};

async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

async function updatePlano(userId, plano) {
  const url = `${process.env.SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`;
  await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      apikey: process.env.SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      plano,
      plano_atualizado_em: new Date().toISOString(),
    }),
  });
}

export default async function handler(req, res) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    const buf = await buffer(req);
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Assinatura do webhook inválida:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userId = session.client_reference_id;

      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
      const priceId = lineItems.data[0]?.price?.id;
      const plano = PRICE_TO_PLANO[priceId] || "free";

      if (userId) {
        await updatePlano(userId, plano);
      }
    }

    if (event.type === "customer.subscription.deleted") {
      // Assinatura cancelada — poderia buscar o usuário pelo customer id
      // e voltar o plano para "free". Deixado simples por enquanto.
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao processar webhook" });
  }
}
