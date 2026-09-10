import { useEffect, useRef } from "react";

type LandscapePreviewProps = {
  src: string;
};

/**
 * Live 16:9 preview: the same video rendered twice — a blurred cover layer
 * behind, the untouched video contained on top. Audio plays from the front
 * layer only.
 */
export function LandscapePreview({ src }: LandscapePreviewProps) {
  const bgRef = useRef<HTMLVideoElement>(null);
  const fgRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const bg = bgRef.current;
    const fg = fgRef.current;
    if (!bg || !fg) return;

    const sync = () => {
      if (Math.abs(bg.currentTime - fg.currentTime) > 0.15) bg.currentTime = fg.currentTime;
    };
    const play = () => void bg.play().catch(() => {});
    const pause = () => bg.pause();

    fg.addEventListener("timeupdate", sync);
    fg.addEventListener("seeked", sync);
    fg.addEventListener("play", play);
    fg.addEventListener("pause", pause);
    return () => {
      fg.removeEventListener("timeupdate", sync);
      fg.removeEventListener("seeked", sync);
      fg.removeEventListener("play", play);
      fg.removeEventListener("pause", pause);
    };
  }, [src]);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border bg-black shadow-[var(--shadow-panel)]">
      <video
        ref={bgRef}
        src={src}
        muted
        playsInline
        loop
        aria-hidden
        className="absolute inset-0 h-full w-full scale-110 object-cover blur-[40px]"
      />
      <video
        ref={fgRef}
        src={src}
        controls
        playsInline
        loop
        className="relative h-full w-full object-contain"
      />
    </div>
  );
}
