import { THEME } from '@/lib/theme'; // Import centrálních stylů

export default function KontaktPage() {
  return (
    <div style={THEME.container}>
      
      {/* Hlavní nadpis - Sentence case, žlutá, posunutý nahoru */}
      <h1 style={THEME.mainTitle}>Kontaktujte nás</h1>
      
      <p style={subtitleStyle}>
        Máte dotazy k výsledkům nebo se k nám chcete přidat? Ozvěte se!
      </p>

      {/* Grid s kontakty - Karty ve stylu tabulek */}
      <div style={contactGridStyle}>
        <div style={THEME.tableContainer}>
          <div style={{ padding: '40px' }}>
            <h3 style={THEME.categoryTitle}>Email</h3>
            <p style={contactValueStyle}>info@aaa-bbb-ccc.cz</p>
          </div>
        </div>
        
        <div style={THEME.tableContainer}>
          <div style={{ padding: '40px' }}>
            <h3 style={THEME.categoryTitle}>Telefon</h3>
            <p style={contactValueStyle}>+420 123 456 789</p>
          </div>
        </div>
      </div>

      {/* Sociální sítě - Sjednocený design */}
      <div style={socialSectionStyle}>
        <h3 style={{ ...THEME.categoryTitle, textAlign: 'center' }}>Sledujte nás</h3>
        <div style={socialLinksWrapperStyle}>
          <span style={socialLinkStyle}>Instagram</span>
          <span style={socialDividerStyle}>|</span>
          <span style={socialLinkStyle}>Facebook</span>
          <span style={socialDividerStyle}>|</span>
          <span style={socialLinkStyle}>YouTube</span>
        </div>
      </div>
    </div>
  );
}

// DOPLŇKOVÉ STYLY PRO KONTAKTY
const subtitleStyle: any = { 
  fontSize: '1.2rem', 
  marginBottom: '50px', 
  textAlign: 'center', 
  color: '#888',
  maxWidth: '600px',
  margin: '0 auto 50px auto'
};

const contactGridStyle: any = { 
  display: 'grid', 
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
  gap: '30px',
  maxWidth: '1000px',
  margin: '0 auto'
};

const contactValueStyle: any = { 
  fontSize: '1.3rem', 
  fontWeight: '600', 
  color: '#fff', 
  marginTop: '10px' 
};

const socialSectionStyle: any = { 
  marginTop: '80px', 
  paddingTop: '40px', 
  borderTop: '1px solid rgba(255,255,255,0.05)' 
};

const socialLinksWrapperStyle: any = { 
  display: 'flex', 
  justifyContent: 'center', 
  gap: '15px', 
  fontSize: '1.1rem',
  fontWeight: '700'
};

const socialLinkStyle: any = { color: '#fff', cursor: 'pointer' };
const socialDividerStyle: any = { color: 'rgba(255,255,255,0.1)' };
