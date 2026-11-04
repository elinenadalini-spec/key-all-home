import { z } from 'zod';
import { featureOptions } from './property-features';

export const segmentSchema = z.enum(['venda', 'anual', 'temporada']);
export type Segment = z.infer<typeof segmentSchema>;
export const segments: Segment[] = ['venda', 'anual', 'temporada'];
export const segmentLabels: Record<Segment, string> = { venda: 'Venda', anual: 'Anual', temporada: 'Temporada' };
export const priceLabels: Record<Segment, string> = { venda: 'Valor de venda (R$)', anual: 'Aluguel mensal (R$)', temporada: 'Diária padrão (R$)' };
export function asSegment(value: string): Segment { return segmentSchema.parse(value); }
export const selectedSegmentsSchema = z.array(segmentSchema).min(1).max(3).refine((values) => new Set(values).size === values.length);
export const segmentPriceFields = { venda: 'sale_price', anual: 'annual_price', temporada: 'seasonal_price' } as const;
export function propertySegments(property: { segments?: string[] | null; segment?: string }): Segment[] {
  return selectedSegmentsSchema.parse(property.segments ?? [property.segment]);
}
export function propertyPrice(property: { sale_price?: number | null; annual_price?: number | null; seasonal_price?: number | null; base_price?: number; segment?: string }, segment: Segment): number {
  return property[segmentPriceFields[segment]] ?? (property.segment === segment ? property.base_price ?? 0 : 0);
}
export function segmentPricePatch(values: Segment[], prices: Partial<Record<Segment, number>>) {
  const selected = selectedSegmentsSchema.parse(values);
  return Object.fromEntries(selected.map((s) => [segmentPriceFields[s], z.number().finite().nonnegative().parse(prices[s])])) as Partial<Record<'sale_price' | 'annual_price' | 'seasonal_price', number>>;
}
export function priceSuffix(segment: string) { return segment === 'anual' ? '/mês' : segment === 'temporada' ? '/noite' : ''; }
export type CalendarDay = { day: string; price: number | null; blocked: boolean; note: string | null };
export function calendarDayChange(day: string, current: CalendarDay | undefined, patch: { blocked?: boolean; price?: number | null }): CalendarDay {
  return { day, blocked: patch.blocked ?? current?.blocked ?? false, price: patch.price !== undefined ? patch.price : current?.price ?? null, note: current?.note ?? null };
}
export const changeSchema = z.object({
  propertyId: z.string().uuid(),
  patch: z.object({ segments: selectedSegmentsSchema.optional(), sale_price: z.number().finite().nonnegative().optional(), annual_price: z.number().finite().nonnegative().optional(), seasonal_price: z.number().finite().nonnegative().optional(), title: z.string().min(1).optional(), description: z.string().optional(), address: z.string().optional(), city: z.string().optional(), bedrooms: z.number().int().nonnegative().optional(), bathrooms: z.number().int().nonnegative().optional(), guests: z.number().int().positive().optional(), suites: z.number().int().nonnegative().optional(), garage_spaces: z.number().int().nonnegative().optional(), amenities: z.array(z.string().refine((value) => featureOptions.includes(value))).max(featureOptions.length).transform((values) => [...new Set(values)]).optional(), base_price: z.number().finite().nonnegative().optional(), segment: segmentSchema.optional(), photos: z.array(z.string()).optional() }).strict().default({}),
  days: z.array(z.object({ day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), price: z.number().finite().nonnegative().nullable(), blocked: z.boolean(), note: z.string().nullable().optional() })).max(366).optional(),
});