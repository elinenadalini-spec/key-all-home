import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { segmentSchema } from '@/lib/segments';

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Temporada" },
      { name: "description", content: "Acesse ou crie sua conta de proprietário, corretor ou imobiliária." },
      { property: "og:title", content: "Entrar — Temporada" },
      { property: "og:description", content: "Acesse sua conta Temporada." },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }),
  component: AuthPage,
});

const UFS = "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" ");
type T = "owner" | "broker" | "agency";

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<T>("owner");
  const [sent, setSent] = useState(false);

  async function signIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(f.get("email")),
      password: String(f.get("password")),
    });
    setLoading(false);
    if (error) { toast.error("E-mail ou senha incorretos."); return; }
    const chosen = segmentSchema.safeParse(sessionStorage.getItem('selected-segment'));
    sessionStorage.removeItem('selected-segment');
    navigate({ to: "/painel", search: chosen.success ? { segmento: chosen.data } : {} });
  }

  async function signUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const creci = String(f.get("creci") ?? "").trim();
    if (type !== "owner" && !creci) { toast.error("Informe o número do CRECI."); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: String(f.get("email")),
      password: String(f.get("password")),
      options: {
        emailRedirectTo: window.location.origin + "/painel",
        data: {
          account_type: type,
          full_name: String(f.get("full_name")),
          phone: String(f.get("phone") ?? ""),
          company_name: String(f.get("company_name") ?? ""),
          creci: type === "owner" ? null : creci,
          creci_uf: type === "owner" ? null : String(f.get("creci_uf") ?? ""),
        },
      },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setSent(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ocean px-4 py-10">
      <div className="w-full max-w-md rounded-3xl bg-card p-6 shadow-soft sm:p-8">
        <Link to="/" className="font-display text-2xl font-bold text-primary">Temporada</Link>
        {sent ? (
          <div className="mt-6 space-y-2">
            <h2 className="text-2xl font-semibold">Confira seu e-mail</h2>
            <p className="text-sm text-muted-foreground">
              Enviamos um link de confirmação. {type !== "owner" && "Depois de confirmar, seu CRECI será conferido pelo administrador antes de liberar o acesso aos imóveis."}
            </p>
          </div>
        ) : (
          <Tabs defaultValue="in" className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="in">Entrar</TabsTrigger>
              <TabsTrigger value="up">Criar conta</TabsTrigger>
            </TabsList>
            <TabsContent value="in">
              <form onSubmit={signIn} className="mt-4 space-y-4">
                <Field name="email" label="E-mail" type="email" />
                <Field name="password" label="Senha" type="password" />
                <Button className="w-full" disabled={loading}>Entrar</Button>
              </form>
            </TabsContent>
            <TabsContent value="up">
              <form onSubmit={signUp} className="mt-4 space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  {(["owner", "broker", "agency"] as T[]).map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setType(t)}
                      className={`rounded-xl border px-2 py-3 text-xs font-semibold ${type === t ? "border-primary bg-secondary text-primary" : "text-muted-foreground"}`}
                    >
                      {t === "owner" ? "Proprietário" : t === "broker" ? "Corretor" : "Imobiliária"}
                    </button>
                  ))}
                </div>
                <Field name="full_name" label={type === "agency" ? "Responsável" : "Nome completo"} />
                {type === "agency" && <Field name="company_name" label="Nome da imobiliária" />}
                <Field name="phone" label="Telefone / WhatsApp" required={false} />
                {type !== "owner" && (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2"><Field name="creci" label="CRECI" /></div>
                    <div className="space-y-1.5">
                      <Label htmlFor="creci_uf">UF</Label>
                      <select id="creci_uf" name="creci_uf" className="h-9 w-full rounded-md border bg-background px-2 text-sm" defaultValue="SP">
                        {UFS.map((u) => <option key={u}>{u}</option>)}
                      </select>
                    </div>
                  </div>
                )}
                <Field name="email" label="E-mail" type="email" />
                <Field name="password" label="Senha (mín. 6)" type="password" />
                <Button className="w-full" disabled={loading}>Criar conta</Button>
              </form>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

function Field({ name, label, type = "text", required = true }: { name: string; label: string; type?: string; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} required={required} minLength={type === "password" ? 6 : undefined} />
    </div>
  );
}
