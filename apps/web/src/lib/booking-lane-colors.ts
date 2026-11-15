export const laneColors = {
  slate: { swatch: 'bg-slate-500', header: 'border-t-slate-500 bg-slate-500/5', card: 'border-slate-500/60 bg-slate-500/15 hover:bg-slate-500/25', stripe: 'border-s-slate-500' },
  blue: { swatch: 'bg-blue-500', header: 'border-t-blue-500 bg-blue-500/5', card: 'border-blue-500/60 bg-blue-500/15 hover:bg-blue-500/25', stripe: 'border-s-blue-500' },
  green: { swatch: 'bg-green-600', header: 'border-t-green-600 bg-green-600/5', card: 'border-green-600/60 bg-green-600/15 hover:bg-green-600/25', stripe: 'border-s-green-600' },
  amber: { swatch: 'bg-amber-500', header: 'border-t-amber-500 bg-amber-500/5', card: 'border-amber-500/60 bg-amber-500/20 hover:bg-amber-500/30', stripe: 'border-s-amber-500' },
  rose: { swatch: 'bg-rose-500', header: 'border-t-rose-500 bg-rose-500/5', card: 'border-rose-500/60 bg-rose-500/15 hover:bg-rose-500/25', stripe: 'border-s-rose-500' },
  violet: { swatch: 'bg-violet-500', header: 'border-t-violet-500 bg-violet-500/5', card: 'border-violet-500/60 bg-violet-500/15 hover:bg-violet-500/25', stripe: 'border-s-violet-500' },
} as const;

export type LaneColor = keyof typeof laneColors;
export function laneColor(value: string | undefined): LaneColor {
  return value && value in laneColors ? value as LaneColor : 'blue';
}
