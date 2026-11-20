import { redirect } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { registrationComplete } from './registration';

// The managed parent owns authentication; this guard only checks registration.
export async function requireCompleteRegistration() {
  const { data, error } = await supabase.from('profiles').select('*').single();
  // Admins can read multiple profiles, so always scope to the current identity.
  if (error || !data) {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw redirect({ to: '/auth' });
    const result = await supabase.from('profiles').select('*').eq('id', user.user.id).maybeSingle();
    if (result.error) throw new Error('Não foi possível conferir seu cadastro.');
    if (!registrationComplete(result.data)) throw redirect({ to: '/completar-cadastro' });
    return;
  }
  if (!registrationComplete(data)) throw redirect({ to: '/completar-cadastro' });
}