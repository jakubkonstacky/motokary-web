import './globals.css';
import Link from 'next/link';

export const metadata = { 
  title: 'ENZO Cup - zavody motokar', 
  description: 'Oficiální šampionát motokár' 
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <body style={{ 
        margin: 0, 
        backgroundColor: '#050505', 
        backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(0,0,0,0.9)), url("https://lchw6dtdl0iuc4mh.public.blob.vercel-storage.com/Draha_OV.jpg")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed', // Fotka se při scrollování nehýbe
        minHeight: '100vh',
        color: '#fff'
      }}>
        <nav style={{ 
          position: 'sticky', top: 0, zIndex: 1000,
          background: 'rgba(5, 5, 5, 0.8)', backdropFilter: 'blur(15px)',
          borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '20px 0'
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px' }}>
            <Link href="/" style={{ fontSize: '1.5rem', fontWeight: '900', color: '#fbbf24', textDecoration: 'none' }}>
              ENZO<span style={{ color: '#fff' }}>CUP</span>
            </Link>
            <div style={{ display: 'flex', gap: '25px' }}>
              {[
                { name: 'Kalendář závodů', href: '/' }, // PŘEJMENOVÁNO Z "DOMŮ"
                { name: 'Výsledky', href: '/vysledky' },
                { name: 'Galerie', href: '/galerie' },
                { name: 'O nás', href: '/o-nas' },
                { name: 'Kontakt', href: '/kontakt' }
              ].map((item) => (
                <Link key={item.name} href={item.href} style={{ color: '#ccc', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase' }}>
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
