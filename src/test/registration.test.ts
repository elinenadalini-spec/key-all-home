import { describe, expect, it } from 'vitest';
import { registrationSchema, registrationComplete } from '@/lib/registration';

const owner = { account_type: 'owner' as const, full_name: 'Maria Costa', company_name: '', document: '12345678901', email: 'maria@example.test', creci: '', creci_uf: '' };
describe('cadastro obrigatório', () => {
  it('proprietário exige CPF, nome completo e e-mail', () => {
    expect(registrationSchema.safeParse(owner).success).toBe(true);
    for (const field of ['document', 'full_name', 'email']) expect(registrationSchema.safeParse({ ...owner, [field]: '' }).success).toBe(false);
  });
  it('corretor exige CRECI-SC final F, CPF, nome e e-mail', () => {
    const broker = { ...owner, account_type: 'broker', creci: '12345-F', creci_uf: 'SC' };
    expect(registrationSchema.safeParse(broker).success).toBe(true);
    for (const field of ['document', 'full_name', 'email', 'creci']) expect(registrationSchema.safeParse({ ...broker, [field]: '' }).success).toBe(false);
    expect(registrationSchema.safeParse({ ...broker, creci: '12345-J' }).success).toBe(false);
    expect(registrationSchema.safeParse({ ...broker, creci_uf: 'SP' }).success).toBe(false);
  });
  it('imobiliária exige CRECI-SC final J, CNPJ, razão social e e-mail', () => {
    const agency = { ...owner, account_type: 'agency', full_name: '', company_name: 'Praia Imóveis Ltda', document: '12345678000190', creci: '12345-J', creci_uf: 'SC' };
    expect(registrationSchema.safeParse(agency).success).toBe(true);
    for (const field of ['document', 'company_name', 'email', 'creci']) expect(registrationSchema.safeParse({ ...agency, [field]: '' }).success).toBe(false);
    expect(registrationSchema.safeParse({ ...agency, creci: '12345-F' }).success).toBe(false);
  });
  it('dados do Google não substituem CPF ou seleção de perfil', () => {
    expect(registrationComplete(null)).toBe(false);
    expect(registrationComplete({ ...owner, document: null })).toBe(false);
    expect(registrationComplete(owner)).toBe(true);
  });
});