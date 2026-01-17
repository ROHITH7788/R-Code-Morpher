import { NextResponse } from 'next/server'
import { runWithLLM } from '@/lib/llm'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { lang, code } = body || {}
    if (!lang || !code) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    const res = await runWithLLM({ lang, code })
    return NextResponse.json(res)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Run failed' }, { status: 500 })
  }
}

