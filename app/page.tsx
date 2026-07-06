"use client";

import { useMemo, useState } from "react";
import { AlertCircle, Circle, ClipboardList, Highlighter, Mic, Sparkles, Trash2 } from "lucide-react";
import { analyzeTranscript, type CuePriority } from "./lib/metaModelRules";

const sampleTranscript = `Everyone hates me. I can't tell my partner what I need. She thinks I am too much. I have to keep everyone happy. It is selfish to ask for space.`;

const priorityLabel: Record<CuePriority, string> = {
  high: "Strong cue",
  medium: "Useful cue",
  low: "Soft cue"
};

export default function Home() {
  const [transcript, setTranscript] = useState(sampleTranscript);
  const cues = useMemo(() => analyzeTranscript(transcript), [transcript]);

  return (
    <main className="shell">
      <section className="topbar">
        <div>
          <p className="eyebrow">Private session assistant</p>
          <h1>Session Cue</h1>
        </div>
        <div className="status">
          <span className="statusDot" />
          Rule engine active
        </div>
      </section>

      <section className="workspace" aria-label="Session cue workspace">
        <div className="transcriptPanel">
          <div className="panelHeader">
            <div>
              <p className="eyebrow">Transcript</p>
              <h2>Client language</h2>
            </div>
            <div className="buttonRow">
              <button className="iconButton" type="button" title="Microphone transcription coming next" aria-label="Microphone transcription coming next">
                <Mic size={18} />
              </button>
              <button className="iconButton" type="button" title="Clear transcript" aria-label="Clear transcript" onClick={() => setTranscript("")}>
                <Trash2 size={18} />
              </button>
            </div>
          </div>

          <textarea
            value={transcript}
            onChange={(event) => setTranscript(event.target.value)}
            placeholder="Paste or type client sentences here. Live microphone capture comes next."
            aria-label="Session transcript"
          />

          <div className="sentencePreview">
            <div className="previewHeader">
              <ClipboardList size={18} />
              <span>Detected sentences</span>
            </div>
            {transcript.trim() ? (
              <p>{transcript}</p>
            ) : (
              <p className="muted">No transcript yet.</p>
            )}
          </div>
        </div>

        <aside className="cuePanel" aria-label="Detected therapy cues">
          <div className="panelHeader">
            <div>
              <p className="eyebrow">Meta Model cues</p>
              <h2>{cues.length} highlights</h2>
            </div>
            <Highlighter size={22} />
          </div>

          <div className="cueList">
            {cues.length > 0 ? (
              cues.map((cue) => (
                <article className={`cueCard ${cue.priority}`} key={cue.id}>
                  <div className="cueMeta">
                    <span>{priorityLabel[cue.priority]}</span>
                    <span>{cue.pattern}</span>
                  </div>
                  <blockquote>{cue.sentence}</blockquote>
                  <div className="suggestion">
                    <Sparkles size={16} />
                    <strong>{cue.suggestion}</strong>
                  </div>
                  <p>{cue.description}</p>
                  <div className="questions">
                    {cue.alternatives.map((question) => (
                      <button type="button" key={question}>
                        {question}
                      </button>
                    ))}
                  </div>
                </article>
              ))
            ) : (
              <div className="emptyState">
                <AlertCircle size={24} />
                <h3>No cues yet</h3>
                <p>Sentences with patterns like "everyone," "I can't," or "she thinks" will appear here.</p>
              </div>
            )}
          </div>
        </aside>
      </section>

      <section className="ruleStrip" aria-label="Active rules">
        {["Generalization", "Mind reading", "I can't", "Have to", "Lost performative", "Cause-effect", "Comparison", "Nominalization"].map((label) => (
          <div className="rulePill" key={label}>
            <Circle size={8} />
            {label}
          </div>
        ))}
      </section>
    </main>
  );
}
