import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { DropZone } from "@/components/DropZone";
import { ExportPanel } from "@/components/ExportPanel";
import { LandscapePreview } from "@/components/LandscapePreview";

const TITLE = "Portrait to Landscape Video Converter";
const DESCRIPTION =
  "Turn vertical videos into 16:9 landscape MP4s with a blurred background — right in your browser, no uploads.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [file, setFile] = useState<File | null>(null);
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-5 py-14">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          100% in your browser
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          Portrait to landscape video converter
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground">{DESCRIPTION}</p>
      </header>

      {!file || !src ? (
        <DropZone onFile={setFile} />
      ) : (
        <div className="flex flex-col gap-5">
          <LandscapePreview src={src} />
          <ExportPanel file={file} />
          <DropZone onFile={setFile} compact />
        </div>
      )}

      <footer className="mt-auto pt-6 text-xs text-muted-foreground">
        Nothing is uploaded anywhere. Conversion happens locally with FFmpeg compiled to
        WebAssembly.
      </footer>
    </main>
  );
}
