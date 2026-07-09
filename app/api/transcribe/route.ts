export const runtime = "nodejs";

const TRANSCRIPTION_MODEL = "gpt-4o-mini-transcribe";

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "OPENAI_API_KEY is not configured in Vercel." },
      { status: 500 }
    );
  }

  const incomingForm = await request.formData();
  const audio = incomingForm.get("audio");

  if (!(audio instanceof File)) {
    return Response.json({ error: "No audio file was provided." }, { status: 400 });
  }

  if (audio.size < 1024) {
    return Response.json({ text: "" });
  }

  const form = new FormData();
  form.append("file", audio, audio.name || "audio.webm");
  form.append("model", TRANSCRIPTION_MODEL);
  form.append("language", "en");

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`
    },
    body: form
  });

  if (!response.ok) {
    const message = await response.text();
    return Response.json(
      { error: message || "Unable to transcribe audio." },
      { status: response.status }
    );
  }

  const result = (await response.json()) as { text?: string };
  return Response.json({ text: result.text?.trim() ?? "" });
}
