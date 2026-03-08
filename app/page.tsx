import { createClient } from '@supabase/supabase-js';

export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function HomePage() {
  const currentYear = 2026;

  // Načtení dat pro rok 2026
  const { data: races } = await supabase.from('races').select('*').eq('season_id', currentYear).order('race_date', { ascending: true });
  const { data: categories } = await supabase.from('categories').select('*').eq('season_id', currentYear).order('order_by', { ascending: true });
  const { data: resultsData } = await supabase.from('results').select('*, drivers(full_name)');

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* SEKCE KALENDÁŘ */}
      <section style={{ marginBottom: '80px' }}>
        <h2 style={sectionTitleStyle}>Kalendář závodů {currentYear}</h2>
        <div style={gridStyle}>
          {races?.map((race) => (
            <div key={race.id} style={cardStyle}>
              <div style={{ color: '#fbbf24', fontWeight: '800', fontSize: '1.2rem' }}>
                {new Date(race.race_date).toLocaleDateString('cs-CZ')}
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: '700', marginTop: '5px' }}>{race.name}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SEKCE POŘADÍ */}
      <section>
        <h2 style={sectionTitleStyle}>Průběžné pořadí</h2>
        {categories?.map((cat) => {
          const catResults = resultsData?.filter(r => r.category_id === cat.id) || [];
          const driverTotals: any = {};

          catResults.forEach(r => {
            const name = r.drivers?.full_name;
            if (name) {
              driverTotals[name] = (driverTotals[name] || 0) + (r.total_points || 0) + (r.extra_point || 0);
            }
          });

          const sorted = Object.entries(driverTotals).sort(([, a]: any, [, b]: any) => b - a).slice(0, 5);

          return (
            <div key={cat.id} style={{ marginBottom: '40px' }}>
              <h3 style={categoryTitleStyle}>🏆 {cat.name}</h3>
              <div style={tableWrapperStyle}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {sorted.map(([name, total]: any, idx) => (
                      <tr key={name} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '12px', width: '40px', fontWeight: '800', color: '#888' }}>{idx + 1}.</td>
                        <td style={{ padding: '12px', fontWeight: '700' }}>{name}</td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: '900', color: '#fbbf24' }}>{total} b.</td>
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

// STYLY KONSTANTY
const sectionTitleStyle: any = {
  fontSize: '2.5rem',
  fontWeight: '800',
  color: '#fbbf24',
  textTransform: 'none',
  marginBottom: '30px',
  fontFamily: 'inherit'
};

const categoryTitleStyle: any = {
  fontSize: '1.5rem',
  fontWeight: '800',
  color: '#fbbf24',
  textTransform: 'none',
  marginBottom: '20px'
};

const gridStyle: any = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' };
const cardStyle: any = { background: 'rgba(255,255,255,0.03)', padding: '25px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' };
const tableWrapperStyle: any = { background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '15px' };
