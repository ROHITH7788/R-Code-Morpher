import { withAuth } from 'next-auth/middleware'

export default withAuth({
  pages: { signIn: '/login' },
})

export const config = {
  matcher: [
    '/((?!_next|api|login|signup|reset|favicon.ico).*)',
  ],
}
