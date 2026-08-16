import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

const SYSTEM_PROMPT_TEMPLATE = (passportReceived: boolean) => `Ты — интеллектуальный консьерж отеля. Ты отвечаешь на вопросы гостя о процессе бронирования и заселения.

Текущий статус бронирования:
- Паспорт: ${passportReceived ? "получен ✓" : "не получен ✗"}

Правила заселения:
1. Сначала гость должен предоставить паспорт. Если паспорт ещё не получен — напомни гостю, что это первый необходимый шаг, и дай ссылку для загрузки: https://example.com/passport
2. После получения паспорта следующий этап — оплата залога.

Отвечай вежливо, кратко и по делу. Отвечай только на русском языке. Не придумывай информацию, которой нет в контексте. Если гость спрашивает о чём-то несвязанном с бронированием — мягко скажи, что ты можешь помочь только по вопросам бронирования и заселения.
`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, passportReceived } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Сообщение обязательно" },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();
    const systemPrompt = SYSTEM_PROMPT_TEMPLATE(
      Boolean(passportReceived)
    );

    const completion = await zai.chat.completions.create({
      messages: [
        { role: "assistant", content: systemPrompt },
        { role: "user", content: message },
      ],
      thinking: { type: "disabled" },
    });

    const response = completion.choices[0]?.message?.content;

    if (!response || response.trim().length === 0) {
      return NextResponse.json(
        { error: "ИИ не смог сгенерировать ответ" },
        { status: 502 }
      );
    }

    return NextResponse.json({ response });
  } catch (err) {
    console.error("Chat API error:", err);
    const message =
      err instanceof Error ? err.message : "Внутренняя ошибка сервера";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
