import { createClient } from '@supabase/supabase-js';
import { THEME } from '@/lib/theme'; // Import centrálních stylů

export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function HomePage() {
  const currentYear = 2026;

  // Načtení dat ze Supabase
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

  return (
    <div style={THEME.container}>
      
      {/* Dvou sloupcový layout */}
      <div style={twoColumnGridStyle}>
        
        {/* LEVÝ SLOUPY: Kalendář závodů */}
        <section>
          <h2 style={{ ...THEME.mainTitle, textAlign: 'left', fontSize: '2rem' }}>
            Kalendář závodů {currentYear}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {races?.map((race) => (
              <div key={race.id} style={THEME.tableContainer}>
                <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ color: '#fbbf24', fontWeight: '800', fontSize: '1.1rem' }}>
                      {new Date(race.race_date).toLocaleDateString('cs-CZ')}
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: '700', marginTop: '3px' }}>
                      {race.name}
                    </div>
                  </div>
                  <div style={{ opacity: 0.3, fontWeight: '900', fontSize: '1.2rem' }}>
                    🚩
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* PRAVÝ SLOUPY: Průběžné pořadí (TOP 3) */}
        <section>
          <h2 style={{ ...THEME.mainTitle, textAlign: 'left', fontSize: '2rem' }}>
            Průběžné pořadí
          </h2>
          {categories?.map((cat) => {
            const catResults = resultsData?.filter(r => r.category_id === cat.id) || [];
            const driverTotals: any = {};

            catResults.forEach(r => {
              const name = r.drivers?.full_name;
              if (name) {
                // Sčítání základních a extra bodů
                driverTotals[name] = (driverTotals[name] || 0) + (r.total_points || 0) + (r.extra_point || 0);
              }
            });

            // Seřazení a výběr pouze TOP 3 jezdců
            const top3 = Object.entries(driverTotals)
              .sort(([, a]: any, [, b]: any) => b - a)
              .slice(0, 3);

            if (top3.length === 0) return null;

            return (
              <div key={cat.id} style={{ marginBottom: '30px' }}>
                <h3 style={{ ...THEME.categoryTitle, fontSize: '1.3rem', marginBottom: '15px' }}>
                  🏆 {cat.name}
                </h3>
                <div style={THEME.tableContainer}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      {top3.map(([name, total]: any, idx) => (
                        <tr key={name} style={{ borderBottom: idx === 2 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ ...THEME.td, padding: '12px 20px', width: '40px', fontWeight: '800', color: idx === 0 ? '#fbbf24' : '#888' }}>
                            {idx + 1}.
                          </td>
                          <td style={{ ...THEME.td, padding: '12px 20px', fontWeight: '700' }}>
                            {name}
                          </td>
                          <td style={{ ...THEME.td, padding: '12px 20px', textAlign: 'right', fontWeight: '900', color: '#fbbf24' }}>
                            {total} b.
                          </td>
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

// Styl pro dvou sloupcové rozvržení
const twoColumnGridStyle: any = { 
  display: 'grid', 
  gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', 
  gap: '50px',
  alignItems: 'start'
};
