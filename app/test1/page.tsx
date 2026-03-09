import { createClient } from '@supabase/supabase-js';
import { THEME } from '@/lib/theme'; 
import Link from 'next/link';

export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function HomePage() {
  // 1. Dynamické zjištění nejnovějšího roku
  const { data: latestSeason } = await supabase
    .from('races')
    .select('season_id')
    .order('season_id', { ascending: false })
    .limit(1);

  const currentYear = latestSeason?.[0]?.season_id || new Date().getFullYear();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 2. Načtení dat včetně nových sloupců
  const { data: races } = await supabase.from('races')
    .select('*')
    .eq('season_id', currentYear)
    .order('race_date', { ascending: true });

  const { data: categories } = await supabase.from('categories')
    .select('*')
    .eq('season_id', currentYear)
    .order('order_by', { ascending: true });

  const { data: resultsData } = await supabase.from('results')
    .select('*, drivers(full_name)');

  // Pomocné pole pro české dny v týdnu
  const czechDays = ['NE', 'PO', 'ÚT', 'ST', 'ČT', 'PÁ', 'SO'];

  return (
    <div style={THEME.container}>
      <div style={twoColumnGridStyle}>
        
        {/* LEVÝ SLOUPY: Rozšířený Kalendář závodů */}
        <section>
          <h2 style={{ ...THEME.mainTitle, textAlign: 'left', fontSize: '2rem' }}>
            Kalendář závodů {currentYear}
          </h2>
          
          <div style={THEME.tableContainer}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {races?.map((race, idx) => {
                  const rDate = new Date(race.race_date);
                  const isPast = rDate < today;
                  
                  // Formátování: PO 26.04.2026
                  const dayName = czechDays[rDate.getDay()];
                  const dateStr = rDate.toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
                  
                  // Oříznutí času z formatu HH:mm:ss na HH:mm
                  const timeStr = race.time ? race.time.substring(0, 5) : '08:30';

                  return (
                    <tr key={race.id} style={{ borderBottom: idx === (races.length - 1) ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
                      {/* Sloupec s datem a časem */}
                      <td style={{ ...THEME.td, padding: '20px', width: '180px', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                        <div style={{ color: '#fbbf24', fontWeight: '800', fontSize: '1.05rem' }}>
                          {dayName} {dateStr}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          🕗 {timeStr}
                        </div>
                      </td>

                      {/* Sloupec s názvem a popisem */}
                      <td style={{ ...THEME.td, padding: '20px', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>
                          {isPast ? (
                            <Link href={`/detail_vysledky?id=${race.id}`} style={{ color: '#fff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {race.name} <span style={{ color: '#fbbf24' }}>→</span>
                            </Link>
                          ) : (
                            <span style={{ color: '#fff' }}>{race.name}</span>
                          )}
                        </div>
                        
                        {/* Zobrazení popisu závodu (sloupec desc) */}
                        {race.desc && (
                          <div style={{ fontSize: '0.85rem', color: '#aaa', marginTop: '8px', fontWeight: '400', lineHeight: '1.4' }}>
                            {race.desc}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* PRAVÝ SLOUPY: Průběžné pořadí (zůstává TOP 3) */}
        <section>
          <h2 style={{ ...THEME.mainTitle, textAlign: 'left', fontSize: '2rem' }}>
            Průběžné pořadí
          </h2>
          {categories?.map((cat) => {
            const driverTotals: any = {};
            resultsData?.filter(r => r.category_id === cat.id).forEach(r => {
              const name = r.drivers?.full_name;
              if (name) driverTotals[name] = (driverTotals[name] || 0) + (r.total_points || 0) + (r.extra_point || 0);
            });

            const top3 = Object.entries(driverTotals).sort(([, a]: any, [, b]: any) => b - a).slice(0, 3);
            if (top3.length === 0) return null;

            return (
              <div key={cat.id} style={{ marginBottom: '30px' }}>
                <h3 style={{ ...THEME.categoryTitle, fontSize: '1.3rem', marginBottom: '15px' }}>🏆 {cat.name}</h3>
                <div style={THEME.tableContainer}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      {top3.map(([name, total]: any, idx) => (
                        <tr key={name} style={{ borderBottom: idx === 2 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ ...THEME.td, padding: '12px 20px', width: '40px', fontWeight: '800', color: idx === 0 ? '#fbbf24' : '#888' }}>{idx + 1}.</td>
                          <td style={{ ...THEME.td, padding: '12px 20px', fontWeight: '700' }}>{name}</td>
                          <td style={{ ...THEME.td, padding: '12px 20px', textAlign: 'right', fontWeight: '900', color: '#fbbf24' }}>{total} b.</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
}

const twoColumnGridStyle: any = { 
  display: 'grid', 
  gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', 
  gap: '50px',
  alignItems: 'start'
};
