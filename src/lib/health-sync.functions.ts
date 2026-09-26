import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const sampleSchema = z.object({
  metricType: z.enum([
    "steps",
    "sleep_minutes",
    "heart_rate",
    "blood_glucose",
    "blood_pressure_systolic",
    "blood_pressure_diastolic",
  ]),
  value: z.number().finite().nonnegative(),
  unit: z.string().min(1).max(30),
  measuredAt: z.string().datetime(),
  endAt: z.string().datetime().optional(),
  sourceName: z.string().min(1).max(120),
  sourceDevice: z.string().max(120).optional(),
  externalId: z.string().min(1).max(240),
});

export const syncAppleHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        deviceName: z.string().max(120).optional(),
        permissions: z.array(z.string().max(80)).max(20),
        samples: z.array(sampleSchema).max(1000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: connection, error: connectionError } = await context.supabase
      .from("health_connections")
      .upsert(
        {
          user_id: context.userId,
          provider: "apple_health",
          status: "connected",
          permissions: data.permissions,
          device_name: data.deviceName ?? null,
          last_synced_at: new Date().toISOString(),
          last_error: null,
        },
        { onConflict: "user_id,provider" },
      )
      .select("id")
      .single();
    if (connectionError) throw connectionError;
    if (data.samples.length) {
      const rows = data.samples.map((sample) => ({
        user_id: context.userId,
        connection_id: connection.id,
        metric_type: sample.metricType,
        value: sample.value,
        unit: sample.unit,
        measured_at: sample.measuredAt,
        end_at: sample.endAt ?? null,
        source_name: sample.sourceName,
        source_device: sample.sourceDevice ?? null,
        external_id: sample.externalId,
      }));
      const { error } = await context.supabase
        .from("health_samples")
        .upsert(rows, { onConflict: "user_id,external_id", ignoreDuplicates: true });
      if (error) throw error;
    }
    return { accepted: data.samples.length, syncedAt: new Date().toISOString() };
  });
