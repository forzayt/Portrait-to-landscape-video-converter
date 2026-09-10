import { useCallback, useRef, useState } from "react";

type DropZoneProps = {
  onFile: (file: File) => void;
  compact?: boolean;
};

export function DropZone({ onFile, compact = false }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const pick = useCallback(
    (files: FileList | null) => {
      const file = Array.from(files ?? []).find((f) => f.type.startsWith("video/"));
      if (file) onFile(file);
    },
    [onFile],
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        pick(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
      className={[
        "cursor-pointer rounded-2xl border border-dashed text-center transition-colors",
        compact ? "px-5 py-4" : "px-8 py-16",
        dragging
          ? "border-accent bg-accent/10"
          : "border-border bg-card/60 hover:border-accent/60 hover:bg-accent/5",
      ].join(" ")}
    >
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => pick(e.target.files)}
      />
      <p className={compact ? "text-sm font-medium" : "text-lg font-medium"}>
        {compact ? "Choose a different video" : "Drop a portrait video here"}
      </p>
      {!compact && (
        <p className="mt-2 text-sm text-muted-foreground">
          or click to browse — your file never leaves this device
        </p>
      )}
    </div>
  );
}
