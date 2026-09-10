import { useCallback, useEffect, useState } from "react";

import { exportLandscapeVideo } from "@/lib/video-export";

type ExportPanelProps = {
  file: File;
};

type Status = "idle" | "working" | "done" | "error";

export function ExportPanel({ file }: ExportPanelProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [ratio, setRatio] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setStatus("idle");
    setRatio(0);
    setResult((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setMessage(null);
  }, [file]);

  const run = useCallback(async () => {
    setStatus("working");
    setRatio(0);
    setMessage(null);
    try {
      const blob = await exportLandscapeVideo(file, ({ ratio: r }) => setRatio(r));
      setResult(URL.createObjectURL(blob));
      setStatus("done");
    } catch (error) {
      console.error(error);
      setMessage(error instanceof Error ? error.message : "Export failed");
      setStatus("error");
    }
  }, [file]);

  const percent = Math.round(ratio * 100);
  const downloadName = file.name.replace(/\.[^.]+$/, "") + "-landscape.mp4";

  return (
    <div className="rounded-2xl border border-border bg-card/60 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium">Export 1920 × 1080 MP4</p>
          <p className="text-sm text-muted-foreground">
            Blurred background baked in, original audio kept.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={run}
            disabled={status === "working"}
            className="inline-flex items-center rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {status === "working" ? "Exporting…" : status === "done" ? "Export again" : "Export"}
          </button>
          {status === "done" && result && (
            <a
              href={result}
              download={downloadName}
              className="inline-flex items-center rounded-xl border border-border px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-secondary"
            >
              Download
            </a>
          )}
        </div>
      </div>

      {status === "working" && (
        <div className="mt-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-200"
              style={{ width: `${Math.max(percent, 3)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {percent > 0 ? `${percent}% complete` : "Loading converter…"} — this runs entirely in
            your browser.
          </p>
        </div>
      )}

      {status === "error" && message && (
        <p className="mt-4 text-sm text-destructive">{message}</p>
      )}
    </div>
  );
}
