import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

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
core.exec("-f", "lavfi", "-i", "color=c=red:s=90x160:d=0.1",
  "-vf", "scale=1920:1080", "-c:v", "libx264", "-preset", "ultrafast", "out.mp4");
assert.equal(core.ret, 0, logs.join("\n"));
assert.ok(core.FS.readFile("out.mp4").byteLength > 0);
console.log("FFmpeg core regression passed: encoded a 1920x1080 MP4.");
