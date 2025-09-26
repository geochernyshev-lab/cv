# ResumeTailor Pro — MVP (без оплаты)

Next.js (App Router) приложение: вставляете JD и резюме → получаете Match Score, совпадения/пробелы (Gaps),
рекомендованные bullets, сопроводительное (если задан OPENAI_API_KEY), и экспорт DOCX.

## Быстрый старт (Vercel или локально)

### Локально
1) Node.js LTS 18+
2) Установка:
   ```bash
   npm install
   npm run dev
   ```
3) (опц.) Создайте `.env.local` из `.env.example` и вставьте `OPENAI_API_KEY`

### Vercel
1) Залейте проект в GitHub
2) Import на vercel.com → Project → Environment Variables:
   - `OPENAI_API_KEY` (опционально)
   - `OPENAI_MODEL=gpt-5` (опционально)
3) Deploy — получите URL вида https://<project>.vercel.app

## Маршруты
- `POST /api/generate` — анализ JD/резюме (оффлайн-чек + опц. OpenAI для письма)
- `POST /api/export` — экспорт DOCX

PDF: используйте печать в браузере → «Сохранить как PDF».
