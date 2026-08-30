export async function readJson(res: Response): Promise<Record<string, any>> {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    const clip = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 180);
    if (/FUNCTION_INVOCATION_TIMEOUT|timed out|timeout/i.test(clip + text)) {
      return { error: "That one took too long. Ask again — we'll reuse a still if we have it." };
    }
    return { error: clip || `Bad response (${res.status})` };
  }
}
