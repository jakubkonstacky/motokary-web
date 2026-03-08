import { createClient } from '@supabase/supabase-js';

export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function VysledkyPage() {
  const currentYear = new Date().getFullYear();

  const { data: categories } = await supabase.from('categories').select('*').eq('season_id', currentYear).order('order_by', { ascending: true });
  const { data: races } = await supabase.from('races').select('*').eq('season_id', currentYear).order('id', { ascending: true });
  const { data: resultsData } = await supabase.from('results').select('*, drivers(full_name)');

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 20px', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: '900', textTransform: 'uppercase', marginBottom: '40px', textAlign: 'center' }}>
        Kompletní výsledky sezóny {currentYear}
      </h1>

      {categories?.map((cat) => {
        const catResults = resultsData?.filter(r => r.category_id === cat.id) || [];
        
        const driverStats: any = {};
        catResults.forEach(r => {
          const name = r.drivers.full_name;
          if (!driverStats[name]) {
            driverStats[name] = {
              name,
              raceData: {}, // uložení kompletních dat pro každý závod
              total: 0
            };
          }
          
          // Výpočet bodů pro daný závod (Body + Extra za Pole Position)
          const totalPointsInRace = (r.total_points || 0) + (r.extra_point || 0);
          
          driverStats[name].raceData[r.race_id] = {
            points: totalPointsInRace,
            p1: r.pos_race_1,
            p2: r.pos_race_2
          };
          
          driverStats[name].total += totalPointsInRace;
        });

        const sortedDrivers = Object.values(driverStats).sort((a: any, b: any) => b.total - a.total);
        if (sortedDrivers.length === 0) return null;

        return (
          <div key={cat.id} style={{ marginBottom: '60px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#fbbf24', marginBottom: '20px', textTransform: 'uppercase' }}>
              🏆 {cat.name}
            </h2>
            
            <div style={tableContainerStyle}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #333', background: 'rgba(255,255,255,0.03)' }}>
                    <th style={thStyle}>#</th>
                    <th style={thStyle}>Jezdec</th>
                    {races?.map((r, index) => (
                      <th key={r.id} style={{ ...thStyle, textAlign: 'center' }}>
                        {index + 1}. závod
                      </th>
                    ))}
                    <th style={{ ...thStyle, color: '#fbbf24', textAlign: 'right' }}>CELKEM</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedDrivers.map((d: any, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={tdStyle}>{idx + 1}.</td>
                      <td style={{ ...tdStyle, fontWeight: '700' }}>{d.name}</td>
                      {races?.map(r => {
                        const raceInfo = d.raceData[r.id];
                        return (
                          <td key={r.id} style={{ ...tdStyle, textAlign: 'center' }}>
                            {raceInfo ? (
                              <div>
                                <div style={{ fontWeight: '800', fontSize: '1.1rem' }}>{raceInfo.points}</div>
                                {/* PODMÍNĚNÉ ZOBRAZENÍ POZIC */}
                                {r.show_race_position && (
                                  <div style={{ fontSize: '0.7rem', color: '#888', marginTop: '4px' }}>
                                    {raceInfo.p1}. / {raceInfo.p2}. jízda
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span style={{ opacity: 0.1 }}>0</span>
                            )}
                          </td>
                        );
                      })}
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: '900', color: '#fbbf24', fontSize: '1.2rem' }}>
                        {d.total}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const tableContainerStyle: any = {
  background: 'rgba(12, 12, 12, 0.8)',
  backdropFilter: 'blur(15px)',
  borderRadius: '24px',
  border: '1px solid rgba(255,255,255,0.1)',
  overflowX: 'auto'
};

const thStyle: any = { padding: '20px', fontSize: '0.75rem', fontWeight: '900', textTransform: 'uppercase', color: '#666', letterSpacing: '1px' };
const tdStyle: any = { padding: '20px', fontSize: '1rem' };
