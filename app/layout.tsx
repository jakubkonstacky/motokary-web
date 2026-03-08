import './globals.css';
import Link from 'next/link';

export const metadata = { title: 'ENZO CUP | Oficiální šampionát' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <body>
        <nav style={{ 
          position: 'sticky', top: 0, zIndex: 1000,
          background: 'rgba(5, 5, 5, 0.9)', backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '20px 0'
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px' }}>
            <Link href="/" style={{ fontSize: '1.5rem', fontWeight: '900', color: '#fbbf24', textDecoration: 'none' }}>
              ENZO<span style={{ color: '#fff' }}>CUP</span>
            </Link>
            <div style={{ display: 'flex', gap: '25px' }}>
              <Link href="/" style={{ color: '#ccc', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase' }}>Domů</Link>
              <Link href="/vysledky" style={{ color: '#ccc', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase' }}>Výsledky</Link>
              <Link href="/galerie" style={{ color: '#ccc', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase' }}>Galerie</Link>
              <Link href="/o-nas" style={{ color: '#ccc', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase' }}>O nás</Link>
              <Link href="/kontakt" style={{ color: '#ccc', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase' }}>Kontakt</Link>
            </div>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
