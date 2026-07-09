"use client";

import { useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  BookmarkPlus,
  CheckCheck,
  Circle,
  ClipboardList,
  Highlighter,
  ListChecks,
  Mic,
  MonitorUp,
  Sparkles,
  Square,
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

type CaptureSource = "mic" | "browser";

export default function Home() {
  const [transcript, setTranscript] = useState(sampleTranscript);
  const [keptCues, setKeptCues] = useState<CueLogEntry[]>([]);
  const [reviewedCues, setReviewedCues] = useState<CueLogEntry[]>([]);
  const [captureSource, setCaptureSource] = useState<CaptureSource | null>(null);
  const [captureStatus, setCaptureStatus] = useState("Idle");
  const [transcriptionError, setTranscriptionError] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isRecording = captureSource !== null;
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

  async function startCapture(source: CaptureSource) {
    if (isRecording) {
      return;
    }

    setTranscriptionError("");
    setCaptureStatus(source === "mic" ? "Requesting microphone..." : "Choose a tab or screen with audio enabled...");

    try {
      const captureStream = source === "mic" ? await getMicrophoneStream() : await getBrowserAudioStream();
      const audioTracks = captureStream.getAudioTracks();

      if (audioTracks.length === 0) {
        stopStream(captureStream);
        throw new Error("No audio track was shared. For browser audio, choose a browser tab and enable tab audio sharing.");
      }

      const recordingStream = new MediaStream(audioTracks);
      const recorder = createMediaRecorder(recordingStream);
      mediaRecorderRef.current = recorder;
      streamRef.current = captureStream;

      recorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 1024) {
          void transcribeChunk(event.data, source);
        }
      });

      recorder.addEventListener("stop", () => {
        stopStream(captureStream);
      });

      captureStream.getTracks().forEach((track) => {
        track.addEventListener("ended", stopCapture);
      });

      recorder.start(8000);
      setCaptureSource(source);
      setCaptureStatus(source === "mic" ? "Listening to microphone" : "Listening to browser audio");
    } catch (error) {
      setCaptureSource(null);
      setCaptureStatus("Idle");
      setTranscriptionError(error instanceof Error ? error.message : "Unable to start audio capture.");
    }
  }

  function stopCapture() {
    const recorder = mediaRecorderRef.current;

    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }

    if (streamRef.current) {
      stopStream(streamRef.current);
    }

    mediaRecorderRef.current = null;
    streamRef.current = null;
    setCaptureSource(null);
    setCaptureStatus("Idle");
  }

  async function transcribeChunk(blob: Blob, source: CaptureSource) {
    setCaptureStatus(source === "mic" ? "Transcribing microphone audio..." : "Transcribing browser audio...");

    const form = new FormData();
    form.append("audio", blob, `session-${source}-${Date.now()}.webm`);

    try {
      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: form
      });
      const result = (await response.json()) as { text?: string; error?: string };

      if (!response.ok) {
        throw new Error(result.error || "Transcription failed.");
      }

      if (result.text) {
        setTranscript((current) => [current.trim(), result.text].filter(Boolean).join(" "));
      }

      setCaptureStatus(source === "mic" ? "Listening to microphone" : "Listening to browser audio");
    } catch (error) {
      setTranscriptionError(error instanceof Error ? error.message : "Transcription failed.");
      setCaptureStatus(source === "mic" ? "Listening to microphone" : "Listening to browser audio");
    }
  }

  return (
    <main className="shell">
      <section className="topbar">
        <div>
          <p className="eyebrow">Private session assistant</p>
          <h1>Session Cue</h1>
        </div>
        <div className="status">
          <span className={isRecording ? "statusDot recording" : "statusDot"} />
          {captureStatus}
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
              <button className="iconButton" type="button" title="Clear transcript" aria-label="Clear transcript" onClick={() => setTranscript("")}>
                <Trash2 size={18} />
              </button>
            </div>
          </div>

          <div className="captureControls" aria-label="Audio capture controls">
            <button className="captureButton" type="button" onClick={() => void startCapture("mic")} disabled={isRecording}>
              <Mic size={18} />
              Mic
            </button>
            <button className="captureButton" type="button" onClick={() => void startCapture("browser")} disabled={isRecording}>
              <MonitorUp size={18} />
              Browser audio
            </button>
            <button className="captureButton stop" type="button" onClick={stopCapture} disabled={!isRecording}>
              <Square size={16} />
              Stop
            </button>
          </div>

          {transcriptionError ? <div className="captureError">{transcriptionError}</div> : null}

          <textarea
            value={transcript}
            onChange={(event) => setTranscript(event.target.value)}
            placeholder="Paste, type, or capture client sentences here."
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

async function getMicrophoneStream() {
  return navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true
    }
  });
}

async function getBrowserAudioStream() {
  return navigator.mediaDevices.getDisplayMedia({
    audio: true,
    video: true
  });
}

function createMediaRecorder(stream: MediaStream) {
  const options = getRecorderOptions();

  try {
    return options ? new MediaRecorder(stream, options) : new MediaRecorder(stream);
  } catch {
    return new MediaRecorder(stream);
  }
}

function stopStream(stream: MediaStream) {
  stream.getTracks().forEach((track) => track.stop());
}

function getRecorderOptions(): MediaRecorderOptions | undefined {
  const preferredTypes = ["audio/webm;codecs=opus", "audio/webm"];
  const mimeType = preferredTypes.find((type) => MediaRecorder.isTypeSupported(type));

  return mimeType ? { mimeType } : undefined;
}
