import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const TERM_KEYS = ["geral", "proprietario", "corretor"] as const;
export type TermKey = (typeof TERM_KEYS)[number];

export const DEFAULT_TERMS: Record<TermKey, { title: string; body: string }> = {
  geral: {
    title: "Termo de Autorização de Intermediação de Locação por Temporada",
    body:
      "Pelo presente termo, o PROPRIETÁRIO autoriza o CORRETOR/IMOBILIÁRIA, com CRECI ativo, a intermediar a locação por temporada do imóvel indicado, nos termos da Lei nº 8.245/91 (arts. 48 a 50) e da Lei nº 6.530/78.\n\nA autorização não é exclusiva e pode ser revogada a qualquer momento pelo PROPRIETÁRIO na plataforma. Os valores e a disponibilidade válidos são sempre os publicados no calendário do imóvel.",
  },
  proprietario: {
    title: "Direitos e deveres do Proprietário",
    body:
      "Direitos:\n- Definir valores das diárias, bloqueios e regras do imóvel.\n- Revogar a autorização a qualquer momento.\n- Receber os valores das locações conforme combinado.\n\nDeveres:\n- Manter o calendário e os valores sempre atualizados.\n- Entregar o imóvel em condições de uso, conforme fotos e descrição.\n- Pagar a comissão acordada sobre as locações intermediadas.",
  },
  corretor: {
    title: "Direitos e deveres do Corretor / Imobiliária",
    body:
      "Direitos:\n- Divulgar e ofertar o imóvel a hóspedes interessados.\n- Receber a comissão acordada sobre as locações concretizadas.\n\nDeveres:\n- Manter o CRECI ativo e regular.\n- Respeitar os valores e a disponibilidade publicados pelo proprietário.\n- Confirmar a disponibilidade antes de fechar qualquer reserva.\n- Zelar pela confidencialidade dos dados do proprietário e do imóvel.",
  },
};

export function useTerms() {
  return useQuery({
    queryKey: ["terms"],
    queryFn: async () => {
      const { data } = await supabase.from("app_terms").select("*");
      const out = { ...DEFAULT_TERMS };
      (data ?? []).forEach((t) => {
        if ((TERM_KEYS as readonly string[]).includes(t.id)) out[t.id as TermKey] = { title: t.title, body: t.body };
      });
      return out;
    },
  });
}
