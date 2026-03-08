import './globals.css';
import Link from 'next/link';

// Změna textu v záložce prohlížeče (Metadata)
export const metadata = { 
  title: 'ENZO CUP | Oficiální šampionát', 
  description: 'Oficiální výsledky a galerie šampionátu motokár' 
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <body style={{ margin: 0, backgroundColor: '#050505', color: '#fff' }}>
        
        {/* HORNÍ NAVIGAČNÍ MENU */}
        <nav style={{ 
          position: 'sticky', 
          top: 0, 
          zIndex: 1000,
          background: 'rgba(5, 5, 5, 0.9)', 
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          padding: '20px 0'
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px' }}>
            
            {/* LOGO STRÁNKY */}
            <Link href="/" style={{ fontSize: '1.5rem', fontWeight: '900', color: '#fbbf24', textDecoration: 'none', letterSpacing: '-1px' }}>
              ENZO<span style={{ color: '#fff' }}>CUP</span>
            </Link>

            {/* ODKAZY MENU */}
            <div style={{ display: 'flex', gap: '30px' }}>
              {[
                { name: 'Domů', href: '/' },
                { name: 'Výsledky', href: '/vysledky' },
                { name: 'Galerie', href: '/galerie' },
                { name: 'O nás', href: '/o-nas' },
                { name: 'Kontakt', href: '/kontakt' }
              ].map((item) => (
                <Link key={item.name} href={item.href} style={{ 
                  color: '#ccc', 
                  textDecoration: 'none', 
                  fontSize: '0.85rem', 
                  fontWeight: '700', 
                  textTransform: 'uppercase', 
                  letterSpacing: '1px',
                  transition: 'color 0.3s'
                }}>
                  {item.name}
                </Link>
              ))}
            </div>

          </div>
        </nav>

        {/* ZDE SE ZOBRAZUJE OBSAH JEDNOTLIVÝCH STRÁNEK */}
        <main>{children}</main>

      </body>
    </html>
  );
}
