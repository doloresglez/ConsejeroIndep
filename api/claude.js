const MAX_PROMPT = 75000;
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({error:'Método no permitido'});
  const {prompt, effort} = req.body || {};
  if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > MAX_PROMPT) return res.status(400).json({error:'Solicitud inválida'});
  if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({error:'Falta configurar ANTHROPIC_API_KEY'});
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST',
      headers:{'content-type':'application/json','x-api-key':process.env.ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01'},
      body:JSON.stringify({model:process.env.CLAUDE_MODEL || 'claude-sonnet-4-5',max_tokens:effort==='medium'?4500:900,messages:[{role:'user',content:prompt+'\n\nResponde exclusivamente con JSON válido.'}]})
    });
    const payload = await response.json();
    if (!response.ok) return res.status(response.status===429?429:502).json({error:'Error del proveedor de IA'});
    const raw = (payload.content||[]).filter(x=>x.type==='text').map(x=>x.text).join('').trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');
    let result;
    try { result=JSON.parse(raw); } catch { return res.status(502).json({error:'La IA no devolvió JSON válido'}); }
    return res.status(200).json({result});
  } catch(e) {return res.status(502).json({error:'No se pudo contactar al proveedor'});}
}
