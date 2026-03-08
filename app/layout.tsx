import './globals.css'; // Tato řádka teď najde ten nový soubor
import Link from 'next/link';

export const metadata = { 
  title: 'Motokáry Konstacký', 
  description: 'Oficiální výsledky týmu' 
};

// ... (ostatní importy zůstávají)

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <body>
        <nav style={{ 
          position: 'sticky', top: 0, zIndex: 100,
          background: 'rgba(5, 5, 5, 0.8)', backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          padding: '15px 0'
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px' }}>
            {/* ZMĚNA ZDE: ENZO CUP logo */}
            <Link href="/" style={{ fontSize: '1.4rem', fontWeight: '900', color: '#fbbf24', textDecoration: 'none', letterSpacing: '-1px' }}>
              ENZO<span style={{ color: '#fff' }}>CUP</span>
            </Link>
            
            {/* ... (zbytek menu zůstává stejný) */}
            <div style={{ display: 'flex', gap: '30px' }}>
              {/* Odkazy Domů, Výsledky, Galerie... */}
            </div>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
