import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

// Vynutí načtení čerstvých dat při každé návštěvě
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function HomePage() {
  // Dynamické zjištění aktuálního roku (např. 2026)
  const currentYear = new Date().getFullYear();
  
  // Načtení dat ze Supabase pro aktuální rok
  const { data: races } = await supabase.from('races').select('*').eq('season_id', currentYear).order('id', { ascending: true });
  const { data: categories } = await supabase.from('categories').select('*').eq('season_id', currentYear).order('order_by', { ascending: true });
  const { data: results } = await supabase.from('results').select('total_points, category_id, drivers(full_name, start_number)');

  // Funkce pro výpočet TOP 3 pro každou kategorii
  const getTopThree = (catId: string) => {
    const grouped: any = {};
    results?.filter(r => r.category_id === catId).forEach((r: any) => {
      const name = r.drivers?.full_name;
      if (!name) return;
      if (!grouped[name]) {
        grouped[name] = { name, points: 0, number: r.drivers.start_number };
      }
      grouped[name].points += r.total_points;
    });
    return Object.values(grouped).sort((a: any, b: any) => b.points - a.points).slice(0, 3);
  };

  return (
    <div style={{ maxWidth: '1250px', margin: '0 auto', padding: '40px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '40px' }}>
      
      {/* KALENDÁŘ ZÁVODŮ - UPRAVENÝ NADPIS S DYNAMICKÝM ROKEM */}
      <section>
// Najdi nadpisy v sekcích a uprav je takto:
<h2 style={{ 
  fontSize: '2.5rem', 
  fontWeight: '800', 
  color: '#fbbf24', // Stejná žlutá jako v galerii
  textTransform: 'none', // Zrušení velkých písmen
  marginBottom: '30px',
  fontFamily: 'inherit' // Zajistí stejný font jako u galerie
}}>
  Kalendář závodů {currentYear}
</h2>
        <div style={glassCardStyle}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {races && races.length > 0 ? races.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '20px', color: '#fbbf24', fontWeight: '800' }}>
                        {new Date(r.race_date).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' })}.
                  </td>
                  <td style={{ padding: '20px', fontWeight: '700', fontSize: '1.1rem' }}>{r.name}</td>
                </tr>
              )) : (
                <tr><td style={{ padding: '40px', textAlign: 'center', color: '#444' }}>Žádné naplánované závody pro rok {currentYear}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* PRŮBĚŽNÉ POŘADÍ */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
<h2 style={{ 
  fontSize: '2.5rem', 
  fontWeight: '800', 
  color: '#fbbf24', 
  textTransform: 'none', 
  marginBottom: '30px' 
}}>🏆 Průběžné pořadí</h2>
          <Link href="/vysledky" style={{ color: '#fbbf24', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 'bold' }}>
            Kompletní výsledky -{'>'}
          </Link>
        </div>
        
        {categories?.map(cat => {
          const drivers = getTopThree(cat.id);
          if (drivers.length === 0) return null;
          return (
            <div key={cat.id} style={{ ...glassCardStyle, marginBottom: '25px' }}>
              <div style={{ padding: '12px 20px', background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', fontWeight: '900', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                    {cat.name}
              </div>
              {(drivers as any[]).map((d, idx) => (
                <div key={idx} style={{ display: 'flex', padding: '18px 20px', borderBottom: idx < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none', alignItems: 'center' }}>
                  <span style={{ width: '35px', fontWeight: '900', color: idx === 0 ? '#fbbf24' : '#555' }}>{idx + 1}.</span>
                  <div style={{ flex: 1, fontWeight: '700' }}>{d.name}</div>
                  <div style={{ fontWeight: '900', color: '#fbbf24' }}>{d.points} b.</div>
                </div>
              ))}
            </div>
          );
        })}
      </section>
    </div>
  );
}

// STYLY PRO GLASSMORPHISM (PRŮHLEDNOST)
const glassCardStyle: any = { 
    background: 'rgba(12, 12, 12, 0.8)', 
    backdropFilter: 'blur(15px)', 
    borderRadius: '24px', 
    border: '1px solid rgba(255,255,255,0.1)', 
    overflow: 'hidden' 
};

const headerStyle: any = { 
    fontSize: '1.6rem', 
    fontWeight: '900', 
    textTransform: 'uppercase', 
    margin: '0 0 20px 0', 
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
};
