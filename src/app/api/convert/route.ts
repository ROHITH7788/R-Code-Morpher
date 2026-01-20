import { NextResponse } from 'next/server'
import { convertWithLLM } from '@/lib/llm'

export async function POST(req: Request) {
  const body = await req.json()
  const { sourceLang, targetLang, inputCode, dsaMode } = body || {}
  if (!sourceLang || !targetLang || !inputCode) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  try {
    const converted = await convertWithLLM({ sourceLang, targetLang, inputCode, dsaMode })
    const { outputCode, explanation, complexity, tests, usedLLM } = converted as any
    try {
      const mod = await import('@/lib/prisma')
      const prisma = (mod as any).prisma
      const userId = null
      if (userId) {
        await prisma.conversion.create({ data: { userId, sourceLang, targetLang, inputCode, outputCode, explanation, complexity, tests } })
      }
    } catch {}
    return NextResponse.json({ outputCode, explanation, complexity, tests, usedLLM })
  } catch (e: any) {
    const msg = (e?.message || '').toString()
    const status =
      /LLM_API_KEY_MISSING|LLM_UNCHANGED_OUTPUT/.test(msg)
        ? 400
        : /LLM error\s+401|invalid_api_key/i.test(msg)
          ? 401
          : /aborted|AbortError/i.test(msg)
            ? 408
          : 500
    return NextResponse.json({ error: msg || 'Conversion failed' }, { status })
  }
}
