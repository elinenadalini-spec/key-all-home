import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Property = Database["public"]["Tables"]["properties"]["Row"];
export type AppRole = Database["public"]["Enums"]["app_role"];

export const MONTHLY_FEE = 199.99;

export const hasBankDetails = (accountType: string) => accountType === 'owner';

export const meQuery = queryOptions({
  queryKey: ["me"],
  queryFn: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return null;
    const [{ data: profile }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", u.user.id),
    ]);
    const r = (roles ?? []).map((x) => x.role as AppRole);
    return {
      user: u.user,
      profile: profile as Profile | null,
      roles: r,
      isAdmin: r.includes("admin"),
      isOwner: r.includes("owner"),
      isAgent: r.includes("broker") || r.includes("agency"),
    };
  },
});

export function useMe() {
  return useQuery(meQuery);
}

export function isSubscriptionActive(until: string | null | undefined) {
  if (!until) return false;
  return until >= new Date().toISOString().slice(0, 10);
}

export const brl = (v: number | string | null | undefined) =>
  Number(v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const accountLabel: Record<string, string> = {
  owner: "Proprietário",
  broker: "Corretor",
  agency: "Imobiliária",
};
