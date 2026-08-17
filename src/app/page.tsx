"use client";

import { useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  MessageSquare,
  Send,
  FileCheck,
  FileX,
  Bot,
  Hotel,
  Loader2,
  Settings,
  ExternalLink,
  Eye,
  EyeOff,
  AlertTriangle,
  ShieldCheck,
  Trash2,
  RotateCcw,
} from "lucide-react";

const KIMI_MODELS = ["moonshot-v1-8k", "moonshot-v1-32k", "moonshot-v1-128k"] as const;
const KIMI_MODEL_LABELS: Record<string, string> = {
  "moonshot-v1-8k": "moonshot-v1-8k (быстрая)",
  "moonshot-v1-32k": "moonshot-v1-32k",
  "moonshot-v1-128k": "moonshot-v1-128k (медленная)",
};
const LS_KEY = "ai-concierge-settings";
const LS_MESSAGES_KEY = "ai-concierge-messages";
const LS_PASSPORT_KEY = "ai-concierge-passport";

interface Settings {
  apiKey: string;
  stubMode: boolean;
  model: string;
}

function loadSettings(): Settings {
  const defaults: Settings = { apiKey: "", stubMode: false, model: KIMI_MODELS[0] };
  if (typeof window === "undefined") return defaults;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...defaults, ...parsed };
    }
  } catch {
    /* ignore */
  }
  return defaults;
}

function saveSettings(s: Settings) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

function loadMessages(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_MESSAGES_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return [];
}

function saveMessages(msgs: ChatMessage[]) {
  try {
    localStorage.setItem(LS_MESSAGES_KEY, JSON.stringify(msgs));
  } catch {
    /* ignore */
  }
}

function loadPassportReceived(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(LS_PASSPORT_KEY) === "true";
  } catch {
    return false;
  }
}

function savePassportReceived(v: boolean) {
  try {
    localStorage.setItem(LS_PASSPORT_KEY, String(v));
  } catch {
    /* ignore */
  }
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function getStubResponse(passportReceived: boolean, userMessage: string): string {
  const msg = userMessage.toLowerCase();
  if (msg.includes("паспорт") || msg.includes("загруз") || msg.includes("документ")) {
    return passportReceived
      ? "Ваш паспорт уже получен и проверен ✓. Можете переходить к следующему этапу — оплате залога."
      : "Для начала процесса заселения необходимо **загрузить копию паспорта**. Это первый обязательный шаг. Пожалуйста, перейдите на страницу загрузки: [загрузить паспорт](/passport).";
  }
  if (msg.includes("засел") || msg.includes("заселиться") || (msg.includes("как") && msg.includes("мне"))) {
    return passportReceived
      ? "Ваш паспорт уже на руках! Следующий шаг — **оплата залога**. После подтверждения оплаты мы подготовим ваш номер к заезду."
      : "Процесс заселения состоит из нескольких этапов:\n\n1. **Загрузка паспорта** — *сейчас этот шаг не завершён*\n2. **Оплата залога** — после получения паспорта\n3. **Получение ключа** — после оплаты\n\nПожалуйста, начните с загрузки паспорта — это обязательный первый шаг: [загрузить паспорт](/passport).";
  }
  if (msg.includes("оплат") || msg.includes("залог") || msg.includes("деньг") || msg.includes("карт")) {
    return passportReceived
      ? "Оплатить залог можно картой при заселении или заранее онлайн. **Сумма залога** зависит от категории номера и будет списана при заселении."
      : "Оплата залога — это второй этап после загрузки паспорта. Сначала необходимо загрузить паспорт, затем мы направим вам ссылку на оплату. [Загрузить паспорт](/passport).";
  }
  if (msg.includes("ключ") || msg.includes("номер") || msg.includes("комнат")) {
    return passportReceived
      ? "После оплаты залога вы получите ключ от номера на ресепшен. Номер будет готов к вашему заезду."
      : "Получение ключа — финальный этап. Перед этим нужно загрузить паспорт и оплатить залог. Начните с первого шага: [загрузить паспорт](/passport).";
  }
  if (msg.includes("привет") || msg.includes("здравствуй") || msg.includes("добр")) {
    return passportReceived
      ? "Здравствуйте! Рады вас видеть. Ваш паспорт уже получен. Чем могу помочь?"
      : "Здравствуйте! Добро пожаловать. Я — ваш виртуальный консьерж. 🏨\n\nДля начала процесса заселения необходимо **загрузить паспорт** — это обязательный первый шаг.\n\n[Перейти к загрузке паспорта →](/passport)";
  }
  if (msg.includes("спасибо") || msg.includes("благодар")) {
    return "Пожалуйста! Обращайтесь, если возникнут вопросы по бронированию или заселению. Я всегда на связи.";
  }
  // default
  return passportReceived
    ? "Спасибо за вопрос. Ваш паспорт уже получен. Если у вас есть вопросы по оплате залога или подготовке номера — задавайте, с радостью помогу!"
    : "Спасибо за вопрос. Напоминаю, что *первым шагом* для заселения является **загрузка паспорта**.\n\n[Загрузить паспорт](/passport)";
}

function renderInlineMarkdown(text: string): ReactNode {
  // Split text into tokens: bold, italic, markdown links, plain URLs, and plain text
  // Order matters: **bold** before *italic*, md-links before plain URLs
  const pattern = /\*\*(.+?)\*\*|\*([^*]+?)\*|\[([^\]]+)\]\(([^)]+)\)|(https?:\/\/[^\s)<>]+)/g;

  const tokens: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyIdx = 0;

  while ((match = pattern.exec(text)) !== null) {
    // Push preceding plain text with line break handling
    if (match.index > lastIndex) {
      tokens.push(renderTextWithBreaks(text.slice(lastIndex, match.index), keyIdx++));
    }

    if (match[1] !== undefined) {
      // **bold**
      tokens.push(
        <strong key={`b-${keyIdx++}`} className="font-semibold">
          {renderInlineMarkdown(match[1])}
        </strong>
      );
    } else if (match[2] !== undefined) {
      // *italic*
      tokens.push(
        <em key={`i-${keyIdx++}`} className="italic">
          {renderInlineMarkdown(match[2])}
        </em>
      );
    } else if (match[3] !== undefined) {
      // [text](url) — markdown link
      const href = match[4];
      const label = match[3];
      const isInternal = href.startsWith('/');
      if (isInternal) {
        tokens.push(
          <Link
            key={`l-${keyIdx++}`}
            href={href}
            className="underline underline-offset-2 text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-0.5"
          >
            {renderInlineMarkdown(label)}
          </Link>
        );
      } else {
        tokens.push(
          <a
            key={`l-${keyIdx++}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-0.5"
          >
            {renderInlineMarkdown(label)}
          </a>
        );
      }
    } else if (match[5] !== undefined) {
      // plain URL
      const url = match[5];
      const label = url.length > 50 ? url.slice(0, 47) + "..." : url;
      tokens.push(
        <a
          key={`u-${keyIdx++}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 text-primary hover:text-primary/80 transition-colors"
        >
          {label}
        </a>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Push remaining plain text
  if (lastIndex < text.length) {
    tokens.push(renderTextWithBreaks(text.slice(lastIndex), keyIdx++));
  }

  return tokens.length === 1 ? tokens[0] : <>{tokens}</>;
}

function renderTextWithBreaks(text: string, baseKey: number): ReactNode {
  return text.split("\n").map((line, j, arr) => {
    // Detect list items: "1. ", "- ", "* "
    const listMatch = line.match(/^(\d+)\.\s(.*)$/);
    const dashMatch = !listMatch && line.match(/^[-*]\s(.*)$/);

    return (
      <span key={`${baseKey}-${j}`}>
        {j > 0 && <br />}
        {listMatch && (
          <span className="font-medium mr-1">{listMatch[1]}.</span>
        )}
        {dashMatch && (
          <span className="mr-1">•</span>
        )}
        {listMatch ? listMatch[2] : dashMatch ? dashMatch[1] : line}
      </span>
    );
  });
}

function renderMessageContent(text: string) {
  // Split by double newlines for paragraph-like spacing
  const paragraphs = text.split(/\n\n+/);
  return <>{paragraphs.map((para, pi) => (
    <span key={`p-${pi}`}> 
      {pi > 0 && <><br /><br /></>}
      {renderInlineMarkdown(para)}
    </span>
  ))}</>;
}

function buildSystemPrompt(passportReceived: boolean) {
  return `Ты — интеллектуальный консьерж отеля. Ты отвечаешь на вопросы гостя о процессе бронирования и заселения.

Текущий статус бронирования:
- Паспорт: ${passportReceived ? "получен ✓" : "не получен ✗"}

Правила заселения:
1. Сначала гость должен предоставить паспорт. Если паспорт ещё не получен — обязательно напомни гостю, что это первый необходимый шаг, и дай **кликабельную ссылку** в формате markdown: [загрузить паспорт](/passport). Эту ссылку нужно давать ВСЕГДА, когда обсуждается загрузка паспорта или когда гость спрашивает что делать дальше, а паспорт ещё не получен.
2. Если паспорт УЖЕ получен — НИКОГДА не давай ссылку /passport и не упоминай загрузку паспорта как необходимость. Вместо этого говори о следующем этапе — оплате залога.
3. После получения паспорта следующий этап — оплата залога. Пиши просто, что необходимо оплатить залог, не придумывай как именно это сделать и не придумывай условия.

Форматирование сообщений:
- Используй **жирный текст** (двойные звёздочки) для выделения важных слов и этапов.
- Используй *курсив* (одинарные звёздочки) для пояснений.
- Используй нумерованные списки (1. 2. 3.) для перечисления этапов.
- Ссылки на внутренние страницы давай ТОЛЬКО в формате markdown: [текст ссылки](/путь).
- Никогда не пиши голые URL без форматирования.

Отвечай вежливо, кратко и по делу. Отвечай только на русском языке. Не придумывай информацию, которой нет в контексте. Если гость спрашивает о чём-то несвязанном с бронированием — мягко скажи, что ты можешь помочь только по вопросам бронирования и заселения.`;
}

class RateLimitError extends Error {
  constructor() {
    super("RATE_LIMIT");
    this.name = "RateLimitError";
  }
}

async function callKimiSingle(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const url = "https://api.moonshot.ai/v1/chat/completions";

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      }),
    });
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error("Сетевая ошибка. Проверьте подключение к интернету.");
    }
    throw err;
  }

  if (!res.ok) {
    if (res.status === 429) throw new RateLimitError();
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      detail = body?.error?.message || body?.error || detail;
    } catch {
      /* ignore */
    }
    if (res.status === 401)
      detail = "Неверный API-ключ. Проверьте ключ на platform.moonshot.ai";
    if (res.status === 402)
      detail = "Недостаточно средств на аккаунте Kimi";
    throw new Error(detail);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Пустой ответ от ИИ");
  return content;
}

async function callKimiWithFallback(
  apiKey: string,
  preferredModel: string,
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  // Build ordered list: preferred first, then the rest
  const otherModels = KIMI_MODELS.filter((m) => m !== preferredModel);
  const modelsToTry = [preferredModel, ...otherModels];
  const errors: string[] = [];

  for (const model of modelsToTry) {
    try {
      return await callKimiSingle(apiKey, model, systemPrompt, userMessage);
    } catch (err) {
      if (err instanceof RateLimitError) {
        errors.push(model);
        continue; // try next model
      }
      throw err; // non-429 errors should propagate immediately
    }
  }

  // All models returned 429
  throw new Error(
    `Все модели перегружены (пробовались: ${errors.join(", ")}). Попробуйте позже.`
  );
}

export default function HomePage() {
  const [settings, setSettings] = useState<Settings>({
    apiKey: "",
    stubMode: true,
    model: KIMI_MODELS[0],
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [passportReceived, setPassportReceived] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesLoadedRef = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const s = loadSettings();
    setSettings(s);
    if (!s.apiKey && !s.stubMode) setSettingsOpen(true);
    if (!messagesLoadedRef.current) {
      messagesLoadedRef.current = true;
      setMessages(loadMessages());
      setPassportReceived(loadPassportReceived());
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Sync passport status when tab gains focus (e.g. user returns from /passport)
  useEffect(() => {
    const onStorage = () => {
      setPassportReceived(loadPassportReceived());
    };
    const onFocus = () => {
      setPassportReceived(loadPassportReceived());
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const handleClearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    try { localStorage.removeItem(LS_MESSAGES_KEY); } catch { /* ignore */ }
  }, []);

  const handleSaveSettings = useCallback(() => {
    saveSettings(settings);
    setSettingsOpen(false);
  }, [settings]);

  const handleToggleStub = useCallback(() => {
    setSettings((s) => {
      const next = { ...s, stubMode: !s.stubMode };
      saveSettings(next);
      return next;
    });
  }, []);

  const doSend = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    if (!settings.apiKey.trim() && !settings.stubMode) {
      setSettingsOpen(true);
      return;
    }

    setError(null);
    setRetryMessage(null);
    const updated = [...messages, { role: "user" as const, content: text.trim() }];
    setMessages(updated);
    saveMessages(updated);
    setMessage("");
    setIsLoading(true);

    try {
      let response: string;
      if (settings.stubMode) {
        // Simulate network delay for realism
        await new Promise((r) => setTimeout(r, 800 + Math.random() * 700));
        response = getStubResponse(passportReceived, text.trim());
      } else {
        const systemPrompt = buildSystemPrompt(passportReceived);
        response = await callKimiWithFallback(
          settings.apiKey,
          settings.model,
          systemPrompt,
          text.trim()
        );
      }
      const withReply = [...updated, { role: "assistant" as const, content: response }];
      setMessages(withReply);
      saveMessages(withReply);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Произошла неизвестная ошибка";
      setError(msg);
      // Keep user message, save retry text
      setRetryMessage(text.trim());
    } finally {
      setIsLoading(false);
    }
  }, [messages, passportReceived, isLoading, settings]);

  const handleSend = useCallback(async () => {
    await doSend(message);
  }, [message, doSend]);

  const handleRetry = useCallback(async () => {
    if (!retryMessage) return;
    // Remove the last user message that failed, then re-send
    const reverted = messages.slice(0, -1);
    setMessages(reverted);
    saveMessages(reverted);
    setError(null);
    setRetryMessage(null);
    await doSend(retryMessage);
  }, [retryMessage, messages, doSend]);

  const handlePassportToggle = useCallback((v: boolean) => {
    setPassportReceived(v);
    savePassportReceived(v);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-white">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground">
              <Hotel className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight">AI-консьерж</h1>
              <p className="text-sm text-muted-foreground">Помощник по бронированию</p>
            </div>
          </div>
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0" aria-label="Настройки">
                <Settings className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Настройки</DialogTitle>
                <DialogDescription>Подключение к Kimi Platform API</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-2">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex flex-col gap-0.5">
                    <Label htmlFor="stub-toggle" className="text-sm font-medium flex items-center gap-1.5">
                      <Bot className="w-3.5 h-3.5" />
                      Режим заглушек
                    </Label>
                    <p className="text-xs text-muted-foreground">Имитация ответов ИИ без API-ключа</p>
                  </div>
                  <Switch id="stub-toggle" checked={settings.stubMode} onCheckedChange={(v) => setSettings((s) => ({ ...s, stubMode: v }))} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="api-key" className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Kimi API-ключ *
                  </Label>
                  <div className="relative">
                    <Input
                      id="api-key"
                      type={showKey ? "text" : "password"}
                      placeholder="sk-..."
                      value={settings.apiKey}
                      onChange={(e) => setSettings((s) => ({ ...s, apiKey: e.target.value }))}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={() => setShowKey((v) => !v)}
                      aria-label={showKey ? "Скрыть" : "Показать"}
                    >
                      {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Получите ключ на{" "}
                    <a href="https://platform.moonshot.ai" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
                      platform.moonshot.ai
                    </a>
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="model-select">Модель Kimi</Label>
                  <select
                    id="model-select"
                    value={settings.model}
                    onChange={(e) => setSettings((s) => ({ ...s, model: e.target.value }))}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {KIMI_MODELS.map((m) => (
                      <option key={m} value={m}>{KIMI_MODEL_LABELS[m]}</option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    При 429 (перегрузка) остальные модели пробуются автоматически
                  </p>
                </div>

              </div>
              <DialogFooter>
                <Button onClick={handleSaveSettings} disabled={!settings.apiKey.trim() && !settings.stubMode}>
                  Сохранить
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileCheck className="w-4 h-4" />
              Статус бронирования
            </CardTitle>
            <CardDescription>Управляйте статусом получения паспорта гостя</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                {passportReceived ? (
                  <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0">
                    <FileCheck className="w-3 h-3 mr-1" /> Паспорт получен
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200 shrink-0">
                    <FileX className="w-3 h-3 mr-1" /> Паспорт не получен
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Label htmlFor="passport-toggle" className="text-sm text-muted-foreground cursor-pointer">Получен</Label>
                <Switch id="passport-toggle" checked={passportReceived} onCheckedChange={handlePassportToggle} />
              </div>
            </div>
            {!passportReceived && (
              <div className="mt-4 flex items-center gap-2 text-sm">
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <Link href="/passport" className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors">
                  Страница загрузки паспорта →
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {settings.stubMode && (
          <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
            <Bot className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Режим заглушек активен</p>
              <p className="mt-1">
                Ответы ИИ имитируются локально. Для реальных ответов введите API-ключ в{" "}
                <button onClick={() => setSettingsOpen(true)} className="underline underline-offset-2 font-medium hover:text-blue-900">
                  настройках
                </button>.
              </p>
            </div>
          </div>
        )}

        {!settings.apiKey.trim() && !settings.stubMode && !settingsOpen && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">API-ключ не задан</p>
              <p className="mt-1">
                Нажмите{" "}
                <button onClick={() => setSettingsOpen(true)} className="underline underline-offset-2 font-medium hover:text-amber-900">
                  здесь
                </button>
                , чтобы ввести ключ Kimi Platform или включите режим заглушек.
              </p>
            </div>
          </div>
        )}

        <Card className="flex-1 flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="w-4 h-4" /> Чат с ИИ
            </CardTitle>
            <CardDescription className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                Задайте вопрос об этапах заселения
                {settings.stubMode && (
                  <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50 text-[10px] px-1.5 py-0">
                    STUB
                  </Badge>
                )}
              </span>
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-muted-foreground hover:text-destructive"
                  onClick={handleClearMessages}
                  aria-label="Очистить историю"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Очистить
                </Button>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col flex-1 gap-4">
            <div className="min-h-[200px] max-h-[400px] overflow-y-auto rounded-lg border bg-muted/30 p-4 flex flex-col gap-3">
              {messages.length === 0 && !isLoading && (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-8 text-muted-foreground">
                  <Bot className="w-10 h-10 mb-3 opacity-40" />
                  <p className="text-sm font-medium">Начните диалог</p>
                  <p className="text-xs mt-1 max-w-xs">
                    Спросите, например: &laquo;Как мне заселиться?&raquo; или &laquo;Что мне делать дальше?&raquo;
                  </p>
                </div>
              )}
              {messages.map((msg, i) => (
                <motion.div
                  key={`msg-${i}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted rounded-bl-md"
                    }`}
                  >
                    {msg.role === "assistant"
                      ? renderMessageContent(msg.content)
                      : msg.content}
                  </div>
                  {msg.role === "user" && (
                    <div className="shrink-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center mt-0.5">
                      <MessageSquare className="w-3.5 h-3.5 text-primary-foreground" />
                    </div>
                  )}
                </motion.div>
              ))}
              {isLoading && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2.5 justify-start"
                >
                  <div className="shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:0ms]" />
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={chatEndRef} />
            </div>

            {error && (
              <div className="flex items-center gap-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-2.5">
                <span className="flex-1">{error}</span>
                {retryMessage && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 h-7 px-2 text-xs"
                    onClick={handleRetry}
                    disabled={isLoading}
                  >
                    <RotateCcw className={`w-3 h-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                    Повторить
                  </Button>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="guest-message" className="sr-only">Сообщение гостя</Label>
              <Textarea
                id="guest-message"
                placeholder="Напишите сообщение... (Enter для отправки)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                className="min-h-[80px] resize-y"
              />
              <Button
                onClick={handleSend}
                disabled={!message.trim() || isLoading}
                className="w-full sm:w-auto sm:self-end"
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Думаю...</>
                ) : (
                  <><Send className="w-4 h-4 mr-2" /> Получить ответ ИИ</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className="border-t bg-white/80 backdrop-blur-sm mt-auto">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 text-center text-xs text-muted-foreground">
          Прототип интеграции ИИ с данными бронирования &middot; Powered by Kimi Platform
        </div>
      </footer>
    </div>
  );
}
