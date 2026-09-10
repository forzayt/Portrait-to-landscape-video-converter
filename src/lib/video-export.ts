/**
 * Browser-only 16:9 export pipeline built on ffmpeg.wasm.
 * Nothing leaves the device: the file is written to the in-memory FS,
 * transcoded, and read back as a Blob.
 */
import type { FFmpeg } from "@ffmpeg/ffmpeg";
import { DEFAULT_RESOLUTION, landscapeFilter, type ExportResolution } from "./export-resolution";

/**
 * The core must expose an ESM default export for FFmpeg's module worker.
 * Core script and wasm binary are both served same-origin from the public
 * directory, so the worker can import them directly. Blob URLs are
 * blocked by some iframe sandbox policies, so they are avoided.
 */
// Keep both files on the same release and bypass previously cached core assets.
const CORE_URL = "/ffmpeg/ffmpeg-core.js?v=0.12.10";
const WASM_URL = "/ffmpeg/ffmpeg-core.wasm?v=0.12.10";

let ffmpegPromise: Promise<FFmpeg> | null = null;

async function getFFmpeg(onLog?: (line: string) => void): Promise<FFmpeg> {
  if (!ffmpegPromise) {
    ffmpegPromise = (async () => {
      const { FFmpeg: FFmpegClass } = await import("@ffmpeg/ffmpeg");
      const ffmpeg = new FFmpegClass();
      await ffmpeg.load({
        coreURL: new URL(CORE_URL, location.origin).href,
        wasmURL: new URL(WASM_URL, location.origin).href,
      });
      return ffmpeg;
    })();
    ffmpegPromise.catch(() => {
      // Allow retry after a failed load (network hiccup, aborted import, …).
      ffmpegPromise = null;
    });
  }

  const instance = await ffmpegPromise;
  if (onLog) {
    instance.on("log", ({ message }) => onLog(message));
  }
  return instance;
}


export type ExportProgress = { ratio: number };

export async function exportLandscapeVideo(
  file: File,
  onProgress: (progress: ExportProgress) => void,
  resolution: ExportResolution = DEFAULT_RESOLUTION,
): Promise<Blob> {
  const { fetchFile } = await import("@ffmpeg/util");
  const ffmpeg = await getFFmpeg();

  const handleProgress = ({ progress }: { progress: number }) => {
    onProgress({ ratio: Math.min(Math.max(progress, 0), 1) });
  };
  ffmpeg.on("progress", handleProgress);

  const inputName = "input" + (file.name.match(/\.[a-z0-9]+$/i)?.[0] ?? ".mp4");
  const outputName = "landscape.mp4";

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(file));
    const exitCode = await ffmpeg.exec([
      "-i",
      inputName,
      "-filter_complex",
      landscapeFilter(resolution),
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      "-crf",
      "26",
      "-pix_fmt",
      "yuv420p",
      "-r",
      "30",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-movflags",
      "+faststart",
      outputName,
    ]);
    if (exitCode !== 0) throw new Error("Export failed. Try a lower resolution or a shorter video.");
    const data = (await ffmpeg.readFile(outputName)) as Uint8Array;
    const buffer = new ArrayBuffer(data.byteLength);
    new Uint8Array(buffer).set(data);
    return new Blob([buffer], { type: "video/mp4" });
  } finally {
    ffmpeg.off("progress", handleProgress);
    await ffmpeg.deleteFile(inputName).catch(() => {});
    await ffmpeg.deleteFile(outputName).catch(() => {});
  }
}

export function warmUpFFmpeg() {
  void getFFmpeg().catch(() => {
    ffmpegPromise = null;
  });
}
