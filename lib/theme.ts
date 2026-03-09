// lib/theme.ts
export const THEME = {
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '10px 20px 40px 20px',
    minHeight: '100vh'
  },
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
  tableContainer: {
    background: 'rgba(12, 12, 12, 0.8)',
    backdropFilter: 'blur(15px)',
    borderRadius: '24px',
    border: '1px solid rgba(255,255,255,0.1)',
    overflowX: 'auto'
  },
  th: {
    padding: '10px',
    fontSize: '0.75rem',
    fontWeight: '900',
    textTransform: 'uppercase',
    color: '#666'
  },
  td: {
    padding: '7px',
    fontSize: '0.90rem'
  },
  seasonNav: {
    display: 'flex',
    justifyContent: 'center',
    gap: '10px',
    marginBottom: '40px'
  },
  seasonLinkBase: {
    padding: '10px 25px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: '700',
    border: 'none',
    transition: 'all 0.2s ease-in-out'
  },
  extraPoint: {
    color: '#fbbf24',
    fontSize: '0.75rem',
    verticalAlign: 'top',
    marginLeft: '1px',
    fontWeight: '900'
  }
};
