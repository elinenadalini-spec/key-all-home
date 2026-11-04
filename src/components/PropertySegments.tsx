import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { segments, segmentLabels, priceLabels, segmentPriceFields, type Segment } from '@/lib/segments';

export function SegmentCheckboxes({ value, onChange, disabled }: { value: Segment[]; onChange: (value: Segment[]) => void; disabled?: boolean }) {
  return <fieldset className="space-y-3" disabled={disabled}>
    <legend className="mb-3 text-sm font-medium">Segmentos</legend>
    <div className="grid grid-cols-3 gap-2">{segments.map((s) => <Label key={s} className="flex items-center gap-2 leading-normal"><Checkbox disabled={disabled} checked={value.includes(s)} onCheckedChange={(checked) => onChange(segments.filter((item) => item === s ? checked === true : value.includes(item)))} />{segmentLabels[s]}</Label>)}</div>
  </fieldset>;
}

export function SegmentPriceInputs({ selected, prices, onChange, disabled }: { selected: Segment[]; prices: Partial<Record<Segment, number | ''>>; onChange: (segment: Segment, value: number | '') => void; disabled?: boolean }) {
  return <div className="grid gap-4 sm:grid-cols-2">{selected.map((s) => <div key={s} className="space-y-1.5"><Label htmlFor={segmentPriceFields[s]}>{priceLabels[s]}</Label><Input id={segmentPriceFields[s]} name={segmentPriceFields[s]} type="number" min="0" step="0.01" required disabled={disabled} value={prices[s] ?? ''} onChange={(e) => onChange(s, e.target.value === '' ? '' : Number(e.target.value))} /></div>)}</div>;
}