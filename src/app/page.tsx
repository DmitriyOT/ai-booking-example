"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MessageSquare,
  Send,
  FileCheck,
  FileX,
  Bot,
  Hotel,
  Loader2,
} from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function HomePage() {
  const [passportReceived, setPassportReceived] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = useCallback(async () => {
    const trimmed = message.trim();
    if (!trimmed || isLoading) return;

    setError(null);
    const userMessage: ChatMessage = { role: "user", content: trimmed };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setMessage("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          passportReceived,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Ошибка сервера: ${res.status}`);
      }

      const data = await res.json();
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.response,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Произошла неизвестная ошибка";
      setError(errorMsg);
      // Remove the user message if request failed
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  }, [message, messages, passportReceived, isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground">
            <Hotel className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">
              AI-консьерж
            </h1>
            <p className="text-sm text-muted-foreground">
              Помощник по бронированию
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">
        {/* Booking Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileCheck className="w-4 h-4" />
              Статус бронирования
            </CardTitle>
            <CardDescription>
              Управляйте статусом получения паспорта гостя
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                {passportReceived ? (
                  <Badge
                    variant="default"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                  >
                    <FileCheck className="w-3 h-3 mr-1" />
                    Паспорт получен
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200 shrink-0"
                  >
                    <FileX className="w-3 h-3 mr-1" />
                    Паспорт не получен
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Label
                  htmlFor="passport-toggle"
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  Получен
                </Label>
                <Switch
                  id="passport-toggle"
                  checked={passportReceived}
                  onCheckedChange={setPassportReceived}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chat Card */}
        <Card className="flex-1 flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="w-4 h-4" />
              Чат с ИИ
            </CardTitle>
            <CardDescription>
              Задайте вопрос об этапах заселения
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col flex-1 gap-4">
            {/* Messages Area */}
            <div className="min-h-[200px] max-h-[400px] overflow-y-auto rounded-lg border bg-muted/30 p-4 flex flex-col gap-3">
              {messages.length === 0 && !isLoading && (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-8 text-muted-foreground">
                  <Bot className="w-10 h-10 mb-3 opacity-40" />
                  <p className="text-sm font-medium">Начните диалог</p>
                  <p className="text-xs mt-1 max-w-xs">
                    Спросите, например: &laquo;Как мне заселиться?&raquo; или
                    &laquo;Что мне делать дальше?&raquo;
                  </p>
                </div>
              )}
              <AnimatePresence mode="popLayout">
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex gap-2.5 ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {msg.role === "assistant" && (
                      <div className="shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted rounded-bl-md"
                      }`}
                    >
                      {msg.content}
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
              </AnimatePresence>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-2.5"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input Area */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="guest-message" className="sr-only">
                Сообщение гостя
              </Label>
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
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Думаю...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Получить ответ ИИ
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm mt-auto">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 text-center text-xs text-muted-foreground">
          Прототип интеграции ИИ с данными бронирования &middot; Powered by Kimi
          Platform
        </div>
      </footer>
    </div>
  );
}
