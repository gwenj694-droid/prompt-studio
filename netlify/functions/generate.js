exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };
  try {
    const { subject, ageRange, ethnicity, customFeatures, scene, mood, outfit, lighting, platform } = JSON.parse(event.body);
    const key = process.env.OPENAI_API_KEY;

    const sysMsg = `You are a professional AI photography prompt engineer. Generate detailed, professional-grade image generation prompts optimised for specific AI platforms. Return ONLY the prompt text — no labels, no explanation, no quotes.`;

    const brief = `Subject: ${subject} in their ${ageRange}, ${ethnicity} appearance${customFeatures ? ', ' + customFeatures : ''}
Scene: ${scene}
Mood: ${mood}
Outfit: ${outfit}
Lighting: ${lighting}
Platform: ${platform}

Write a single professional photography prompt optimised for ${platform}. Include camera, lens, lighting, composition, expression and atmosphere details.`;

    const [r1, r2] = await Promise.all([
      callOpenAI(key, sysMsg, brief),
      callOpenAI(key, sysMsg, brief + '\n\nWrite a completely DIFFERENT creative variation — same brief, different angle and atmosphere.')
    ]);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ prompt: r1.trim(), variation: r2.trim() })
    };
  } catch(err) {
    return { statusCode: 500, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: err.message }) };
  }
};

async function callOpenAI(key, system, user) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
    body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: system }, { role: 'user', content: user }], max_tokens: 400 })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'OpenAI error');
  return data.choices[0].message.content;
}
