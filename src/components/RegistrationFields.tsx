import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { accountLabel } from '@/lib/me';
import { accountTypes, type AccountType } from '@/lib/registration';

export function RegistrationFields({ type, onType, values = {}, email, lockedType = false }: { type: AccountType; onType: (type: AccountType) => void; values?: Record<string, string | null>; email?: string; lockedType?: boolean }) {
  return <>
    <div className="grid grid-cols-3 gap-2" role="group" aria-label="Tipo de cadastro">
      {accountTypes.map((t) => <Button key={t} type="button" variant={type === t ? 'default' : 'outline'} className="px-1 text-xs" aria-pressed={type === t} disabled={lockedType && type !== t} onClick={() => onType(t)}>{accountLabel[t]}</Button>)}
    </div>
    <div key={type} className="space-y-4">
      {type === 'agency' ? <RegistrationField name="company_name" label="Razão social" value={values['company_name']} /> : <RegistrationField name="full_name" label="Nome completo" value={values['full_name']} />}
      <RegistrationField name="document" label={type === 'agency' ? 'CNPJ' : 'CPF'} value={values['document']} maxLength={type === 'agency' ? 18 : 14} />
      {type !== 'owner' && <RegistrationField name="creci" label={`CRECI-SC com final ${type === 'broker' ? 'F' : 'J'}`} value={values['creci']} maxLength={20} />}
      <RegistrationField name="email" label="E-mail" value={email ?? values['email']} type="email" readOnly={email !== undefined} maxLength={255} />
    </div>
  </>;
}

export function RegistrationField({ name, label, value, type = 'text', maxLength = 150, readOnly = false }: { name: string; label: string; value?: string | null | undefined; type?: string; maxLength?: number; readOnly?: boolean }) {
  return <div className="space-y-1.5"><Label htmlFor={name}>{label}</Label><Input id={name} name={name} type={type} required defaultValue={value ?? ''} maxLength={maxLength} readOnly={readOnly} minLength={type === 'password' ? 6 : undefined} /></div>;
}

export function registrationFormData(form: HTMLFormElement, type: AccountType) {
  const f = new FormData(form);
  return { account_type: type, full_name: String(f.get('full_name') ?? ''), company_name: String(f.get('company_name') ?? ''), document: String(f.get('document') ?? ''), email: String(f.get('email') ?? '').trim(), creci: String(f.get('creci') ?? ''), creci_uf: type === 'owner' ? '' : 'SC' };
}