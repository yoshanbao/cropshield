import { Wheat, Citrus, Leaf, Sprout, Flower2, Flame, type LucideIcon } from 'lucide-react';
import { CROP_COLORS, CROP_LABELS, type CaseStatus, type Screening } from '@/lib/monitoring';
import type { CropType } from '@/lib/crops';
export const cropIcons: Record<CropType, LucideIcon> = { Rice: Wheat, Corn: Wheat, Calamansi: Citrus, Okra: Sprout, Eggplant: Flower2, Chili: Flame, 'Sweet Potato': Leaf, Pomelo: Citrus };
export function CropIcon({ crop, large = false }: { crop: CropType; large?: boolean }) {
  const Icon = cropIcons[crop];
  return <span className={`crop-icon ${CROP_COLORS[crop]} ${large ? 'large' : ''}`}><Icon aria-hidden="true" size={large ? 28 : 21} strokeWidth={1.6} /></span>;
}
export function CropName({ crop }: { crop: CropType }) { return <>{CROP_LABELS[crop]}{CROP_LABELS[crop] !== crop && <small className="english-name">{crop}</small>}</>; }
export function Badge({ status }: { status: CaseStatus }) { return <span className={`status-badge ${status.toLowerCase()}`}><span />{status}</span>; }
export function GuidanceCard({ screening, title = 'Referenced care steps' }: { screening: Screening; title?: string }) {
  const g = screening.guidance;
  return <section className="panel guidance"><div className="section-heading"><h2>{title}</h2><span className="eyebrow">{g?.version || 'PILOT COVERAGE'}</span></div>{g ? <>
    <p className="guidance-condition">{g.name}</p><div className="guidance-block"><h3>Care for the current crop</h3><p>{g.care}</p></div><div className="guidance-block"><h3>Prevention for future planting</h3><p>{g.prevention}</p></div>
    <a className="source-link" href={g.sourceUrl} target="_blank" rel="noreferrer">{g.source} ↗</a><p className="muted small">Source guidance is kept with the saved case.</p>
  </> : <p className="muted">{screening.state === 'COVERAGE_LIMITED' ? 'No enabled reference currently matches this crop. You can still save photos, symptoms, and actions for monitoring.' : 'No condition-specific guidance is linked to this observation. Keep recording changes and seek local agricultural advice if symptoms persist.'}</p>}</section>;
}
export async function preparePhoto(file: File): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Please choose a JPEG, PNG, or WebP image.');
  if (file.size > 5 * 1024 * 1024) throw new Error('Choose a photo smaller than 5 MB.');
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => { img.onload = () => resolve(); img.onerror = () => reject(new Error('This photo could not be opened. Please choose another image.')); img.src = url; });
    const scale = Math.min(1, 960 / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas'); canvas.width = img.width * scale; canvas.height = img.height * scale;
    const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Photo preparation is unavailable.');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.72);
  } finally { URL.revokeObjectURL(url); }
}
export function photoBlob(photo: string): Blob {
  const [header, body] = photo.split(','); const binary = atob(body);
  return new Blob([Uint8Array.from(binary, c => c.charCodeAt(0))], { type: header.match(/:(.*?);/)?.[1] || 'image/jpeg' });
}
export async function uploadPhoto(file: File): Promise<string> {
  const prepared = await preparePhoto(file);
  const form = new FormData(); form.set('image', photoBlob(prepared), 'crop-photo.jpg');
  const response = await fetch('/api/images', {method:'POST',body:form});
  const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Your photo could not be saved.');
  return data.photo;
}
