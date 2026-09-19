import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import {
  AlertTriangle,
  Bookmark,
  Camera,
  ChevronDown,
  Flashlight,
  Loader2,
  PackageSearch,
  Plus,
  RotateCcw,
  Search,
  WifiOff,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/nativo/AppShell";
import { useAuth } from "@/lib/auth-context";
import { useMealMutations } from "@/lib/nativo-queries";
import { useBarcodeScanner } from "@/lib/scanner/useBarcodeScanner";
import { useSaveProduct, useScanBarcode, type ScanOutcome } from "@/lib/scanner/queries";
import { SCORE_CATEGORY_LABEL, SCORE_CATEGORY_TONE, type ApoloScoreResult, type Product } from "@/lib/scanner/types";

export const Route = createFileRoute("/scanner")({
  head: () => ({
    meta: [
      { title: "Scanner de produtos — APOLO" },
      {
        name: "description",
        content: "Aponte a câmera para o código de barras e veja o quanto o produto está alinhado com o APOLO.",
      },
      { property: "og:title", content: "Scanner de produtos — APOLO" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ScannerPage,
});

type ViewState =
  | { view: "camera" }
  | { view: "manual" }
  | { view: "loading" }
  | { view: "result"; outcome: Extract<ScanOutcome, { ok: true }> }
  | { view: "not_found" }
  | { view: "network_error" }
  | { view: "unknown_error" };

function ScannerPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const scan = useScanBarcode(user?.id);
  const [state, setState] = useState<ViewState>({ view: "camera" });

  const runScan = useCallback(
    async (barcode: string, source: "barcode" | "manual") => {
      setState({ view: "loading" });
      try {
        const outcome = await scan.mutateAsync({ barcode, source });
        if (!outcome.ok) {
          if (outcome.error.type === "not_found") setState({ view: "not_found" });
          else if (outcome.error.type === "network_error") setState({ view: "network_error" });
          else setState({ view: "unknown_error" });
          return;
        }
        setState({ view: "result", outcome });
      } catch {
        setState({ view: "unknown_error" });
      }
    },
    [scan],
  );

  const close = () => navigate({ to: "/" });

  return (
    <AppShell>
      <div className="fixed inset-0 z-30 flex flex-col bg-foreground text-background">
        {state.view === "camera" && (
          <CameraView onDetected={(code) => void runScan(code, "barcode")} onManual={() => setState({ view: "manual" })} onClose={close} />
        )}
        {state.view === "manual" && (
          <ManualEntryView onSubmit={(code) => void runScan(code, "manual")} onBack={() => setState({ view: "camera" })} onClose={close} />
        )}
        {state.view === "loading" && <CenteredMessage icon={<Loader2 className="size-8 animate-spin" />} title="Analisando produto…" onClose={close} />}
        {state.view === "not_found" && (
          <CenteredMessage
            icon={<PackageSearch className="size-8" />}
            title="Produto não encontrado"
            detail="Não achamos esse código na base pública. Tente digitar novamente ou escaneie outro produto."
            action={{ label: "Digitar código", onClick: () => setState({ view: "manual" }) }}
            onClose={close}
          />
        )}
        {state.view === "network_error" && (
          <CenteredMessage
            icon={<WifiOff className="size-8" />}
            title="Erro de conexão"
            detail="Não conseguimos consultar a base de produtos agora. Verifique sua internet e tente de novo."
            action={{ label: "Tentar de novo", onClick: () => setState({ view: "camera" }) }}
            onClose={close}
          />
        )}
        {state.view === "unknown_error" && (
          <CenteredMessage
            icon={<AlertTriangle className="size-8" />}
            title="Algo não saiu como esperado"
            detail="Tente escanear novamente em alguns segundos."
            action={{ label: "Tentar de novo", onClick: () => setState({ view: "camera" }) }}
            onClose={close}
          />
        )}
        {state.view === "result" && (
          <ResultView
            outcome={state.outcome}
            userId={user?.id}
            onScanAnother={() => setState({ view: "camera" })}
            onClose={close}
          />
        )}
      </div>
    </AppShell>
  );
}

function CameraView({
  onDetected,
  onManual,
  onClose,
}: {
  onDetected: (barcode: string) => void;
  onManual: () => void;
  onClose: () => void;
}) {
  const { videoRef, status, start, torchOn, torchSupported, toggleTorch, detectorSupported } = useBarcodeScanner(onDetected);

  const attachVideo = useCallback(
    (node: HTMLVideoElement | null) => {
      videoRef.current = node;
      if (node) void start();
    },
    [start, videoRef],
  );

  return (
    <div className="relative flex-1">
      <video ref={attachVideo} className="size-full object-cover" muted playsInline autoPlay />

      <div className="absolute inset-0 flex flex-col">
        <div className="flex items-center justify-between p-4">
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar scanner"
            className="flex size-10 items-center justify-center rounded-full bg-black/40 backdrop-blur"
          >
            <X className="size-5" />
          </button>
          {torchSupported ? (
            <button
              type="button"
              onClick={() => void toggleTorch()}
              aria-label="Lanterna"
              aria-pressed={torchOn}
              className={`flex size-10 items-center justify-center rounded-full backdrop-blur ${torchOn ? "bg-primary" : "bg-black/40"}`}
            >
              <Flashlight className="size-5" />
            </button>
          ) : (
            <span />
          )}
        </div>

        <div className="flex flex-1 items-center justify-center px-10">
          <div className="aspect-[3/2] w-full max-w-sm rounded-3xl border-2 border-white/70" />
        </div>

        <div className="space-y-3 p-6 pb-10 text-center">
          {status === "permission_denied" && (
            <p className="text-sm text-white/90">
              Permissão de câmera negada. Habilite o acesso à câmera nas configurações do navegador, ou digite o código manualmente.
            </p>
          )}
          {status === "unsupported" && (
            <p className="text-sm text-white/90">
              Este navegador ainda não detecta o código de barras automaticamente. Digite o código manualmente.
            </p>
          )}
          {status === "starting" && <p className="text-sm text-white/80">Abrindo câmera…</p>}
          {status === "scanning" && detectorSupported && (
            <p className="text-sm text-white/80">Aponte para o código de barras do produto</p>
          )}

          <button
            type="button"
            onClick={onManual}
            className="mx-auto flex items-center gap-2 rounded-full bg-white/15 px-5 py-2.5 text-sm font-medium backdrop-blur"
          >
            <Search className="size-4" />
            Digitar código manualmente
          </button>
        </div>
      </div>
    </div>
  );
}

function ManualEntryView({
  onSubmit,
  onBack,
  onClose,
}: {
  onSubmit: (barcode: string) => void;
  onBack: () => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState("");
  return (
    <div className="flex flex-1 flex-col p-6">
      <div className="flex items-center justify-between">
        <button type="button" onClick={onBack} className="text-sm text-white/80">
          ← Voltar à câmera
        </button>
        <button type="button" onClick={onClose} aria-label="Fechar scanner" className="flex size-9 items-center justify-center rounded-full bg-white/10">
          <X className="size-4" />
        </button>
      </div>
      <div className="mt-auto mb-auto">
        <h1 className="font-display text-xl font-semibold">Digitar código de barras</h1>
        <p className="mt-2 text-sm text-white/70">Geralmente 8 ou 13 números, embaixo do próprio código de barras.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const trimmed = value.trim();
            if (trimmed.length >= 4) onSubmit(trimmed);
          }}
          className="mt-6"
        >
          <input
            inputMode="numeric"
            pattern="[0-9]*"
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="7891000100103"
            autoFocus
            className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3.5 text-lg tracking-wide text-white outline-none placeholder:text-white/40 focus:border-white/50"
          />
          <button
            type="submit"
            disabled={value.trim().length < 4}
            className="mt-4 w-full rounded-full bg-primary px-5 py-3.5 text-sm font-medium text-primary-foreground disabled:opacity-40"
          >
            Buscar produto
          </button>
        </form>
      </div>
    </div>
  );
}

function CenteredMessage({
  icon,
  title,
  detail,
  action,
  onClose,
}: {
  icon: React.ReactNode;
  title: string;
  detail?: string;
  action?: { label: string; onClick: () => void };
  onClose: () => void;
}) {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
      <button type="button" onClick={onClose} aria-label="Fechar scanner" className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full bg-white/10">
        <X className="size-4" />
      </button>
      <div className="text-white/80">{icon}</div>
      <h1 className="font-display text-lg font-semibold">{title}</h1>
      {detail ? <p className="max-w-xs text-sm text-white/70">{detail}</p> : null}
      {action ? (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
        >
          {action.label}
        </button>
      ) : null}
    </div>
  );
}

function ResultView({
  outcome,
  userId,
  onScanAnother,
  onClose,
}: {
  outcome: Extract<ScanOutcome, { ok: true }>;
  userId: string | undefined;
  onScanAnother: () => void;
  onClose: () => void;
}) {
  const { product, result, productId } = outcome;
  const meals = useMealMutations(userId);
  const saveProduct = useSaveProduct(userId);
  const [ingredientsOpen, setIngredientsOpen] = useState(false);
  const tone = SCORE_CATEGORY_TONE[result.category];

  const addToMeal = () => {
    meals.add.mutate(
      {
        name: product.name ?? "Produto escaneado",
        items: [product.brand].filter((v): v is string => Boolean(v)),
        kcal: product.nutrition.energy_kcal_100g ?? 0,
        note: `Adicionado via Scanner · APOLO ${result.score}`,
      },
      {
        onSuccess: () => toast.success("Adicionado ao seu diário de hoje."),
        onError: () => toast.error("Não foi possível adicionar. Tente novamente."),
      },
    );
  };

  const save = () => {
    saveProduct.mutate(productId, {
      onSuccess: () => toast.success("Produto salvo."),
      onError: () => toast.error("Não foi possível salvar o produto."),
    });
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background text-foreground">
      <div className="relative">
        <div className="flex aspect-[16/10] items-center justify-center bg-secondary">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.imageUrl} alt={product.name ?? "Produto"} className="size-full object-contain p-6" />
          ) : (
            <Camera className="size-10 text-muted-foreground" strokeWidth={1.4} />
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="rise mx-auto max-w-xl px-5 pb-32 pt-5">
        <p className="text-sm text-muted-foreground">{product.brand ?? "Marca não informada"}</p>
        <h1 className="font-display text-2xl font-semibold leading-tight">{product.name ?? "Produto sem nome"}</h1>

        <div className={`surface mt-5 flex items-center gap-4 border p-5 ${tone.border} ${tone.bg}`}>
          <div className={`flex size-16 shrink-0 items-center justify-center rounded-full bg-card font-display text-2xl font-bold ${tone.text}`}>
            {result.score}
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">APOLO Score</p>
            <p className={`font-display text-lg font-semibold ${tone.text}`}>{SCORE_CATEGORY_LABEL[result.category]}</p>
          </div>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          {resultSummary(result)}
        </p>

        {result.reasons.length > 0 && (
          <section className="surface mt-5 p-5">
            <h2 className="text-sm font-semibold text-foreground">O que gostamos</h2>
            <ul className="mt-3 space-y-2">
              {result.reasons.map((r) => (
                <li key={r.ruleId} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-success" />
                  {r.label}
                </li>
              ))}
            </ul>
          </section>
        )}

        {result.warnings.length > 0 && (
          <section className="surface mt-5 p-5">
            <h2 className="text-sm font-semibold text-foreground">Pontos de atenção</h2>
            <ul className="mt-3 space-y-2">
              {result.warnings.map((w) => (
                <li key={w.ruleId} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-terracotta" />
                  {w.label}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="surface mt-5 p-5">
          <button
            type="button"
            onClick={() => setIngredientsOpen((v) => !v)}
            className="flex w-full items-center justify-between text-sm font-semibold text-foreground"
          >
            Ingredientes ({product.ingredients.length})
            <ChevronDown className={`size-4 transition-transform ${ingredientsOpen ? "rotate-180" : ""}`} />
          </button>
          {ingredientsOpen && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {product.ingredients.map((ing, i) => (
                <li key={i} className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                  {ing.raw}
                </li>
              ))}
              {product.ingredients.length === 0 && (
                <p className="text-xs text-muted-foreground">Lista de ingredientes não informada pelo fabricante.</p>
              )}
            </ul>
          )}
        </section>

        <NutritionSection nutrition={product.nutrition} />

        <div className="mt-6 space-y-2.5">
          <button
            type="button"
            onClick={addToMeal}
            disabled={meals.add.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            <Plus className="size-4" />
            Adicionar à refeição
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saveProduct.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card px-5 py-3.5 text-sm font-medium text-foreground disabled:opacity-60"
          >
            <Bookmark className="size-4" />
            Salvar produto
          </button>
          <button
            type="button"
            onClick={onScanAnother}
            className="flex w-full items-center justify-center gap-2 px-5 py-3 text-sm font-medium text-muted-foreground"
          >
            <RotateCcw className="size-4" />
            Escanear outro
          </button>
        </div>
      </div>
    </div>
  );
}

function resultSummary(result: ApoloScoreResult): string {
  switch (result.category) {
    case "muito_alinhado":
      return "Composição bem alinhada com os critérios APOLO — poucos pontos de atenção.";
    case "alinhado":
      return "No geral um produto alinhado com os critérios APOLO, com pequenos pontos a observar.";
    case "neutro":
      return "Produto neutro nos critérios APOLO — nem muito alinhado, nem um problema claro.";
    case "atencao":
      return "Vale prestar atenção antes de tornar este produto um hábito recorrente.";
    case "pouco_alinhado":
      return "Pouco alinhado com os critérios adotados pelo APOLO hoje.";
  }
}

function NutritionSection({ nutrition }: { nutrition: Product["nutrition"] }) {
  const rows: Array<[string, number | null, string]> = [
    ["Energia", nutrition.energy_kcal_100g, "kcal"],
    ["Proteínas", nutrition.proteins_100g, "g"],
    ["Carboidratos", nutrition.carbohydrates_100g, "g"],
    ["Açúcares", nutrition.sugars_100g, "g"],
    ["Gorduras", nutrition.fat_100g, "g"],
    ["Gorduras saturadas", nutrition.saturated_fat_100g, "g"],
    ["Fibras", nutrition.fiber_100g, "g"],
    ["Sódio", nutrition.sodium_100g, "g"],
  ];
  const available = rows.filter(([, value]) => value !== null);
  if (available.length === 0) return null;

  return (
    <section className="surface mt-5 p-5">
      <h2 className="text-sm font-semibold text-foreground">Informações nutricionais (por 100g)</h2>
      <div className="mt-3 divide-y divide-border/60 text-sm">
        {available.map(([label, value, unit]) => (
          <div key={label} className="flex items-center justify-between py-2 text-muted-foreground">
            <span>{label}</span>
            <span className="font-medium text-foreground">
              {value}
              {unit}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
