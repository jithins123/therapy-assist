# Local Transcriber API Contract

The browser app should not know the internals of Parakeet. It should only know that a local service may be available.

## Health

```http
GET http://127.0.0.1:4317/health
```

Success:

```json
{
  "ok": true,
  "engine": "handy-parakeet",
  "model": "parakeet-tdt-0.6b-v3-int8"
}
```

## Transcribe

```http
POST http://127.0.0.1:4317/transcribe
Content-Type: multipart/form-data

audio=<audio file>
```

Success:

```json
{
  "text": "client speech goes here"
}
```

Failure:

```json
{
  "error": "human-readable error"
}
```

## Browser fallback order

1. Try local helper: `http://127.0.0.1:4317/transcribe`.
2. If unavailable, use the existing Vercel `/api/transcribe` OpenAI endpoint.
3. If neither is configured, show a clear setup message.

## CORS

The local helper must return CORS headers for the Vercel origin, for example:

```http
Access-Control-Allow-Origin: https://your-vercel-app.vercel.app
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

For private local testing, `Access-Control-Allow-Origin: *` is acceptable.
