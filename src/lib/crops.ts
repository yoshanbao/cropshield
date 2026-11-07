/**
 * Single source of truth for the crops CropShield supports.
 * Used by the client crop selector AND server-side validation so the two can
 * never drift. Crop names here must match the `cropType` values used in the
 * Disease seed and stored on Case records exactly (case-sensitive).
 */
export const CROP_TYPES = [
  "Corn",
  "Calamansi",
  "Okra",
  "Eggplant",
  "Chili",
  "Sweet Potato",
  "Pomelo",
  "Rice",
] as const;

export type CropType = (typeof CROP_TYPES)[number];

/** True if the given value is one of the supported crop names. */
export function isSupportedCrop(value: unknown): value is CropType {
  return typeof value === "string" && (CROP_TYPES as readonly string[]).includes(value);
}
