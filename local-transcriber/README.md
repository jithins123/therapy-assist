# Local Transcriber

This folder is for running transcription on your Windows machine with the Handy Parakeet ONNX model instead of sending audio to a cloud transcription API.

## Why this must be local

The Vercel app cannot read files from:

```text
C:\Users\jithi\AppData\Roaming\com.pais.handy\models
```

and it cannot load a 600MB local ONNX model from your computer. The practical architecture is:

```text
Therapy Assist in browser -> local helper on 127.0.0.1 -> Handy Parakeet ONNX model
```

## Model found on this machine

Handy has this local model installed:

```text
C:\Users\jithi\AppData\Roaming\com.pais.handy\models\parakeet-tdt-0.6b-v3-int8
```

Important files:

```text
config.json
nemo128.onnx
encoder-model.int8.onnx
decoder_joint-model.int8.onnx
vocab.txt
```

The model config says:

```json
{
  "model_type": "nemo-conformer-tdt",
  "features_size": 128,
  "subsampling_factor": 8
}
```

Handy's executable contains references to:

```text
transcribe-rs-0.3.8
transcribe_rs::onnx::parakeet
```

So the preferred implementation path is to build a small Rust HTTP server using the same `transcribe-rs` Parakeet ONNX path Handy uses.

## Target local API

The web app now tries this endpoint first:

```http
POST http://127.0.0.1:4317/transcribe
Content-Type: multipart/form-data

audio=<webm/wav audio file>
```

Response:

```json
{
  "text": "transcribed text"
}
```

If the local helper is not running, the browser falls back to the existing Vercel `/api/transcribe` endpoint.

## Build path

1. Install Rust from `https://rustup.rs`.
2. Create a small Rust server in this folder.
3. Add dependencies:
   - HTTP server: `axum`
   - multipart parsing: `axum` multipart feature
   - async runtime: `tokio`
   - local ASR: `transcribe-rs`
4. Point the helper at Handy's model directory.
5. Add a `/health` endpoint and a `/transcribe` endpoint.
6. Return CORS headers allowing the Vercel app origin.

## Why not implement the ONNX pipeline directly in TypeScript first?

Parakeet TDT is not a simple single ONNX call. It needs:

1. Audio decode and resampling.
2. NeMo-style feature extraction via `nemo128.onnx`.
3. Encoder inference.
4. Greedy TDT decoding through the decoder/joint model.
5. Vocabulary decoding and cleanup.

Using `transcribe-rs` avoids rebuilding that full decoder by hand.
