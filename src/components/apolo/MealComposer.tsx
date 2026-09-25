import { useServerFn } from "@tanstack/react-start";
import { Camera, Loader2, Mic, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { describeMealPhoto } from "@/lib/meal-photo.functions";

type Props = {
  /** momento sugerido (ex.: "Lanche") — aparece como chip acima do campo */
  slotName: string;
  busy: boolean;
  onRegister: (text: string) => void;
  focusToken?: number;
};

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
};

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** Reduz a foto para no máximo 1024 px e devolve um JPEG em data URL. */
async function shrinkImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1024 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Não foi possível preparar a foto.");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

export function MealComposer({ slotName, busy, onRegister, focusToken = 0 }: Props) {
  const [text, setText] = useState("");
  const [reading, setReading] = useState(false);
  const [listening, setListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const describe = useServerFn(describeMealPhoto);

  useEffect(() => {
    if (focusToken > 0) textareaRef.current?.focus();
  }, [focusToken]);

  useEffect(() => () => recognitionRef.current?.stop(), []);

  async function handlePhoto(file: File | null) {
    if (!file) return;
    setReading(true);
    try {
      const dataUrl = await shrinkImage(file);
      const { description } = await describe({ data: { dataUrl } });
      setText((current) => (current.trim() ? `${current.trim()}, ${description}` : description));
      textareaRef.current?.focus();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não consegui ler a foto.");
    } finally {
      setReading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function toggleListening() {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const Ctor = getSpeechRecognition();
    if (!Ctor) {
      toast.error("Seu navegador não permite ditar por voz. Escreva o que comeu.");
      return;
    }
    const recognition = new Ctor();
    recognition.lang = "pt-BR";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = Array.from(
        { length: event.results.length },
        (_, i) => event.results[i]?.[0]?.transcript ?? "",
      )
        .join(" ")
        .trim();
      if (transcript)
        setText((current) => (current.trim() ? `${current.trim()}, ${transcript}` : transcript));
    };
    recognition.onerror = (event) => {
      if (event.error !== "aborted") toast.error("Não consegui ouvir. Tente de novo ou escreva.");
    };
    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };
    recognitionRef.current = recognition;
    setListening(true);
    try {
      recognition.start();
    } catch {
      setListening(false);
      toast.error("Não consegui ativar o microfone.");
    }
  }

  function submit() {
    const value = text.trim();
    if (busy) return;
    if (!value) {
      textareaRef.current?.focus();
      return;
    }
    onRegister(value);
    setText("");
  }

  return (
    <section
      className="surface rise mt-5 p-6"
      style={{ "--stagger": "70ms" } as React.CSSProperties}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[1.5rem]">Registrar refeição</h2>
        <span className="rounded-full bg-sand px-3 py-1 text-xs font-semibold text-foreground">
          {slotName}
        </span>
      </div>
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
        }}
        rows={3}
        placeholder="Ex.: arroz, feijão, carne moída e salada"
        aria-label="O que você comeu"
        className="mt-4 w-full resize-none rounded-2xl border border-sand-deep bg-card p-4 text-[16px] outline-none placeholder:text-muted-foreground/80 focus:border-primary"
      />
      <div className="mt-4 flex items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          aria-hidden
          tabIndex={-1}
          onChange={(e) => void handlePhoto(e.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={reading}
          aria-label="Tirar foto da refeição"
          className="press flex size-12 items-center justify-center rounded-full border border-sand-deep bg-card text-foreground disabled:opacity-60"
        >
          {reading ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <Camera className="size-5" strokeWidth={1.8} />
          )}
        </button>
        <button
          type="button"
          onClick={toggleListening}
          aria-label={listening ? "Parar de ouvir" : "Ditar por voz"}
          aria-pressed={listening}
          className={`press flex size-12 items-center justify-center rounded-full border ${
            listening
              ? "border-primary bg-secondary text-primary"
              : "border-sand-deep bg-card text-foreground"
          }`}
        >
          {listening ? (
            <Square className="size-4" fill="currentColor" strokeWidth={0} />
          ) : (
            <Mic className="size-5" strokeWidth={1.8} />
          )}
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={busy}
          className="press ml-auto min-h-12 rounded-full bg-primary px-7 text-[15px] font-semibold text-primary-foreground disabled:opacity-60"
        >
          {busy ? "Registrando…" : "Registrar"}
        </button>
      </div>
    </section>
  );
}
