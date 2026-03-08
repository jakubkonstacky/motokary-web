import './globals.css';
import Link from 'next/link';

export const metadata = { title: 'Motokáry Konstacký', description: 'Oficiální výsledky týmu' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <body style={{ margin: 0, backgroundColor: '#050505', color: '#fff', fontFamily: '"Inter", sans-serif' }}>
        {/* SLEEK NAVIGATION BAR */}
        <nav style={{ 
          position: 'sticky', top: 0, zIndex: 100,
          background: 'rgba(5, 5, 5, 0.8)', backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          padding: '15px 0'
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px' }}>
            <Link href="/" style={{ fontSize: '1.4rem', fontWeight: '900', color: '#fbbf24', textDecoration: 'none', letterSpacing: '-1px' }}>
              KONSTACKÝ<span style={{ color: '#fff' }}>RACING</span>
            </Link>
            <div style={{ display: 'flex', gap: '30px' }}>
              {[
                { name: 'Domů', href: '/' },
                { name: 'Výsledky', href: '/vysledky' },
                { name: 'Galerie', href: '/galerie' },
                { name: 'O nás', href: '/o-nas' },
                { name: 'Kontakt', href: '/kontakt' }
              ].map((item) => (
                <Link key={item.name} href={item.href} style={{ 
                  color: '#aaa', textDecoration: 'none', fontSize: '0.9rem', 
                  fontWeight: '500', textTransform: 'uppercase', letterSpacing: '1px',
                  transition: '0.3s'
                }} 
                onMouseEnter={(e) => e.currentTarget.style.color = '#fbbf24'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#aaa'}>
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
