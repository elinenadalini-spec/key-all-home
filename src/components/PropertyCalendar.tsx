import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { addMonths, eachDayOfInterval, endOfMonth, format, getDay, startOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Lock, Unlock, Radio } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useServerFn } from '@tanstack/react-start';
import { savePropertyChange } from '@/lib/property-changes.functions';
import { calendarDayChange, type CalendarDay } from '@/lib/segments';

type Day = CalendarDay;

export function PropertyCalendar({ propertyId, basePrice, canEdit }: { propertyId: string; basePrice: number; canEdit: boolean }) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [price, setPrice] = useState("");
  const qc = useQueryClient();
  const saveChange = useServerFn(savePropertyChange);
  const [saving, setSaving] = useState(false);
  const from = format(startOfMonth(month), "yyyy-MM-dd");
  const to = format(endOfMonth(month), "yyyy-MM-dd");
  const key = ["days", propertyId, from];

  const days = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("property_days")
        .select("day, price, blocked, note")
        .eq("property_id", propertyId)
        .gte("day", from)
        .lte("day", to);
      if (error) throw error;
      const map: Record<string, Day> = {};
      (data ?? []).forEach((d) => (map[d.day] = { day: d.day, price: d.price === null ? null : Number(d.price), blocked: d.blocked, note: d.note }));
      return map;
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel(`days-${propertyId}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "property_days", filter: `property_id=eq.${propertyId}` }, () => {
        qc.invalidateQueries({ queryKey: ["days", propertyId] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [propertyId, qc]);

  const grid = useMemo(() => {
    const all = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
    const first = all[0];
    const pad = first ? (getDay(first) + 6) % 7 : 0;
    return { pad, all };
  }, [month]);

  const today = format(new Date(), "yyyy-MM-dd");

  function toggle(d: string) {
    if (!canEdit || saving || days.isPending || days.isError || d < today) return;
    setSel((s) => {
      const n = new Set(s);
      n.has(d) ? n.delete(d) : n.add(d);
      return n;
    });
  }

  async function apply(patch: { blocked?: boolean; price?: number | null }) {
    if (saving || !canEdit || !sel.size || days.isPending || days.isError) return;
    setSaving(true);
    const rows = [...sel].map((d) => calendarDayChange(d, days.data?.[d], patch));
    try { await saveChange({ data: { propertyId, patch: {}, days: rows } }); }
    catch { toast.error('Não foi possível atualizar os dias.'); return; }
    finally { setSaving(false); }
    toast.success(`${rows.length} dia(s) atualizado(s)`);
    setSel(new Set());
    setPrice("");
    qc.invalidateQueries({ queryKey: ["days", propertyId] });
    qc.invalidateQueries({ queryKey: ['property-history', propertyId] });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" size="icon" disabled={saving} onClick={() => { setMonth(subMonths(month, 1)); setSel(new Set()); setPrice(""); }} aria-label="Mês anterior"><ChevronLeft /></Button>
        <div className="text-center">
          <h3 className="text-xl font-semibold capitalize">{format(month, "MMMM yyyy", { locale: ptBR })}</h3>
          <p className="flex items-center justify-center gap-1 text-xs text-success"><Radio className="h-3 w-3" /> ao vivo</p>
        </div>
        <Button type="button" variant="ghost" size="icon" disabled={saving} onClick={() => { setMonth(addMonths(month, 1)); setSel(new Set()); setPrice(""); }} aria-label="Próximo mês"><ChevronRight /></Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase text-muted-foreground">
        {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d) => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: grid.pad }).map((_, i) => <div key={`p${i}`} />)}
        {grid.all.map((date) => {
          const d = format(date, "yyyy-MM-dd");
          const info = days.data?.[d];
          const blocked = info?.blocked;
          const p = info?.price ?? basePrice;
          const past = d < today;
          const selected = sel.has(d);
          return (
            <Button
              type="button"
              variant="outline"
              key={d}
              onClick={() => toggle(d)}
              aria-label={`${format(date, 'dd/MM/yyyy')} · ${blocked ? 'Bloqueado' : 'Disponível'} · R$ ${p.toFixed(2).replace('.', ',')}`}
              aria-pressed={selected}
              disabled={!canEdit || past || saving || days.isPending || days.isError}
              className={cn(
                "flex h-auto min-w-0 aspect-square flex-col gap-0 items-center justify-center rounded-lg border p-0 text-sm transition",
                blocked ? "border-blocked bg-blocked text-blocked-foreground" : "bg-card",
                past && "opacity-40",
                selected && "ring-2 ring-accent ring-offset-1",
                canEdit && !past && "hover:border-primary",
              )}
            >
              <span className="font-semibold leading-none">{date.getDate()}</span>
              <span className={cn("mt-0.5 text-[9px] leading-none sm:text-[11px]", blocked ? "opacity-80" : info?.price != null ? "font-semibold text-accent" : "text-muted-foreground")}>
                {blocked ? "bloq." : Math.round(p)}
              </span>
            </Button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-card border" /> Disponível</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-blocked" /> Bloqueado</span>
        <span className="flex items-center gap-1"><span className="font-semibold text-accent">R$</span> Valor especial</span>
      </div>

      {canEdit && sel.size > 0 && (
        <div className="space-y-3 rounded-lg border bg-card p-4 shadow-soft">
          <div className="flex items-center justify-between text-sm">
            <b>{sel.size} dia(s) selecionado(s)</b>
            <Button type="button" variant="link" disabled={saving} onClick={() => { setSel(new Set()); setPrice(""); }}>Limpar</Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button disabled={saving} variant="default" onClick={() => apply({ blocked: true })}><Lock /> Bloquear</Button>
            <Button disabled={saving} variant="outline" onClick={() => apply({ blocked: false })}><Unlock /> Desbloquear</Button>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`daily-price-${propertyId}`}>Diária das datas selecionadas (R$)</Label>
            <div className="flex flex-wrap gap-2">
            <Input id={`daily-price-${propertyId}`} className="min-w-0 flex-1 basis-32" type="number" step="0.01" min="0" disabled={saving} placeholder={`Padrão ${basePrice}`} value={price} onChange={(e) => setPrice(e.target.value)} />
            <Button variant="accent" disabled={saving || !price || !Number.isFinite(Number(price)) || Number(price) < 0} onClick={() => apply({ price: Number(price) })}>Salvar valor</Button>
            </div>
          </div>
          <Button type="button" variant="link" disabled={saving} onClick={() => apply({ price: null })}>Voltar ao valor padrão</Button>
        </div>
      )}
    </div>
  );
}
