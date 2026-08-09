// api/config.js
// Entrega a URL e a chave PÚBLICA (anon) do Supabase para o frontend.
// A anon key é feita para ser usada no navegador — não é secreta,
// a segurança real vem das políticas RLS configuradas no banco.

export default function handler(req, res) {
  res.status(200).json({
    supabaseUrl: process.env.SUPABASE_URL || "",
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "",
  });
}
