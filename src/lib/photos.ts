import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const PHOTO_BUCKET = "property-photos";

export function usePhotoUrls(paths: string[] | null | undefined) {
  const list = paths ?? [];
  return useQuery({
    queryKey: ["photo-urls", list],
    enabled: list.length > 0,
    staleTime: 30 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(list, 60 * 60);
      const map: Record<string, string> = {};
      (data ?? []).forEach((d) => {
        if (d.path && d.signedUrl) map[d.path] = d.signedUrl;
      });
      return map;
    },
  });
}
