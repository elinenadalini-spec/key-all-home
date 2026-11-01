import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { featureGroups } from '@/lib/property-features';
import type { Property } from '@/lib/me';

export function FeatureChecklist({ value, onChange, disabled }: { value: string[]; onChange: (value: string[]) => void; disabled?: boolean }) {
  return <div className="space-y-5">{featureGroups.map((group) => <fieldset key={group.title} disabled={disabled} className="space-y-3">
    <legend className="mb-3 font-semibold">{group.title}</legend>
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{group.items.map((item) => <li key={item}>
      <Label className="flex items-center gap-3 leading-normal"><Checkbox disabled={disabled} checked={value.includes(item)} onCheckedChange={(checked) => onChange(checked === true ? [...value, item] : value.filter((v) => v !== item))} />{item}</Label>
    </li>)}</ul>
  </fieldset>)}</div>;
}

export function PropertyFeatureSummary({ property: p }: { property: Property }) {
  return <div className="space-y-6">
    <section><h2 className="mb-3 text-lg font-semibold">Quantidades</h2><dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {Object.entries({ 'Suítes': p.suites ?? 0, 'Dormitórios': p.bedrooms, 'Banheiros': p.bathrooms, 'Vagas de garagem': p.garage_spaces ?? 0, 'Hóspedes': p.guests }).map(([label, value]) => <div key={label}><dt className="text-sm text-muted-foreground">{label}</dt><dd className="font-semibold">{value}</dd></div>)}
    </dl></section>
    <section><h2 className="mb-3 text-lg font-semibold">Características</h2>{p.amenities?.length ? <ul className="grid list-inside list-disc gap-2 text-sm sm:grid-cols-2">{p.amenities.map((item) => <li key={item}>{item}</li>)}</ul> : <p className="text-sm text-muted-foreground">Nenhuma característica informada.</p>}</section>
    <section><h2 className="mb-3 text-lg font-semibold">Descrição e regras</h2><p className="whitespace-pre-line text-sm">{p.description || 'Sem descrição.'}</p></section>
  </div>;
}