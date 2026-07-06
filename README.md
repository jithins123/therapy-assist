# Therapy Assist

A personal prototype for live therapy-session language cueing.

The first version is a browser-based Next.js app that lets you paste or type session transcript text and highlights NLP Meta Model-style language patterns, such as universal generalizations, mind reading, modal operators, lost performatives, cause-effect statements, comparative deletions, and nominalizations.

## Current prototype

- Transcript text area
- Rule-based sentence analysis
- Highlight cards for detected client sentences
- Suggested follow-up questions for each cue
- Vercel-ready Next.js structure

## Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Deploy on Vercel

1. Import this GitHub repository into Vercel.
2. Keep the framework preset as `Next.js`.
3. Use the default build command: `next build`.
4. Use the default output settings.

## Next planned step

Add browser microphone transcription so spoken client sentences can feed the same rule engine in real time.

## Clinical note

This prototype is a clinician cueing aid. It should present language-pattern prompts for therapist review, not diagnosis or autonomous treatment recommendations.
