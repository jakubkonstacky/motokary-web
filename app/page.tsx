import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

// Inicializace Supabase klienta (Server-side)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function HomePage() {
  const currentYear = new Date().getFullYear();

  // 1. Načtení závodů pro aktuální rok
  const { data: races } = await supabase
    .from('races')
    .select('*')
    .eq('season_id', currentYear)
    .order('id', { ascending: true });

  // 2. Načtení kategorií pro aktuální rok (abychom věděli, co ukázat v náhledu)
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('season_id', currentYear)
    .order('order_by', { ascending: true })
    .limit(1);

  const mainCategory = categories?.[0];

  // 3. Načtení výsledků (Top 3) pro první kategorii
  let topDrivers: any[] = [];
  if (mainCategory) {
    const { data: results } = await supabase
      .from('results')
      .select('total_points, drivers(full_name, start_number)')
      .eq('category_id', mainCategory.id);

    // Agregace bodů pro náhled TOP 3
    const grouped: any = {};
    results?.forEach((r: any) => {
      const name = r.drivers.full_name;
      if (!grouped[name]) {
        grouped[name] = { name, points: 0, number: r.drivers.start_number };
      }
      grouped[name].points += r.total_points;
    });

    topDrivers = Object.values(grouped)
      .sort((a: any, b: any) => b.points - a.points)
      .slice(0, 3);
  }

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto', color: '#fff', fontFamily: 'sans-serif' }}>
      
      {/* HLAVNÍ HEADER STRÁNKY */}
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h1 style={{ fontSize: '3rem', color: '#fbbf24', marginBottom: '10px' }}>Motokáry Konstacký</h1>
        <p style={{ color: '#666', textTransform: 'uppercase', letterSpacing: '3px' }}>Oficiální výsledky sezóny {currentYear}</p>
      </div>

      {/* GRID LAYOUT: KALENDÁŘ | POŘADÍ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '50px', alignItems: 'start' }}>
        
        {/* LEVÝ SLOUPY: KALENDÁŘ */}
        <section>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.6rem', marginBottom: '25px', fontWeight: 'bold' }}>
            <span>📅</span> Kalendář závodů
          </h2>
          
          <div style={{ background: '#111', borderRadius: '15px', border: '1px solid #222', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #222', color: '#444', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '15px 20px', textAlign: 'left', fontWeight: 'normal' }}>Datum</th>
                  <th style={{ padding: '15px 20px', textAlign: 'left', fontWeight: 'normal' }}>Závod</th>
                  <th style={{ padding: '15px 20px', textAlign: 'right', fontWeight: 'normal' }}>ID</th>
                </tr>
              </thead>
              <tbody>
                {races && races.length > 0 ? races.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                    <td style={{ padding: '18px 20px', color: '#fbbf24', fontWeight: 'bold' }}>
                      {new Date(r.race_date).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' })}.
                    </td>
                    <td style={{ padding: '18px 20px', fontWeight: '500' }}>{r.name}</td>
                    <td style={{ padding: '18px 20px', textAlign: 'right', color: '#333', fontSize: '0.8rem' }}>{r.id}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={3} style={{ padding: '40px', textAlign: 'center', color: '#444' }}>Sezóna se připravuje...</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* PRAVÝ SLOUPY: PRŮBĚŽNÉ POŘADÍ */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '25px' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.6rem', margin: 0, fontWeight: 'bold' }}>
              <span>🏆</span> Průběžné pořadí
            </h2>
            <Link href="/vysledky" style={{ color: '#fbbf24', fontSize: '0.9rem', textDecoration: 'none', borderBottom: '1px solid transparent', transition: '0.2s' }}>
              Všechny tabulky →
            </Link>
          </div>

          <div style={{ background: '#111', borderRadius: '15px', border: '1px solid #222', overflow: 'hidden' }}>
            <div style={{ padding: '15px 20px', background: '#1a1a1a', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#fbbf24', fontWeight: 'bold', fontSize: '0.9rem' }}>{mainCategory?.name || 'Šampionát'}</span>
              <span style={{ color: '#444', fontSize: '0.75rem' }}>{mainCategory?.id}</span>
            </div>

            <div style={{ padding: '10px 0' }}>
              {topDrivers.length > 0 ? topDrivers.map((d, idx) => (
                <div key={idx} style={{ 
                  display: 'flex', alignItems: 'center', padding: '15px 20px', 
                  borderBottom: idx === topDrivers.length - 1 ? 'none' : '1px solid #1a1a1a' 
                }}>
                  <span style={{ 
                    width: '30px', fontWeight: 'bold', fontSize: '1.2rem',
                    color: idx === 0 ? '#fbbf24' : idx === 1 ? '#94a3b8' : '#92400e' 
                  }}>
                    {idx + 1}.
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold' }}>{d.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#444' }}>#{d.number}</div>
                  </div>
                  <div style={{ fontWeight: 'bold', color: '#fbbf24', fontSize: '1.1rem' }}>{d.points} <span style={{ fontSize: '0.7rem', color: '#444' }}>b.</span></div>
                </div>
              )) : (
                <div style={{ padding: '40px', textAlign: 'center', color: '#444' }}>Zatím neodjet žádný závod.</div>
              )}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
