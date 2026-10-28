import { z } from 'zod';

export const segmentSchema = z.enum(['venda', 'anual', 'temporada']);
export type Segment = z.infer<typeof segmentSchema>;
export const segments: Segment[] = ['venda', 'anual', 'temporada'];
export const segmentLabels: Record<Segment, string> = { venda: 'Venda', anual: 'Anual', temporada: 'Temporada' };
export const priceLabels: Record<Segment, string> = { venda: 'Valor de venda (R$)', anual: 'Aluguel mensal (R$)', temporada: 'Diária padrão (R$)' };
export function asSegment(value: string): Segment { return segmentSchema.parse(value); }
export function priceSuffix(segment: string) { return segment === 'anual' ? '/mês' : segment === 'temporada' ? '/noite' : ''; }
export type CalendarDay = { day: string; price: number | null; blocked: boolean; note: string | null };
export function calendarDayChange(day: string, current: CalendarDay | undefined, patch: { blocked?: boolean; price?: number | null }): CalendarDay {
  return { day, blocked: patch.blocked ?? current?.blocked ?? false, price: patch.price !== undefined ? patch.price : current?.price ?? null, note: current?.note ?? null };
}
export const changeSchema = z.object({
  propertyId: z.string().uuid(),
  patch: z.object({ title: z.string().min(1).optional(), description: z.string().optional(), address: z.string().optional(), city: z.string().optional(), bedrooms: z.number().int().nonnegative().optional(), bathrooms: z.number().int().nonnegative().optional(), guests: z.number().int().positive().optional(), base_price: z.number().finite().nonnegative().optional(), segment: segmentSchema.optional(), photos: z.array(z.string()).optional() }).strict().default({}),
  days: z.array(z.object({ day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), price: z.number().finite().nonnegative().nullable(), blocked: z.boolean(), note: z.string().nullable().optional() })).max(366).optional(),
});