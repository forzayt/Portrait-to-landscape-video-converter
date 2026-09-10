# Portrait to Landscape Magic

Build a simple React + Vite web application that converts portrait videos into 16:9 landscape videos entirely in the browser without a backend. The app should allow users to upload a local video, display an instant landscape preview by rendering the same video twice (a full-screen blurred background layer using object-fit: cover, filter: blur(40px) and slight scale, with the original video centered on top using object-fit: contain), and preserve audio. Include a single "Export" button that generates a real 1920×1080 MP4 using FFmpeg WASM with the blurred background composited behind the original video. Keep the UI minimal with drag-and-drop upload, a preview canvas, a progress indicator during export, and a download button for the finished video. Use modern React functional components, avoid any backend or cloud uploads, and keep the code clean, modular, and easy to maintain.    app name is poatrait  to landscae  video converter

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/bb5366a1-8afa-4d11-904e-1c4c21e45273).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
