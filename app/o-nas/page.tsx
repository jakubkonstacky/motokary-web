import { THEME } from '@/lib/theme'; // Import tvého centrálního skladu stylů

export default function ONasPage() {
  return (
    <div style={THEME.container}>
      
      {/* Hlavní nadpis - Sentence case, žlutá, posunutý nahoru */}
      <h1 style={THEME.mainTitle}>O našem týmu</h1>
      
      <div style={contentWrapperStyle}>
        
        {/* Sekce: Naše historie */}
        <section style={{ marginBottom: '60px' }}>
          <h2 style={THEME.categoryTitle}>Naše historie</h2>
          <div style={textBlockStyle}>
            Všechno to začalo v roce 20xx, kdy jsme poprvé usedli do motokár. 
            Od té doby jsme prošli desítkami závodů a nasbírali stovky zkušeností. 
            Naším cílem je neustálé zlepšování a radost z rychlé jízdy.
          </div>
        </section>

        {/* Sekce: Naše vize - Použití sjednoceného kontejneru */}
        <section>
          <div style={THEME.tableContainer}>
            <div style={{ padding: '40px' }}>
              <h2 style={{ ...THEME.categoryTitle, marginTop: 0 }}>Naše vize</h2>
              <div style={{ ...textBlockStyle, background: 'none', border: 'none', padding: 0 }}>
                Chceme vybudovat komunitu nadšenců do motokár, kde výsledky nejsou jen o číslech, 
                ale o přátelství a fair play na trati i mimo ni.
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

// DOPLŇKOVÉ STYLY PRO TEXT
const contentWrapperStyle: any = {
  maxWidth: '900px',
  margin: '0 auto',
  lineHeight: '1.7'
};

const textBlockStyle: any = {
  fontSize: '1.15rem',
  color: '#ccc',
  background: 'rgba(255,255,255,0.03)',
  padding: '35px',
  borderRadius: '24px',
  border: '1px solid rgba(255,255,255,0.05)'
};
