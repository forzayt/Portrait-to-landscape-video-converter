import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import { EXPORT_RESOLUTIONS, landscapeFilter } from "../src/lib/export-resolution.ts";

// Exercise the shipped JS/WASM pair: loading alone does not detect mismatched
// Emscripten function addresses. The original pair crashed at the end of exec.
const source = await readFile(new URL("../public/ffmpeg/ffmpeg-core.js", import.meta.url), "utf8");
const wasmBinary = await readFile(new URL("../public/ffmpeg/ffmpeg-core.wasm", import.meta.url));
const context = vm.createContext({
  console, performance, WebAssembly, Uint8Array, atob,
  self: { location: { href: "http://localhost/ffmpeg/ffmpeg-core.js" } },
  importScripts() {},
});
vm.runInContext(source
  .replaceAll("import.meta.url", '"http://localhost/ffmpeg/ffmpeg-core.js"')
  .replace("export default createFFmpegCore;", ""), context);
const core = await context.createFFmpegCore({ wasmBinary });
const logs = [];
core.setLogger(({ message }) => logs.push(message));
for (const resolution of EXPORT_RESOLUTIONS) {
  logs.length = 0;
  core.reset();
  core.exec("-f", "lavfi", "-i", "color=c=red:s=90x160:d=0.04",
    "-filter_complex", landscapeFilter(resolution), "-c:v", "libx264",
    "-preset", "ultrafast", "-pix_fmt", "yuv420p", "out.mp4");
  assert.equal(core.ret, 0, logs.join("\n"));
  assert.ok(core.FS.readFile("out.mp4").byteLength > 0);
  core.reset();
  core.ffprobe("-v", "error", "-select_streams", "v:0", "-show_entries",
    "stream=width,height", "-of", "json", "-o", "probe.json", "out.mp4");
  assert.equal(core.ret, 0, logs.join("\n"));
  const { streams } = JSON.parse(core.FS.readFile("probe.json", { encoding: "utf8" }));
  assert.equal(streams[0].width, resolution.width);
  assert.equal(streams[0].height, resolution.height);
  core.FS.unlink("out.mp4");
  core.FS.unlink("probe.json");
  console.log(`FFmpeg regression passed: encoded and probed ${resolution.width}x${resolution.height} MP4.`);
}
