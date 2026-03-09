import { createClient } from '@supabase/supabase-js';
import { THEME } from '@/lib/theme'; 
import Link from 'next/link';

export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function HomePage() {
  // Dynamické zjištění nejnovějšího roku
  const { data: latestSeason } = await supabase
    .from('races')
    .select('season_id')
    .order('season_id', { ascending: false })
    .limit(1);

  const currentYear = latestSeason?.[0]?.season_id || new Date().getFullYear();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Načtení dat včetně sloupců time a desc
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

  const czechDays = ['NE', 'PO', 'ÚT', 'ST', 'ČT', 'PÁ', 'SO'];

  return (
    <div style={THEME.container}>
      {/* Mřížka v poměru 70% / 30% */}
      <div style={twoColumnGridStyle}>
        
        {/* LEVÝ SLOUPY (70%): Kalendář závodů */}
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
                  const dayName = czechDays[rDate.getDay()];
                  const dateStr = rDate.toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
                  const timeStr = race.time ? race.time.substring(0, 5) : '08:30';

                  return (
                    <tr key={race.id} style={{ borderBottom: idx === (races.length - 1) ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
                      {/* Datum a čas v jednom bloku s nowrap */}
                      <td style={{ ...THEME.td, padding: '20px', width: '220px', whiteSpace: 'nowrap' }}>
                        <span style={{ color: '#fbbf24', fontWeight: '600', fontSize: '1.05rem', marginRight: '50px' }}>
                           {dateStr} - {dayName}
                        </span>
                        <span style={{ fontSize: '0.85rem', color: '#888', fontWeight: '500' }}>
                          🕗 {timeStr}
                        </span>
                      </td>

                      {/* Název a popis */}
                      <td style={{ ...THEME.td, padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'nowrap' }}>                          
                          
                          {/* Popis závodu na stejném řádku, pokud se vejde */}
                          {race.desc && (
                            <div style={{ fontSize: '0.85rem', color: '#aaa', fontWeight: '400', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {isPast ? (
                              <Link href={`/detail_vysledky?id=${race.id}`} style={{ color: '#fff', textDecoration: 'none' }}>
                                {race.name} <span style={{ color: '#fbbf24' }}>→ Zobraz výsledky</span>
                              </Link>
                              ) : (
                              <span style={{ color: '#fff' }}>{race.name}</span>
                            )}                              
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* PRAVÝ SLOUPY (30%): Průběžné pořadí */}
        <section>
          <h2 style={{ ...THEME.mainTitle, textAlign: 'left', fontSize: '2rem' }}>
            Pořadí
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
              <div key={cat.id} style={{ marginBottom: '25px' }}>
                <h3 style={{ ...THEME.categoryTitle, fontSize: '1.1rem', marginBottom: '10px' }}>🏆 {cat.name}</h3>
                <div style={THEME.tableContainer}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      {top3.map(([name, total]: any, idx) => (
                        <tr key={name} style={{ borderBottom: idx === 2 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ ...THEME.td, padding: '10px 15px', width: '30px', fontWeight: '800', color: idx === 0 ? '#fbbf24' : '#888', fontSize: '0.9rem' }}>{idx + 1}.</td>
                          <td style={{ ...THEME.td, padding: '10px 15px', fontWeight: '700', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</td>
                          <td style={{ ...THEME.td, padding: '10px 15px', textAlign: 'right', fontWeight: '900', color: '#fbbf24', fontSize: '0.9rem' }}>{total}</td>
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

// DEFINICE POMĚRU 60/40
const twoColumnGridStyle: any = { 
  display: 'grid', 
  gridTemplateColumns: '6fr 4fr', 
  gap: '20px',
  alignItems: 'start'
};
