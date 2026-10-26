import { useState, type ReactNode } from "react";
import { TERM_KEYS, useTerms } from "@/lib/terms";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function TermsText() {
  const { data: terms } = useTerms();
  if (!terms) return null;
  return (
    <div className="space-y-4 text-sm">
      {TERM_KEYS.map((k) => (
        <section key={k}>
          <h3 className="mb-1 font-semibold">{terms[k].title}</h3>
          <p className="whitespace-pre-line text-muted-foreground">{terms[k].body}</p>
        </section>
      ))}
    </div>
  );
}

export function TermsAcceptDialog({
  open, onOpenChange, onAccept, header, confirmLabel,
}: { open: boolean; onOpenChange: (o: boolean) => void; onAccept: () => void | Promise<void>; header?: ReactNode; confirmLabel: string }) {
  const [ok, setOk] = useState(false);
  return (
    <Dialog open={open} onOpenChange={(o) => { setOk(false); onOpenChange(o); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Termo de intermediação</DialogTitle></DialogHeader>
        {header}
        <div className="max-h-[45vh] overflow-y-auto rounded-xl border bg-muted/40 p-4"><TermsText /></div>
        <label className="flex items-start gap-2 text-sm">
          <Checkbox checked={ok} onCheckedChange={(v) => setOk(v === true)} className="mt-0.5" />
          Li e aceito o termo de autorização de intermediação.
        </label>
        <Button disabled={!ok} onClick={async () => { await onAccept(); setOk(false); }}>{confirmLabel}</Button>
      </DialogContent>
    </Dialog>
  );
}
