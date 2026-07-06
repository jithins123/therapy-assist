"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  BookmarkPlus,
  CheckCheck,
  Circle,
  ClipboardList,
  Highlighter,
  ListChecks,
  Mic,
  Sparkles,
  Trash2
} from "lucide-react";
import { analyzeTranscript, type CuePriority, type MetaModelCue } from "./lib/metaModelRules";

const sampleTranscript = `Everyone hates me. I can't tell my partner what I need. She thinks I am too much. I have to keep everyone happy. It is selfish to ask for space.`;

const priorityLabel: Record<CuePriority, string> = {
  high: "Strong cue",
  medium: "Useful cue",
  low: "Soft cue"
};

type CueLogEntry = MetaModelCue & {
  loggedAt: string;
};

export default function Home() {
  const [transcript, setTranscript] = useState(sampleTranscript);
  const [keptCues, setKeptCues] = useState<CueLogEntry[]>([]);
  const [reviewedCues, setReviewedCues] = useState<CueLogEntry[]>([]);
  const cues = useMemo(() => analyzeTranscript(transcript), [transcript]);
  const reviewedCueIds = useMemo(() => new Set(reviewedCues.map((cue) => cue.id)), [reviewedCues]);
  const keptCueIds = useMemo(() => new Set(keptCues.map((cue) => cue.id)), [keptCues]);
  const activeCues = cues.filter((cue) => !reviewedCueIds.has(cue.id));

  function keepCue(cue: MetaModelCue) {
    setKeptCues((current) => {
      if (current.some((keptCue) => keptCue.id === cue.id)) {
        return current;
      }

      return [{ ...cue, loggedAt: new Date().toLocaleTimeString() }, ...current];
    });
  }

  function reviewCue(cue: MetaModelCue) {
    setReviewedCues((current) => {
      if (current.some((reviewedCue) => reviewedCue.id === cue.id)) {
        return current;
      }

      return [{ ...cue, loggedAt: new Date().toLocaleTimeString() }, ...current];
    });
  }

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
              <h2>{activeCues.length} active highlights</h2>
            </div>
            <Highlighter size={22} />
          </div>

          <div className="cueList">
            {activeCues.length > 0 ? (
              activeCues.map((cue) => (
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
                  <div className="cueActions" aria-label="Cue actions">
                    <button type="button" onClick={() => keepCue(cue)} disabled={keptCueIds.has(cue.id)}>
                      <BookmarkPlus size={16} />
                      {keptCueIds.has(cue.id) ? "Kept" : "Keep"}
                    </button>
                    <button type="button" onClick={() => reviewCue(cue)}>
                      <CheckCheck size={16} />
                      Reviewed
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="emptyState">
                <AlertCircle size={24} />
                <h3>No active cues</h3>
                <p>New client sentences will appear here. Reviewed cues move to the session log.</p>
              </div>
            )}
          </div>
        </aside>
      </section>

      <section className="sessionLog" aria-label="Session log">
        <div className="logPanel">
          <div className="panelHeader compactHeader">
            <div>
              <p className="eyebrow">Keep list</p>
              <h2>{keptCues.length} saved cues</h2>
            </div>
            <BookmarkPlus size={20} />
          </div>
          <CueLogList cues={keptCues} emptyText="Cues you keep will collect here for later notes." />
        </div>

        <div className="logPanel">
          <div className="panelHeader compactHeader">
            <div>
              <p className="eyebrow">Reviewed log</p>
              <h2>{reviewedCues.length} cleared cues</h2>
            </div>
            <ListChecks size={20} />
          </div>
          <CueLogList cues={reviewedCues} emptyText="Reviewed cues will be logged here after they leave the active panel." />
        </div>
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

function CueLogList({ cues, emptyText }: { cues: CueLogEntry[]; emptyText: string }) {
  if (cues.length === 0) {
    return <p className="logEmpty">{emptyText}</p>;
  }

  return (
    <div className="logList">
      {cues.map((cue) => (
        <article className="logItem" key={`${cue.id}-${cue.loggedAt}`}>
          <div className="cueMeta">
            <span>{cue.loggedAt}</span>
            <span>{cue.pattern}</span>
          </div>
          <p>{cue.sentence}</p>
          <strong>{cue.suggestion}</strong>
        </article>
      ))}
    </div>
  );
}
