import './globals.css';
import Navbar from '@/components/Navbar';
import { THEME } from '@/lib/theme';

export const metadata = {
  title: 'ENZOCUP - Motokárový šampionát',
  description: 'Oficiální stránky motokárového šampionátu ENZO CUP.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="cs" style={{ background: '#000', color: '#fff' }}>
      <body style={bodyStyle}>
        <Navbar />

        <main style={mainContentStyle}>
          {children}
        </main>

        {/* VYLEPŠENÁ PATIČKA */}
        <footer style={footerStyle}>
          <div style={socialContainerStyle}>
            {/* Facebook */}
            <a href="https://facebook.com/enzocup" target="_blank" rel="noopener noreferrer" style={socialIconStyle} title="Facebook">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
            </a>
            {/* Instagram */}
            <a href="https://instagram.com/enzocup" target="_blank" rel="noopener noreferrer" style={socialIconStyle} title="Instagram">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            </a>
            {/* TikTok / YouTube (Alternativa) */}
            <a href="https://youtube.com/enzocup" target="_blank" rel="noopener noreferrer" style={socialIconStyle} title="YouTube">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
            </a>
          </div>

          <div style={{ opacity: 0.4, fontSize: '0.8rem', marginTop: '20px', letterSpacing: '1px' }}>
            © {new Date().getFullYear()} ENZOCUP | VŠECHNY PRÁVA VYHRAZENY
          </div>
        </footer>
      </body>
    </html>
  );
}

// --- STYLY ---

const bodyStyle: any = {
  margin: 0,
  padding: 0,
  background: '#000',
  fontFamily: 'Inter, sans-serif',
  minHeight: '100vh',
  overflowX: 'hidden',
  overflowY: 'visible'
};

const mainContentStyle: any = {
  paddingTop: '90px',
  minHeight: 'calc(100vh - 250px)',
  position: 'relative',
  zIndex: 1
};

const footerStyle: any = {
  textAlign: 'center',
  padding: '60px 20px',
  borderTop: '1px solid rgba(255,255,255,0.05)',
  background: 'linear-gradient(to top, rgba(251,191,36,0.02), transparent)',
  marginTop: '80px'
};

const socialContainerStyle: any = {
  display: 'flex',
  justifyContent: 'center',
  gap: '30px',
  marginBottom: '10px'
};

const socialIconStyle: any = {
  color: '#fff',
  transition: 'all 0.3s ease',
  display: 'inline-block',
  cursor: 'pointer',
  // Hover efekt je definován v globals.css, ale zde ho můžeme podpořit
};
