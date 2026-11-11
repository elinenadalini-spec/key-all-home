import { createServerFn } from '@tanstack/react-start';
import { getRequestHeader } from '@tanstack/react-start/server';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

const schema = z.object({ agentId: z.string().uuid(), propertyIds: z.array(z.string().uuid()).min(1).max(500), enabled: z.boolean() });

export const setAgentAuthorizations = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data, context }) => {
    const [{ data: admin }, { data: owner }, { data: approved }] = await Promise.all([
      context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' }),
      context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'owner' }),
      context.supabase.rpc('is_approved_agent', { _user_id: data.agentId }),
    ]);
    if (data.enabled && approved !== true) throw new Error('Profissional sem CRECI aprovado.');
    const { data: props, error } = await context.supabase.from('properties').select('id, owner_id').in('id', data.propertyIds);
    if (error) throw new Error('Não foi possível verificar os imóveis.');
    const allowed = (props ?? []).filter((p) => admin === true || (owner === true && p.owner_id === context.userId)).map((p) => p.id);
    if (allowed.length !== new Set(data.propertyIds).size) throw new Error('Você não pode autorizar algum destes imóveis.');
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    if (data.enabled) {
      const ip = getRequestHeader('cf-connecting-ip') ?? null;
      const now = new Date().toISOString();
      const { error: e } = await supabaseAdmin.from('authorizations').upsert(
        allowed.map((property_id) => ({ property_id, agent_id: data.agentId, owner_accepted_terms_at: now, owner_accepted_ip: ip, granted_by: context.userId })),
        { onConflict: 'property_id,agent_id', ignoreDuplicates: true });
      if (e) throw new Error('Não foi possível autorizar.');
      await supabaseAdmin.from('access_requests').update({ status: 'approved' }).eq('agent_id', data.agentId).in('property_id', allowed);
    } else {
      const { error: e } = await supabaseAdmin.from('authorizations').delete().eq('agent_id', data.agentId).in('property_id', allowed);
      if (e) throw new Error('Não foi possível revogar.');
      await supabaseAdmin.from('access_requests').delete().eq('agent_id', data.agentId).in('property_id', allowed);
    }
    return { count: allowed.length };
  });
