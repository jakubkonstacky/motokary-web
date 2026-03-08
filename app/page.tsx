import { createClient } from '@supabase/supabase-js';
import { THEME } from '@/lib/theme'; // Import centrálních stylů

export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function HomePage() {
  const currentYear = 2026;

  // Načtení dat pro aktuální rok
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
      
      {/* SEKCE KALENDÁŘ - Nadpis ve stylu galerie, Sentence case */}
      <section style={{ marginBottom: '80px' }}>
        <h2 style={{ ...THEME.mainTitle, textAlign: 'left' }}>
          Kalendář závodů {currentYear}
        </h2>
        <div style={gridStyle}>
          {races?.map((race) => (
            <div key={race.id} style={THEME.tableContainer}>
              <div style={{ padding: '25px' }}>
                <div style={{ color: '#fbbf24', fontWeight: '800', fontSize: '1.2rem' }}>
                  {new Date(race.race_date).toLocaleDateString('cs-CZ')}
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: '700', marginTop: '5px', color: '#fff' }}>
                  {race.name}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SEKCE POŘADÍ - Nadpis ve stylu galerie, Sentence case */}
      <section>
        <h2 style={{ ...THEME.mainTitle, textAlign: 'left' }}>
          Průběžné pořadí
        </h2>
        {categories?.map((cat) => {
          // Výpočet top 5 jezdců pro náhled na hlavní straně
          const catResults = resultsData?.filter(r => r.category_id === cat.id) || [];
          const driverTotals: any = {};

          catResults.forEach(r => {
            const name = r.drivers?.full_name;
            if (name) {
              driverTotals[name] = (driverTotals[name] || 0) + (r.total_points || 0) + (r.extra_point || 0);
            }
          });

          const sorted = Object.entries(driverTotals)
            .sort(([, a]: any, [, b]: any) => b - a)
            .slice(0, 5);

          if (sorted.length === 0) return null;

          return (
            <div key={cat.id} style={{ marginBottom: '40px' }}>
              <h3 style={THEME.categoryTitle}>🏆 {cat.name}</h3>
              <div style={THEME.tableContainer}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {sorted.map(([name, total]: any, idx) => (
                      <tr key={name} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ ...THEME.td, width: '40px', fontWeight: '800', color: '#888' }}>
                          {idx + 1}.
                        </td>
                        <td style={{ ...THEME.td, fontWeight: '700' }}>
                          {name}
                        </td>
                        <td style={{ ...THEME.td, textAlign: 'right', fontWeight: '900', color: '#fbbf24' }}>
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
  );
}

// DOPLŇKOVÉ STYLY PRO MŘÍŽKU (GRID)
const gridStyle: any = { 
  display: 'grid', 
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
  gap: '20px' 
};
