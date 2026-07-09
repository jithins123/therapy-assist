# Therapy Assist

A personal prototype for live therapy-session language cueing.

The app captures or accepts session transcript text, highlights NLP Meta Model-style language patterns, and suggests therapist follow-up questions. It can listen through the microphone or through shared browser/tab audio, then feeds the transcript into the same rule engine.

## Current prototype

- Microphone audio capture
- Browser/tab audio capture
- OpenAI speech-to-text transcription endpoint
- Transcript text area
- Rule-based sentence analysis
- Highlight cards for detected client sentences
- Suggested follow-up questions for each cue
- Keep list and reviewed log
- Vercel-ready Next.js structure

## Environment variables

Set this in Vercel Project Settings > Environment Variables:

```bash
OPENAI_API_KEY=your_openai_api_key
```

The key is used only by the server route at `/api/transcribe`; it is not exposed to the browser.

## Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

Create a local `.env.local` file with `OPENAI_API_KEY` if you want transcription to work locally.

## Deploy on Vercel

1. Import this GitHub repository into Vercel.
2. Keep the framework preset as `Next.js`.
3. Use the default build command: `next build`.
4. Leave the output directory blank. Do not set it to `public`.
5. Add `OPENAI_API_KEY` in Environment Variables.

This repo includes `vercel.json` to force the Next.js framework preset and clear an accidental static-site output directory setting.

## Browser audio notes

For online meetings, click `Browser audio`, choose the meeting tab or screen from the browser picker, and make sure audio sharing is enabled. Browser support varies; Chrome usually gives the best tab-audio capture behavior.

## Clinical note

This prototype is a clinician cueing aid. It should present language-pattern prompts for therapist review, not diagnosis or autonomous treatment recommendations.
