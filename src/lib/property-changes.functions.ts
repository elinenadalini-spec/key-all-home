import { createServerFn } from '@tanstack/react-start';
import { getRequestHeader } from '@tanstack/react-start/server';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { changeSchema } from './segments';
import { canEditPropertyCalendar, canEditPropertyInfo } from './property-editing';

export const savePropertyChange = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => changeSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: property, error } = await context.supabase.from('properties').select('owner_id, segment, segments').eq('id', data.propertyId).maybeSingle();
    if (error || !property) throw new Error('Você não pode alterar este imóvel.');
    const [{ data: owner }, { data: admin }] = await Promise.all([
      context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'owner' }),
      context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' }),
    ]);
    if (!canEditPropertyInfo(property.owner_id, context.userId, owner === true, admin === true)) throw new Error('Você não pode alterar este imóvel.');
    if (data.days !== undefined && !canEditPropertyCalendar(property.owner_id, context.userId, owner === true, admin === true, property.segments ?? property.segment)) throw new Error('Você não pode alterar este calendário.');
    if (property.owner_id !== context.userId && data.patch.photos !== undefined) throw new Error('Acesso restrito ao proprietário.');
    // Only the deployment edge's client-IP header is used; never browser input or X-Forwarded-For.
    const observedIp = getRequestHeader('cf-connecting-ip') ?? null;
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { error: saveError } = await supabaseAdmin.rpc('save_property_change', { _property_id: data.propertyId, _actor: context.userId, _ip: observedIp, _patch: data.patch, _days: data.days ?? null });
    if (saveError) throw new Error('Não foi possível salvar a alteração.');
    return { saved: true };
  });