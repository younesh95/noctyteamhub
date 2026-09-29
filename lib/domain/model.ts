export type Row = {
  id: string;
  kind: string;
  title: string;
  body: string;
  map?: string;
  owner_id?: string;
  scope?: string;
  recipient_id?: string;
  data: any;
  created_at?: string;
};
/** Pool chosen by NOCTYS, independent of official matchmaking rotations. */
export const maps = [
  "Dust2",
  "Mirage",
  "Anubis",
  "Cache",
  "Ancient",
  "Nuke",
  "Inferno",
];
export const normalizeMap = (map?: string) =>
  map === "Dust II" || map === "Dust 2" ? "Dust2" : map;
export const clock = (v: number) =>
  Math.floor(v / 60) + ":" + String(v % 60).padStart(2, "0");
export function download(name: string, data: unknown) {
  downloadBlob(
    name + ".json",
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
  );
}
export function downloadBlob(name: string, blob: Blob) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name.replace(/[<>:"/\\|?*]/g, "_");
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
