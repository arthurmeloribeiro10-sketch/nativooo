import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type CommunityPostResult = {
  id: string;
  body: string;
  created_at: string;
  user_id: string;
  author: string;
  reactions: number;
  reacted: boolean;
  image_url: string | null;
};

export type CommunityRankingResult = {
  user_id: string;
  display_name: string;
  protocol_days: number;
  missions_done: number;
};

export const getCommunityFeed = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CommunityPostResult[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: posts, error } = await supabaseAdmin
      .from("community_posts")
      .select("id, body, created_at, user_id, image_path")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error("Não foi possível carregar a comunidade.");

    const rows = posts ?? [];
    if (rows.length === 0) return [];

    const userIds = [...new Set(rows.map((post) => post.user_id))];
    const postIds = rows.map((post) => post.id);
    const imagePaths = rows.flatMap((post) => (post.image_path ? [post.image_path] : []));

    const [{ data: profiles }, { data: reactions }, signedImages] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, display_name").in("id", userIds),
      supabaseAdmin.from("post_reactions").select("post_id, user_id").in("post_id", postIds),
      imagePaths.length
        ? supabaseAdmin.storage.from("community-photos").createSignedUrls(imagePaths, 3600)
        : Promise.resolve({ data: [] as { path: string | null; signedUrl: string }[] }),
    ]);

    const names = new Map((profiles ?? []).map((profile) => [profile.id, profile.display_name]));
    const urls = new Map(
      (signedImages.data ?? []).map((image) => [image.path as string, image.signedUrl]),
    );
    const allReactions = reactions ?? [];

    return rows.map((post) => ({
      id: post.id,
      body: post.body,
      created_at: post.created_at,
      user_id: post.user_id,
      author: names.get(post.user_id) ?? "Nativo",
      reactions: allReactions.filter((reaction) => reaction.post_id === post.id).length,
      reacted: allReactions.some(
        (reaction) => reaction.post_id === post.id && reaction.user_id === context.userId,
      ),
      image_url: post.image_path ? (urls.get(post.image_path) ?? null) : null,
    }));
  });

export const getCommunityRanking = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async (): Promise<CommunityRankingResult[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: profiles, error: profilesError }, protocolResult, missionsResult] =
      await Promise.all([
        supabaseAdmin.from("profiles").select("id, display_name"),
        supabaseAdmin.from("protocol_progress").select("user_id"),
        supabaseAdmin.from("missions").select("user_id").eq("done", true),
      ]);

    if (profilesError || protocolResult.error || missionsResult.error) {
      throw new Error("Não foi possível carregar o ranking.");
    }

    const protocolCounts = new Map<string, number>();
    for (const row of protocolResult.data ?? []) {
      protocolCounts.set(row.user_id, (protocolCounts.get(row.user_id) ?? 0) + 1);
    }

    const missionCounts = new Map<string, number>();
    for (const row of missionsResult.data ?? []) {
      missionCounts.set(row.user_id, (missionCounts.get(row.user_id) ?? 0) + 1);
    }

    return (profiles ?? [])
      .map((profile) => ({
        user_id: profile.id,
        display_name: profile.display_name,
        protocol_days: protocolCounts.get(profile.id) ?? 0,
        missions_done: missionCounts.get(profile.id) ?? 0,
      }))
      .sort(
        (a, b) =>
          b.protocol_days - a.protocol_days || b.missions_done - a.missions_done,
      )
      .slice(0, 20);
  });