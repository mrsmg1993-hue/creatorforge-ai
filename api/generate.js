export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GROQ_API_KEY não configurada no servidor" });
  }

  const { platform, niche, theme, duration, style } = req.body || {};

  if (!platform || !niche || !duration || !style) {
    return res.status(400).json({ error: "Campos obrigatórios ausentes" });
  }

  const prompt = `Você é um especialista em criação de conteúdo viral para redes sociais verticais (TikTok, Shorts, Reels).

Gere conteúdo para um vídeo com estes parâmetros:
- Plataforma: ${platform}
- Nicho: ${niche}
- Tema do vídeo: ${theme || "tema livre dentro do nicho"}
- Duração: ${duration} segundos
- Estilo: ${style}

Responda SOMENTE em JSON válido, sem markdown, sem crases, sem texto antes ou depois, seguindo exatamente este formato:

{
  "titulos": ["titulo 1", "titulo 2", "titulo 3"],
  "gancho": "texto do gancho forte para os primeiros segundos",
  "roteiro": [
    { "tempo": "0-3s", "texto": "..." },
    { "tempo": "3-10s", "texto": "..." }
  ],
  "descricao": "descrição pronta para publicar",
  "hashtags": ["#tag1", "#tag2"],
  "cta": "chamada para ação",
  "ideiasEdicao": ["ideia 1", "ideia 2"],
  "textosNaTela": ["texto 1", "texto 2"]
}

O roteiro deve cobrir a duração total de ${duration} segundos, dividido em blocos de tempo coerentes (normalmente entre 3 e 6 blocos). Escreva em português do Brasil, tom adequado ao estilo "${style}" e ao nicho "${niche}". Seja direto e específico, sem enrolação.`;

  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.9,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error("Groq error:", errText);
      return res.status(502).json({ error: "Falha ao consultar o Groq" });
    }

    const data = await groqRes.json();
    const text = data?.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      const cleaned = text.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(cleaned);
    }

    return res.status(200).json(parsed);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro interno ao gerar conteúdo" });
  }
}
