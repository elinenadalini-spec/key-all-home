import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { asSegment, segments, segmentLabels, type Segment } from '@/lib/segments';

export function SegmentSelect({ value, onChange, name, id }: { value: Segment | undefined; onChange: (value: Segment) => void; name?: string; id?: string }) {
  return <Select value={value ?? ''} onValueChange={(v) => onChange(asSegment(v))} {...(name ? { name } : {})}>
    <SelectTrigger id={id} aria-label="Segmento"><SelectValue placeholder="Escolha o segmento" /></SelectTrigger>
    <SelectContent>{segments.map((s) => <SelectItem key={s} value={s}>{segmentLabels[s]}</SelectItem>)}</SelectContent>
  </Select>;
}