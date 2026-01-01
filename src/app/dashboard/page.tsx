import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import Button from '@/components/ui/Button'

export default async function Dashboard() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return <div className="p-4">Please sign in.</div>
  const userId = (session.user as any).id
  const [conversions, files] = await Promise.all([
    prisma.conversion.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
    prisma.fileObject.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' } }),
  ])
  return (
    <div className="grid grid-cols-2 gap-6">
      <section>
        <h2 className="text-xl font-semibold mb-2">Conversion History</h2>
        <ul className="space-y-2">
          {conversions.map(c => (
            <li key={c.id} className="border rounded p-2 flex justify-between items-center">
              <div>
                <div className="font-medium">{c.sourceLang} → {c.targetLang}</div>
                <div className="text-xs text-gray-500">{new Date(c.createdAt).toLocaleString()}</div>
              </div>
              <div className="flex gap-2 items-center">
                <Link href={`/share/${c.id}`} className="text-blue-600">Open</Link>
                <Button onClick={async () => {
                  const res = await fetch('/api/share', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ inputCode: c.inputCode, outputCode: c.outputCode, sourceLang: c.sourceLang, targetLang: c.targetLang }) })
                  const data = await res.json()
                  navigator.clipboard.writeText(process.env.NEXT_PUBLIC_BASE_URL ? `${process.env.NEXT_PUBLIC_BASE_URL}/share/${data.id}` : `${typeof window !== 'undefined' ? window.location.origin : ''}/share/${data.id}`)
                }}>Copy link</Button>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-2">Files</h2>
        <ul className="space-y-2">
          {files.map(f => (
            <li key={f.id} className="border rounded p-2">
              <div className="font-medium">{f.name}</div>
              <pre className="max-h-40 overflow-auto whitespace-pre-wrap text-sm">{f.content}</pre>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
