import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function HomePage() {
  // Systém si sám načte aktuální rok podle systémového času
  const currentYear = new Date().getFullYear();

  // 1. Načtení závodů sjednocených do kalendáře
  const { data: races } = await supabase
    .from('races')
    .select('*')
    .eq('season_id', currentYear)
    .order('race_date', { ascending: true });

  // 2. Načtení kategorií seřazených podle order_by
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('season_id', currentYear)
    .order('order_by', { ascending: true });

  // 3. Načtení výsledků pro TOP 3
  const { data: allResults } = await supabase
    .from('results')
    .select(`
      total_points,
      category_id,
      drivers (full_name, start_number),
      races!inner (season_id)
    `)
    .eq('races.season_id', currentYear);

  // Seskupení TOP 3 podle kategorií
  const standingsByCategory = categories?.map(cat => {
    const catResults = allResults?.filter(r => r.category_id === cat.id) || [];
    const driverPoints: any = {};
    
    catResults.forEach((res: any) => {
      const name = res.drivers?.full_name || 'Neznámý';
      if (!driverPoints[name]) {
        driverPoints[name] = { name, points: 0, number: res.drivers?.start_number };
      }
      driverPoints[name].points += (res.total_points || 0);
    });

    const top3 = Object.values(driverPoints)
      .sort((a: any, b: any) => b.points - a.points)
      .slice(0, 3);

    return { ...cat, top3 };
  }) || [];

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', color: '#fff', padding: '20px' }}>
      
      {/* HERO SECTION */}
      <section style={{ textAlign: 'center', marginBottom: '50px', padding: '50px 20px', background: 'linear-gradient(135deg, #111 0%, #000 100%)', borderRadius: '20px', border: '1px solid #333' }}>
        <h1 style={{ fontSize: '3.5rem', color: '#fbbf24', margin: 0 }}>Sezóna {currentYear}</h1>
        <p style={{ color: '#666', textTransform: 'uppercase', letterSpacing: '3px' }}>Oficiální kalendář a výsledky</p>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px', alignItems: 'start' }}>
        
        {/* --- KALENDÁŘ ZÁVODŮ (Sjednocený blok) --- */}
        <section style={{ background: '#111', borderRadius: '15px', border: '1px solid #222', overflow: 'hidden' }}>
          <div style={{ padding: '20px', background: '#1a1a1a', borderBottom: '2px solid #fbbf24' }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>📅</span> Kalendář závodů
            </h2>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#555', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '15px 20px' }}>Datum</th>
                <th style={{ padding: '15px 20px' }}>Název závodu</th>
                <th style={{ padding: '15px 20px', textAlign: 'right' }}>ID</th>
              </tr>
            </thead>
            <tbody>
              {races && races.length > 0 ? races.map((race, i) => (
                <tr key={race.id} style={{ borderTop: '1px solid #222', background: i % 2 === 0 ? 'transparent' : '#161616' }}>
                  <td style={{ padding: '15px 20px', color: '#fbbf24', fontWeight: 'bold' }}>
                    {new Date(race.race_date).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short' })}
                  </td>
                  <td style={{ padding: '15px 20px', fontWeight: '500' }}>{race.name}</td>
                  <td style={{ padding: '15px 20px', textAlign: 'right', color: '#444', fontSize: '0.8rem' }}>{race.id}</td>
                </tr>
              )) : (
                <tr><td colSpan={3} style={{ padding: '30px', textAlign: 'center', color: '#666' }}>Žádné vypsané závody.</td></tr>
              )}
            </tbody>
          </table>
        </section>

        {/* --- PRŮBĚŽNÉ POŘADÍ (S respektováním order_by) --- */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>🏆 Průběžné pořadí</h2>
            <Link href="/vysledky" style={{ color: '#fbbf24', fontSize: '0.8rem', textDecoration: 'none' }}>Všechny tabulky →</Link>
          </div>
          
          {standingsByCategory.map(cat => (
            <div key={cat.id} style={{ marginBottom: '20px', background: '#111', borderRadius: '12px', border: '1px solid #333', overflow: 'hidden' }}>
              <div style={{ padding: '10px 20px', background: '#1a1a1a', fontSize: '0.8rem', fontWeight: 'bold', color: '#fbbf24', display: 'flex', justifyContent: 'space-between' }}>
                <span>{cat.name}</span>
                <span style={{ color: '#444' }}>{cat.id}</span>
              </div>
              <div style={{ padding: '5px 15px' }}>
                {cat.top3.map((driver, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 5px', borderBottom: i < 2 ? '1px solid #222' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ width: '20px', color: i === 0 ? '#fbbf24' : '#555', fontWeight: 'bold' }}>{i + 1}.</span>
                      <span style={{ fontWeight: i === 0 ? 'bold' : 'normal' }}>{driver.name}</span>
                    </div>
                    <span style={{ fontWeight: 'bold' }}>{driver.points} <span style={{ fontSize: '0.7rem', color: '#555' }}>b.</span></span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

      </div>
    </div>
  );
}
