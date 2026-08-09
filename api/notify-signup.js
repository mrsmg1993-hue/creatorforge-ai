// api/notify-signup.js
// Roda no servidor. Usa a RESEND_API_KEY (protegida) para mandar um
// e-mail pro dono do site sempre que alguém cria uma conta nova.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "RESEND_API_KEY não configurada" });
  }

  const { email, nome } = req.body || {};
  if (!email) {
    return res.status(400).json({ error: "E-mail ausente" });
  }

  try {
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: "CreatorForge AI <onboarding@resend.dev>",
        to: ["mrsmg1993@gmail.com"],
        subject: "🎉 Novo cadastro no CreatorForge AI",
        html: `
          <div style="font-family:sans-serif;background:#07020f;color:#fff;padding:24px;border-radius:12px;">
            <h2 style="color:#a855f7;">Novo usuário cadastrado!</h2>
            <p><strong>Nome:</strong> ${nome || "não informado"}</p>
            <p><strong>E-mail:</strong> ${email}</p>
            <p style="color:#9d94b8;font-size:12px;">Enviado automaticamente pelo CreatorForge AI.</p>
          </div>
        `,
      }),
    });

    if (!resendRes.ok) {
      const errText = await resendRes.text();
      console.error("Resend error:", errText);
      // Não bloqueia o cadastro do usuário mesmo se o e-mail falhar
      return res.status(200).json({ ok: true, emailSent: false });
    }

    return res.status(200).json({ ok: true, emailSent: true });
  } catch (err) {
    console.error(err);
    return res.status(200).json({ ok: true, emailSent: false });
  }
}
