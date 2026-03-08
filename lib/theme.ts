// lib/theme.ts
export const THEME = {
  // Hlavní kontejner stránky (posunuto nahoru)
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '10px 20px 40px 20px', // Horní padding jen 10px
    minHeight: '100vh'
  },
  
  // Nadpisy (Sentence case, žlutá, tlustý font)
  mainTitle: {
    fontSize: '2.5rem',
    fontWeight: '800',
    color: '#fbbf24',
    textTransform: 'none',
    marginBottom: '40px',
    textAlign: 'center',
    marginTop: '0'
  },
  
  categoryTitle: {
    fontSize: '1.8rem',
    fontWeight: '800',
    color: '#fbbf24',
    marginBottom: '25px',
    textTransform: 'none'
  },

  // Přepínače sezón (Styl podle galerie)
  seasonNav: {
    display: 'flex',
    justifyContent: 'center',
    gap: '10px',
    marginBottom: '40px'
  },
  
  seasonLinkBase: {
    padding: '10px 25px',
    borderRadius: '8px', // Hranatější rohy jako v galerii
    textDecoration: 'none',
    fontWeight: '700',
    border: 'none', // Bez rámečku
    transition: 'all 0.2s ease-in-out'
  },

  // Tabulky
  tableContainer: {
    background: 'rgba(12, 12, 12, 0.8)',
    backdropFilter: 'blur(15px)',
    borderRadius: '24px',
    border: '1px solid rgba(255,255,255,0.1)',
    overflowX: 'auto'
  },
  
  th: {
    padding: '20px',
    fontSize: '0.75rem',
    fontWeight: '900',
    textTransform: 'uppercase',
    color: '#666'
  },
  
  td: {
    padding: '20px',
    fontSize: '1rem'
  },

  // Body a pozice
  extraPoint: {
    color: '#fbbf24',
    fontSize: '0.75rem',
    verticalAlign: 'top',
    marginLeft: '1px',
    fontWeight: '900'
  },
  
  positionSub: {
    fontSize: '0.7rem',
    color: '#888',
    marginTop: '4px'
  }
};
