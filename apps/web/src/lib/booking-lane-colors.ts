export const laneColors = {
  slate: { swatch: 'bg-slate-500', header: 'border-t-slate-500 bg-slate-500/5' },
  blue: { swatch: 'bg-blue-500', header: 'border-t-blue-500 bg-blue-500/5' },
  green: { swatch: 'bg-green-600', header: 'border-t-green-600 bg-green-600/5' },
  amber: { swatch: 'bg-amber-500', header: 'border-t-amber-500 bg-amber-500/5' },
  rose: { swatch: 'bg-rose-500', header: 'border-t-rose-500 bg-rose-500/5' },
  violet: { swatch: 'bg-violet-500', header: 'border-t-violet-500 bg-violet-500/5' },
} as const;

export type LaneColor = keyof typeof laneColors;
export function laneColor(value: string | undefined): LaneColor {
  return value && value in laneColors ? value as LaneColor : 'blue';
}
