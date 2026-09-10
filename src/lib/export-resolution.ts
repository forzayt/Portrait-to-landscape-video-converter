export const EXPORT_RESOLUTIONS = [
  { label: "480p", width: 854, height: 480 },
  { label: "720p HD", width: 1280, height: 720 },
  { label: "1080p Full HD", width: 1920, height: 1080 },
  { label: "1440p QHD", width: 2560, height: 1440 },
  { label: "2160p 4K UHD", width: 3840, height: 2160 },
] as const;

export type ExportResolution = (typeof EXPORT_RESOLUTIONS)[number];
export const DEFAULT_RESOLUTION = EXPORT_RESOLUTIONS[2];

export function landscapeFilter({ width, height }: ExportResolution): string {
  return [
    "[0:v]scale=256:144,setsar=1,",
    `scale=${width}:${height}:force_original_aspect_ratio=increase,`,
    `crop=${width}:${height},gblur=sigma=${24 * height / 1080}[bg];`,
    `[0:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,setsar=1[fg];`,
    "[bg][fg]overlay=(W-w)/2:(H-h)/2",
  ].join("");
}
