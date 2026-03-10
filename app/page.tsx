import { createClient } from '@supabase/supabase-js';
import { THEME } from '@/lib/theme'; 
import Link from 'next/link';

export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// V Next.js 15 musí být searchParams ošetřeny jako Promise
export default async function HomePage(props: { 
  searchParams: Promise<{ year?: string }> 
}) {
  // 1. POVINNÉ: Awaitnutí parametrů z URL
  const searchParams = await props.searchParams;
  const yearFromUrl = searchParams.year;

  try {
    // 2. Zjištění nejnovější sezóny s kontrolou chyb
    const { data: latestSeasonData, error: seasonError } = await supabase
      .from('races')
      .select('season_id')
      .order('season_id', { ascending: false })
      .limit(1);

    if (seasonError) throw new Error("Nepodařilo se načíst sezóny.");

    // Priorita: 1. Rok z URL, 2. Rok z DB, 3. Aktuální kalendářní rok
    const currentYear = yearFromUrl 
      ? parseInt(yearFromUrl) 
      : (latestSeasonData?.[0]?.season_id || new Date().getFullYear());

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 3. Načtení dat pro vybraný rok
    const [racesRes, catsRes, resultsRes] = await Promise.all([
      supabase.from('races').select('*').eq('season_id', currentYear).order('race_date', { ascending: true }),
      supabase.from('categories').select('*').eq('season_id', currentYear).order('order_by', { ascending: true }),
      supabase.from('results').select('*, drivers(full_name)')
    ]);

    const races = racesRes.data || [];
    const categories = catsRes.data || [];
    const resultsData = resultsRes.data || [];

    const czechDays = ['NE', 'PO', 'ÚT', 'ST', 'ČT', 'PÁ', 'SO'];

    return (
      <div style={THEME.container}>
        <div style={twoColumnGridStyle}>
          
          {/* LEVÝ SLOUPY: Kalendář závodů */}
          <section>
            <h2 style={{ ...THEME.mainTitle, textAlign: 'left', fontSize: '2rem' }}>
              Kalendář závodů {currentYear}
            </h2>
            <div style={THEME.tableContainer}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {races.map((race, idx) => {
                    const rDate = new Date(race.race_date);
                    const isPast = rDate < today;
                    const dayName = czechDays[rDate.getDay()];
                    const dateStr = rDate.toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
                    const timeStr = race.time ? race.time.substring(0, 5) : '08:30';

                    return (
                      <tr key={race.id} style={{ borderBottom: idx === (races.length - 1) ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ ...THEME.td, padding: '15px 20px', width: '220px', whiteSpace: 'nowrap' }}>
                          <span style={{ color: '#fbbf24', fontWeight: '600', fontSize: '1.05rem', marginRight: '15px' }}>
                             {dateStr} - {dayName}
                          </span>
                          <span style={{ fontSize: '0.85rem', color: '#888', fontWeight: '500' }}>
                             🕗 {timeStr}
                          </span>
                        </td>
                        <td style={{ ...THEME.td, padding: '15px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '15px' }}>
                            <div style={{ fontWeight: '800', fontSize: '1.1rem', whiteSpace: 'nowrap' }}>
                              <span style={{ color: '#fff' }}>{race.name}</span>                            
                            </div>
                            <div style={{ fontSize: '0.9rem' }}>
                              {isPast ? (
                                <Link href={`/detail_vysledky?id=${race.id}`} style={{ color: '#fbbf24', textDecoration: 'none', fontWeight: '600' }}>
                                  → Výsledky
                                </Link>
                              ) : race.desc && (
                                <span style={{ color: '#aaa', fontWeight: '400' }}>| {race.desc}</span>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {races.length === 0 && (
                    <tr><td style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Pro tento rok nejsou zadány žádné závody.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* PRAVÝ SLOUPY: Pořadí TOP 3 */}
          <section>
            <h2 style={{ ...THEME.mainTitle, textAlign: 'left', fontSize: '2rem' }}>Průběžné pořadí</h2>
            {categories.map((cat) => {
              const driverTotals: any = {};
              resultsData.filter(r => r.category_id === cat.id).forEach(r => {
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
                            <td style={{ ...THEME.td, padding: '10px 15px', fontWeight: '700', fontSize: '0.9rem' }}>{name}</td>
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
  } catch (error) {
    // Zachycení chyby pro debugování na serveru
    console.error("Kritická chyba na úvodní stránce:", error);
    return <div style={{ color: '#fff', padding: '100px', textAlign: 'center' }}>Omlouváme se, něco se pokazilo při načítání dat.</div>;
  }
}

const twoColumnGridStyle: any = { 
  display: 'grid', 
  gridTemplateColumns: '6fr 4fr', 
  gap: '30px', 
  alignItems: 'start'
};
