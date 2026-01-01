import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function SharePage({ params }: { params: { id: string } }) {
  let share = await prisma.shareLink.findUnique({ where: { id: params.id }, include: { conversion: true } })
  if (!share) {
    const byConv = await prisma.shareLink.findUnique({ where: { conversionId: params.id }, include: { conversion: true } })
    if (byConv) share = byConv
  }
  if (!share) return <div className="p-4">Not found</div>
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="border rounded overflow-hidden">
        <div className="p-2 border-b font-semibold">Input ({share.conversion.sourceLang})</div>
        <pre className="p-2 h-[70vh] overflow-auto bg-black/80 text-green-200 whitespace-pre-wrap text-sm">{share.conversion.inputCode}</pre>
      </div>
      <div className="border rounded overflow-hidden">
        <div className="p-2 border-b font-semibold">Output ({share.conversion.targetLang})</div>
        <pre className="p-2 h-[70vh] overflow-auto bg-black/80 text-blue-200 whitespace-pre-wrap text-sm">{share.conversion.outputCode}</pre>
      </div>
    </div>
  )
}
