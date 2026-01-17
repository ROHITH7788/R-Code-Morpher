import '../styles/globals.css'
import { ReactNode } from 'react'
import NavBar from '@/components/NavBar'
import ToastProvider from '@/components/toast/ToastProvider'
import AuthProvider from '@/components/AuthProvider'

export const metadata = {
  title: 'R Code Morpher',
  description: 'Convert code between programming languages with AI',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-gradient-to-br from-bg-light to-white dark:from-bg-dark dark:to-gray-900 text-gray-900 dark:text-gray-100">
        <AuthProvider>
          <ToastProvider>
            <NavBar />
            <div className="max-w-[1600px] mx-auto p-4 md:p-6">{children}</div>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
