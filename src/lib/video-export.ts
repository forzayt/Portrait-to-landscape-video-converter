/**
 * Browser-only 16:9 export pipeline built on ffmpeg.wasm.
 * Nothing leaves the device: the file is written to the in-memory FS,
 * transcoded, and read back as a Blob.
 */
import type { FFmpeg } from "@ffmpeg/ffmpeg";

import wasmAsset from "@/assets/ffmpeg-core.wasm.asset.json";

/**
 * The core must expose an ESM default export for FFmpeg's module worker.
 * Core script and wasm binary are both served same-origin (public dir and the
 * asset CDN path), so the worker can import them directly. Blob URLs are
 * blocked by some iframe sandbox policies, so they are avoided.
 */
const CORE_URL = "/ffmpeg/ffmpeg-core.js";

let ffmpegPromise: Promise<FFmpeg> | null = null;

async function getFFmpeg(onLog?: (line: string) => void): Promise<FFmpeg> {
  if (!ffmpegPromise) {
    ffmpegPromise = (async () => {
      const { FFmpeg: FFmpegClass } = await import("@ffmpeg/ffmpeg");
      const ffmpeg = new FFmpegClass();
      await ffmpeg.load({
        coreURL: new URL(CORE_URL, location.origin).href,
        wasmURL: new URL(wasmAsset.url, location.origin).href,
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


/** Blurred cover background + original video centered with contain, at 1920x1080. */
const FILTER_COMPLEX = [
  "[0:v]scale=256:144,setsar=1,",
  "scale=1920:1080:force_original_aspect_ratio=increase,",
  "crop=1920:1080,gblur=sigma=24[bg];",
  "[0:v]scale=1920:1080:force_original_aspect_ratio=decrease,setsar=1[fg];",
  "[bg][fg]overlay=(W-w)/2:(H-h)/2",
].join("");

export type ExportProgress = { ratio: number };

export async function exportLandscapeVideo(
  file: File,
  onProgress: (progress: ExportProgress) => void,
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
    await ffmpeg.exec([
      "-i",
      inputName,
      "-filter_complex",
      FILTER_COMPLEX,
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
    const data = (await ffmpeg.readFile(outputName)) as Uint8Array;
    const buffer = new ArrayBuffer(data.byteLength);
    new Uint8Array(buffer).set(data);
    await ffmpeg.deleteFile(inputName).catch(() => {});
    await ffmpeg.deleteFile(outputName).catch(() => {});
    return new Blob([buffer], { type: "video/mp4" });
  } finally {
    ffmpeg.off("progress", handleProgress);
  }
}

export function warmUpFFmpeg() {
  void getFFmpeg().catch(() => {
    ffmpegPromise = null;
  });
}
