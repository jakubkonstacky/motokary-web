export default function KontaktPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
      <h1 style={{ color: '#fbbf24' }}>📞 Kontaktujte nás</h1>
      <p style={{ fontSize: '1.2rem', marginBottom: '40px' }}>
        Máte dotazy k výsledkům nebo se k nám chcete přidat? Ozvěte se!
      </p>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '20px',
        marginTop: '20px' 
      }}>
        <div style={{ background: '#111', padding: '30px', borderRadius: '10px', border: '1px solid #333' }}>
          <h3 style={{ color: '#fbbf24' }}>Email</h3>
          <p>info@motokary-web.cz</p>
        </div>
        
        <div style={{ background: '#111', padding: '30px', borderRadius: '10px', border: '1px solid #333' }}>
          <h3 style={{ color: '#fbbf24' }}>Telefon</h3>
          <p>+420 123 456 789</p>
        </div>
      </div>

      <div style={{ marginTop: '50px', padding: '20px', borderTop: '1px solid #222' }}>
        <h3 style={{ color: '#fbbf24' }}>Sledujte nás</h3>
        <p>Instagram | Facebook | YouTube</p>
      </div>
    </div>
  )
}
