import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarCheck, KeyRound, ShieldCheck, Wallet } from "lucide-react";
import hero from "@/assets/hero.jpg";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Temporada — Imóveis de Venda, Anual e Temporada" },
      { name: "description", content: "Carteira de imóveis para venda, aluguel anual e temporada, com valores e autorizações por proprietário." },
      { property: "og:title", content: "Temporada — Imóveis de Venda, Anual e Temporada" },
      { property: "og:description", content: "Gestão de Venda, Anual e Temporada entre proprietários e profissionais autorizados." },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }),
  component: Index,
});

const features = [
  { icon: CalendarCheck, t: "Calendário vivo", d: "Bloqueie datas e ajuste diárias em segundos. Atualiza na hora para quem você autorizou." },
  { icon: KeyRound, t: "Você decide quem vê", d: "Escolha quais corretores e imobiliárias trabalham cada imóvel." },
  { icon: ShieldCheck, t: "Só CRECI ativo", d: "Todo corretor e imobiliária passa por conferência do CRECI antes de entrar." },
  { icon: Wallet, t: "Mensalidade simples", d: "Um valor fixo por mês para cada perfil, sem surpresas." },
];

function Index() {
  return (
    <div className="min-h-screen">
      <section className="relative min-h-[88vh] overflow-hidden">
        <img src={hero} alt="Varanda de casa de praia ao pôr do sol" width={1280} height={1600} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-veil" />
        <div className="relative mx-auto flex min-h-[88vh] max-w-5xl flex-col justify-between px-5 py-6 text-primary-foreground">
          <div className="flex items-center justify-between">
            <span className="font-display text-2xl font-bold">Temporada</span>
            <Link to="/auth" className="text-sm font-semibold underline-offset-4 hover:underline">Entrar</Link>
          </div>
          <div className="max-w-xl pb-6">
            <h1 className="text-4xl font-bold leading-tight sm:text-6xl">Venda, Anual e Temporada</h1>
            <p className="mt-4 text-base opacity-90 sm:text-lg">
              Sua carteira de imóveis, sempre ligada ao proprietário.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="accent"><Link to="/auth">Criar conta</Link></Button>
              <Button asChild size="lg" variant="glass"><Link to="/auth">Já tenho conta</Link></Button>
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-5xl gap-4 px-5 py-14 sm:grid-cols-2">
        {features.map((f) => (
          <div key={f.t} className="rounded-2xl border bg-card p-6 shadow-soft">
            <f.icon className="h-6 w-6 text-accent" />
            <h3 className="mt-3 text-xl font-semibold">{f.t}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
          </div>
        ))}
      </section>
      <footer className="pb-10 text-center text-xs text-muted-foreground">Mensalidade única de R$ 199,99 por perfil.</footer>
    </div>
  );
}
