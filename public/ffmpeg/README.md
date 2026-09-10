These files are the ESM assets from `@ffmpeg/core@0.12.10` (trailing whitespace removed):

- https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm/ffmpeg-core.js
- https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm/ffmpeg-core.wasm

Always update both files together. A mismatched pair can load successfully but
fail during encoding with an undefined `ASM_CONSTS[code].apply` call.
Update the version query in `src/lib/video-export.ts` when replacing these assets.

Run `node scripts/test-ffmpeg-core.mjs` to verify encoding with the shipped pair.
