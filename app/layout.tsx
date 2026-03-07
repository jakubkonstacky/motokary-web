import Link from 'next/link'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <body style={{ margin: 0, background: '#000', color: '#fff', fontFamily: 'sans-serif' }}>
        {/* --- NAVIGACE --- */}
        <nav style={{ 
          padding: '20px', 
          borderBottom: '1px solid #333', 
          display: 'flex', 
          gap: '20px',
          background: '#0a0a0a',
          position: 'sticky',
          top: 0
        }}>
          <Link href="/" style={{ color: '#fbbf24', fontWeight: 'bold', textDecoration: 'none' }}>🏠 Domů</Link>
          <Link href="/vysledky" style={{ color: '#fff', textDecoration: 'none' }}>🏁 Výsledky</Link>
          <Link href="/galerie" style={{ color: '#fff', textDecoration: 'none' }}>📸 Galerie</Link>
          <Link href="/o-nas" style={{ color: '#fff', textDecoration: 'none' }}>👥 O nás</Link>
          <Link href="/kontakt" style={{ color: '#fff', textDecoration: 'none' }}>📞 Kontakt</Link>
        </nav>

        <main style={{ padding: '20px' }}>
          {children}
        </main>
      </body>
    </html>
  )
}
