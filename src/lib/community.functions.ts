import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

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
  replies: CommunityReplyResult[];
};

export type CommunityReplyResult = {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  created_at: string;
  author: string;
};

export type CommunityRankingResult = {
  user_id: string;
  display_name: string;
  protocol_days: number;
  missions_done: number;
};

export type CommunityNotificationResult = {
  id: string;
  kind: "post" | "reply";
  post_id: string;
  actor_id: string;
  actor: string;
  preview: string;
  read_at: string | null;
  created_at: string;
};

const MAX_COMMUNITY_PHOTO_BYTES = 10 * 1024 * 1024;

const uploadCommunityPhotoInput = z.object({
  base64: z.string().min(4).max(14_000_000),
});

function detectCommunityImage(bytes: Uint8Array): { extension: string; contentType: string } | null {
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) {
    return { extension: "png", contentType: "image/png" };
  }

  if (
    bytes.length >= 4 &&
    bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff &&
    bytes[bytes.length - 2] === 0xff && bytes[bytes.length - 1] === 0xd9
  ) {
    return { extension: "jpg", contentType: "image/jpeg" };
  }

  const ascii = (start: number, length: number) =>
    String.fromCharCode(...bytes.slice(start, start + length));
  if (
    bytes.length >= 16 &&
    ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP" &&
    ["VP8 ", "VP8L", "VP8X"].includes(ascii(12, 4))
  ) {
    return { extension: "webp", contentType: "image/webp" };
  }

  return null;
}

export const uploadCommunityPhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => uploadCommunityPhotoInput.parse(data))
  .handler(async ({ data, context }): Promise<{ path: string }> => {
    let bytes: Uint8Array;
    try {
      bytes = Uint8Array.from(atob(data.base64), (character) => character.charCodeAt(0));
    } catch {
      throw new Error("O arquivo enviado não é uma foto válida.");
    }
    if (bytes.length === 0 || bytes.length > MAX_COMMUNITY_PHOTO_BYTES) {
      throw new Error("A foto deve ter no máximo 10 MB.");
    }

    const image = detectCommunityImage(bytes);
    if (!image) {
      throw new Error("Envie uma foto válida em JPG, PNG ou WebP.");
    }

    const path = `${context.userId}/${crypto.randomUUID()}.${image.extension}`;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.storage
      .from("community-photos")
      .upload(path, bytes, { contentType: image.contentType, upsert: false });
    if (error) throw new Error("Não foi possível enviar a foto.");

    return { path };
  });

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

    const [{ data: profiles }, { data: reactions }, { data: replies }, signedImages] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, display_name").in("id", userIds),
      supabaseAdmin.from("post_reactions").select("post_id, user_id").in("post_id", postIds),
      supabaseAdmin
        .from("post_replies")
        .select("id, post_id, user_id, body, created_at")
        .in("post_id", postIds)
        .order("created_at", { ascending: true }),
      imagePaths.length
        ? supabaseAdmin.storage.from("community-photos").createSignedUrls(imagePaths, 3600)
        : Promise.resolve({ data: [] as { path: string | null; signedUrl: string }[] }),
    ]);

    const replyUserIds = [...new Set((replies ?? []).map((reply) => reply.user_id))].filter(
      (id) => !userIds.includes(id),
    );
    const { data: replyProfiles } = replyUserIds.length
      ? await supabaseAdmin.from("profiles").select("id, display_name").in("id", replyUserIds)
      : { data: [] };
    const names = new Map(
      [...(profiles ?? []), ...(replyProfiles ?? [])].map((profile) => [profile.id, profile.display_name]),
    );
    const urls = new Map(
      (signedImages.data ?? []).map((image) => [image.path as string, image.signedUrl]),
    );
    const allReactions = reactions ?? [];

    return rows.map((post) => ({
      id: post.id,
      body: post.body,
      created_at: post.created_at,
      user_id: post.user_id,
      author: names.get(post.user_id) ?? "Apolo",
      reactions: allReactions.filter((reaction) => reaction.post_id === post.id).length,
      reacted: allReactions.some(
        (reaction) => reaction.post_id === post.id && reaction.user_id === context.userId,
      ),
      image_url: post.image_path ? (urls.get(post.image_path) ?? null) : null,
      replies: (replies ?? [])
        .filter((reply) => reply.post_id === post.id)
        .map((reply) => ({
          ...reply,
          author: names.get(reply.user_id) ?? "Apolo",
        })),
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
      .filter((profile) => profile.protocol_days > 0 || profile.missions_done > 0)
      .sort(
        (a, b) =>
          b.protocol_days - a.protocol_days || b.missions_done - a.missions_done,
      )
      .slice(0, 20);
  });

export const getCommunityNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CommunityNotificationResult[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: notifications, error } = await supabaseAdmin
      .from("community_notifications")
      .select("id, kind, post_id, actor_id, read_at, created_at")
      .eq("recipient_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) throw new Error("Não foi possível carregar as notificações.");

    const rows = notifications ?? [];
    if (rows.length === 0) return [];

    const actorIds = [...new Set(rows.map((item) => item.actor_id))];
    const postIds = [...new Set(rows.map((item) => item.post_id))];
    const [{ data: profiles }, { data: posts }] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, display_name").in("id", actorIds),
      supabaseAdmin.from("community_posts").select("id, body").in("id", postIds),
    ]);
    const names = new Map((profiles ?? []).map((profile) => [profile.id, profile.display_name]));
    const previews = new Map((posts ?? []).map((post) => [post.id, post.body]));

    return rows.map((item) => ({
      id: item.id,
      kind: item.kind === "reply" ? "reply" : "post",
      post_id: item.post_id,
      actor_id: item.actor_id,
      actor: names.get(item.actor_id) ?? "Alguém da comunidade",
      preview: (previews.get(item.post_id) ?? "").slice(0, 90),
      read_at: item.read_at,
      created_at: item.created_at,
    }));
  });