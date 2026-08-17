"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Hotel,
  ArrowLeft,
  Upload,
  CheckCircle2,
  User,
  CreditCard,
  CalendarDays,
} from "lucide-react";

export default function PassportPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    lastName: "",
    firstName: "",
    passportNumber: "",
    birthDate: "",
  });

  const update = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const canSubmit =
    form.lastName.trim() &&
    form.firstName.trim() &&
    form.passportNumber.trim() &&
    form.birthDate.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-white">
        <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground">
              <Hotel className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight">AI-консьерж</h1>
              <p className="text-sm text-muted-foreground">Загрузка паспорта</p>
            </div>
          </div>
        </header>

        <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardContent className="py-12 flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <h2 className="text-xl font-semibold">Паспорт отправлен</h2>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Данные паспорта успешно отправлены. Мы обработаем их в ближайшее
                  время. Вернитесь в чат, чтобы узнать следующие шаги.
                </p>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <Button asChild>
                    <Link href="/">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Вернуться в чат
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </main>

        <footer className="border-t bg-white/80 backdrop-blur-sm mt-auto">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 text-center text-xs text-muted-foreground">
            Прототип интеграции ИИ с данными бронирования &middot; Powered by Kimi
            Platform
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-white">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground">
            <Hotel className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">AI-консьерж</h1>
            <p className="text-sm text-muted-foreground">Загрузка паспорта</p>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col gap-4"
        >
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Назад
              </Link>
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Upload className="w-4 h-4" />
                Данные паспорта
              </CardTitle>
              <CardDescription>
                Заполните данные для завершения первого этапа заселения
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="last-name" className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                      Фамилия *
                    </Label>
                    <Input
                      id="last-name"
                      placeholder="Иванов"
                      value={form.lastName}
                      onChange={(e) => update("lastName", e.target.value)}
                      autoComplete="family-name"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="first-name" className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                      Имя *
                    </Label>
                    <Input
                      id="first-name"
                      placeholder="Иван"
                      value={form.firstName}
                      onChange={(e) => update("firstName", e.target.value)}
                      autoComplete="given-name"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="passport-num" className="flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
                    Серия и номер паспорта *
                  </Label>
                  <Input
                    id="passport-num"
                    placeholder="4510 123456"
                    value={form.passportNumber}
                    onChange={(e) => update("passportNumber", e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="birth-date" className="flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                    Дата рождения *
                  </Label>
                  <Input
                    id="birth-date"
                    type="date"
                    value={form.birthDate}
                    onChange={(e) => update("birthDate", e.target.value)}
                  />
                </div>

                <div className="pt-2">
                  <Badge
                    variant="outline"
                    className="text-xs text-muted-foreground font-normal"
                  >
                    Демо: данные сохраняются только локально и никак не обрабатываются, вводите фиктивные данные
                  </Badge>
                </div>

                <Button type="submit" disabled={!canSubmit} className="w-full sm:w-auto">
                  <Upload className="w-4 h-4 mr-2" />
                  Отправить паспорт
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      <footer className="border-t bg-white/80 backdrop-blur-sm mt-auto">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 text-center text-xs text-muted-foreground">
          Прототип интеграции ИИ с данными бронирования &middot; Powered by Kimi
          Platform
        </div>
      </footer>
    </div>
  );
}
