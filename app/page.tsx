import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function HomePage() {
  // 1. Zjistíme aktuální sezónu (rok) - v tomto případě 2026
  const currentYear = 2026;

  // 2. Načtení závodů pro aktuální sezónu
  const { data: races } = await supabase
    .from('races')
    .select('*')
    .eq('season_id', currentYear)
    .order('race_date', { ascending: true });

  // 3. Načtení kategorií pro tuto sezónu
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('season_id', currentYear)
    .order('order_by', { ascending: true }); // TADY JE ZMĚNA

  // 4. Načtení výsledků pro výpočet TOP 3 (přes JOIN na races kvůli sezóně)
  const { data: allResults } = await supabase
    .from('results')
    .select(`
      total_points,
      category_id,
      drivers (full_name, start_number),
      races!inner (season_id)
    `)
    .eq('races.season_id', currentYear);

  // --- Logika pro seskupení TOP 3 podle kategorií ---
  const standingsByCategory = categories?.map(cat => {
    const catResults = allResults?.filter(r => r.category_id === cat.id) || [];
    
    // Seskupení bodů podle jezdců
    const driverPoints: any = {};
    catResults.forEach((res: any) => {
      const name = res.drivers?.full_name || 'Neznámý';
      if (!driverPoints[name]) {
        driverPoints[name] = { name, points: 0, number: res.drivers?.start_number };
      }
      driverPoints[name].points += (res.total_points || 0);
    });

    // Seřazení a výběr TOP 3
    const top3 = Object.values(driverPoints)
      .sort((a: any, b: any) => b.points - a.points)
      .slice(0, 3);

    return { ...cat, top3 };
  }) || [];

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', color: '#fff', padding: '20px' }}>
      
      {/* HEADER SEZÓNY */}
      <section style={{ textAlign: 'center', marginBottom: '60px', padding: '40px', background: '#111', borderRadius: '20px', border: '1px solid #fbbf24' }}>
        <h1 style={{ fontSize: '3.5rem', color: '#fbbf24', margin: 0 }}>{currentYear}</h1>
        <p style={{ fontSize: '1.2rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '2px' }}>Aktuální sezóna</p>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
        
        {/* LEVÝ SLOUPEC: KALENDÁŘ ZÁVODŮ */}
        <section>
          <h2 style={{ borderLeft: '4px solid #fbbf24', paddingLeft: '15px', marginBottom: '25px' }}>📅 Kalendář závodů</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {races && races.length > 0 ? races.map(race => (
              <div key={race.id} style={{ background: '#111', padding: '20px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #222' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{race.name}</div>
                  <div style={{ color: '#666', fontSize: '0.9rem' }}>ID: {race.id}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#fbbf24', fontWeight: 'bold' }}>
                    {new Date(race.race_date).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long' })}
                  </div>
                </div>
              </div>
            )) : <p style={{ color: '#666' }}>Žádné závody pro rok {currentYear} nebyly vypsány.</p>}
          </div>
        </section>

        {/* PRAVÝ SLOUPEC: TOP 3 PODLE KATEGORIÍ */}
        <section>
          <h2 style={{ borderLeft: '4px solid #fbbf24', paddingLeft: '15px', marginBottom: '25px' }}>🏆 Průběžné pořadí</h2>
          
          {standingsByCategory.map(cat => (
            <div key={cat.id} style={{ marginBottom: '30px', background: '#111', borderRadius: '10px', overflow: 'hidden', border: '1px solid #333' }}>
              <div style={{ background: '#222', padding: '10px 20px', color: '#fbbf24', fontWeight: 'bold', fontSize: '0.9rem', textTransform: 'uppercase' }}>
                {cat.name} ({cat.id})
              </div>
              <div style={{ padding: '10px' }}>
                {cat.top3.length > 0 ? (cat.top3 as any[]).map((driver, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: i < 2 ? '1px solid #222' : 'none', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <span style={{ color: i === 0 ? '#fbbf24' : '#666', fontWeight: 'bold', fontSize: '1.2rem' }}>{i + 1}.</span>
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{driver.name}</div>
                        <div style={{ fontSize: '0.7rem', color: '#555' }}>#{driver.number}</div>
                      </div>
                    </div>
                    <div style={{ fontWeight: 'bold', color: '#fbbf24' }}>{driver.points} b.</div>
                  </div>
                )) : <div style={{ padding: '15px', color: '#444', textAlign: 'center' }}>Zatím žádné výsledky</div>}
              </div>
            </div>
          ))}

          <Link href="/vysledky" style={{ display: 'block', textAlign: 'center', padding: '15px', background: '#fbbf24', color: '#000', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', marginTop: '20px' }}>
            Zobrazit kompletní tabulky →
          </Link>
        </section>

      </div>
    </div>
  );
}
