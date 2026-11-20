import { z } from 'zod';

export const accountTypes = ['owner', 'broker', 'agency'] as const;
export type AccountType = typeof accountTypes[number];
const text = z.string().trim().max(150);
export const registrationSchema = z.object({
  account_type: z.enum(accountTypes),
  full_name: text,
  company_name: text,
  document: z.string().trim().max(20).transform((v) => v.replace(/[.\-/\s]/g, '')),
  email: z.email('Informe um e-mail válido.').max(255),
  creci: z.string().trim().max(20).transform((v) => v.toUpperCase()),
  creci_uf: z.string().trim().max(2),
}).superRefine((v, ctx) => {
  const issue = (path: string, message: string) => ctx.addIssue({ code: 'custom', path: [path], message });
  if (v.account_type === 'agency') {
    if (!v.company_name) issue('company_name', 'Informe a razão social.');
    if (!/^\d{14}$/.test(v.document)) issue('document', 'Informe o CNPJ com 14 dígitos.');
  } else {
    if (!/^\S+\s+\S+/.test(v.full_name)) issue('full_name', 'Informe seu nome completo.');
    if (!/^\d{11}$/.test(v.document)) issue('document', 'Informe o CPF com 11 dígitos.');
  }
  if (v.account_type !== 'owner') {
    const suffix = v.account_type === 'broker' ? 'F' : 'J';
    if (v.creci_uf !== 'SC' || !new RegExp(`^\\d{1,10}\\s*-?\\s*${suffix}$`).test(v.creci)) {
      issue('creci', `Informe o CRECI-SC com final ${suffix}.`);
    }
  }
});

export type Registration = z.infer<typeof registrationSchema>;
export function registrationComplete(profile: { account_type: AccountType; full_name: string; company_name: string | null; document: string | null; email: string | null; creci: string | null; creci_uf: string | null } | null) {
  if (!profile) return false;
  return registrationSchema.safeParse({ ...profile, company_name: profile.company_name ?? '', document: profile.document ?? '', email: profile.email ?? '', creci: profile.creci ?? '', creci_uf: profile.creci_uf ?? '' }).success;
}