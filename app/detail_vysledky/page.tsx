import { createClient } from '@supabase/supabase-js';
import { THEME } from '@/lib/theme';
import Link from 'next/link';

export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Pomocná funkce pro formátování času kvalifikace mm:ss.xxx
const formatInterval = (interval: string | null) => {
  if (!interval) return '--:--.---';
  const parts = interval.split(':');
  if (parts.length < 3) return interval;
  const minutes = parts[1];
  const secondsWithMs = parts[2];
  const [seconds, ms] = secondsWithMs.split('.');
  const formattedMs = ms ? ms.substring(0, 3) : '000';
  return `${minutes}:${seconds}.${formattedMs}`;
};

export default async function DetailVysledkyPage({ searchParams }: { searchParams: { id?: string } }) {
  const raceId = searchParams.id ? parseInt(searchParams.id) : null;

  if (!raceId) {
    return (
      <div style={THEME.container}>
        <h1 style={THEME.mainTitle}>Závod nenalezen</h1>
        <Link href="/" style={{ color: '#fbbf24', textDecoration: 'none' }}>← Zpět na úvod</Link>
      </div>
    );
  }

  // 1. Načtení detailů závodu
  const { data: race } = await supabase
    .from('races')
    .select('*')
    .eq('id', raceId)
    .single();

  // 2. Načtení kategorií pro sezónu daného závodu
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('season_id', race?.season_id)
    .order('order_by', { ascending: true });

  // 3. Načtení všech výsledků pro tento závod
  const { data: results } = await supabase
    .from('results')
    .select('*, drivers(full_name)')
    .eq('race_id', raceId)
    .order('total_points', { ascending: false });

  return (
    <div style={THEME.container}>
      {/* Záhlaví stránky s popisem závodu */}
      <div style={{ marginBottom: '50px', textAlign: 'center' }}>
        <h1 style={THEME.mainTitle}>{race?.name || 'Detail závodu'}</h1>
        <p style={{ color: '#888', fontSize: '1.2rem', marginTop: '-20px' }}>
          {race?.race_date ? new Date(race.race_date).toLocaleDateString('cs-CZ') : ''}
          {race?.desc && ` | ${race.desc}`}
        </p>
        <Link href="/" style={{ color: '#fbbf24', textDecoration: 'none', fontSize: '0.9rem' }}>
          ← Zpět na kalendář
        </Link>
      </div>

      {/* Výpisy výsledků po kategoriích */}
      {categories?.map((cat) => {
        const catResults = results?.filter(r => r.category_id === cat.id) || [];
        if (catResults.length === 0) return null;

        return (
          <div key={cat.id} style={{ marginBottom: '60px' }}>
            <h2 style={{ ...THEME.categoryTitle, borderLeft: '4px solid #fbbf24', paddingLeft: '15px' }}>
              🏆 {cat.name}
            </h2>
            
            <div style={THEME.tableContainer}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #333', background: 'rgba(255,255,255,0.03)' }}>
                    <th style={{ ...THEME.th, width: '50px' }}>#</th>
                    <th style={{ ...THEME.th, textAlign: 'left' }}>Jezdec</th>
                    <th style={{ ...THEME.th, textAlign: 'center' }}>Kvalifikace</th>
                    <th style={{ ...THEME.th, textAlign: 'center' }}>PP</th>
                    <th style={{ ...THEME.th, textAlign: 'center' }}>1. jízda</th>
                    <th style={{ ...THEME.th, textAlign: 'center' }}>2. jízda</th>
                    <th style={{ ...THEME.th, textAlign: 'right', color: '#fbbf24' }}>Body celkem</th>
                  </tr>
                </thead>
                <tbody>
                  {catResults.map((res, idx) => (
                    <tr key={res.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ ...THEME.td, fontWeight: '800', color: idx === 0 ? '#fbbf24' : '#666' }}>
                        {idx + 1}.
                      </td>
                      <td style={{ ...THEME.td, fontWeight: '700', color: '#fff' }}>
                        {res.drivers?.full_name}
                      </td>
                      <td style={{ ...THEME.td, textAlign: 'center', fontFamily: 'monospace', color: '#aaa' }}>
                        {formatInterval(res.qualy_time)}
                      </td>
                      <td style={{ ...THEME.td, textAlign: 'center' }}>
                        {res.pole_position ? <span title="Pole Position" style={{ color: '#fbbf24' }}>🥇</span> : '-'}
                      </td>
                      <td style={{ ...THEME.td, textAlign: 'center' }}>
                        {res.pos_race_1}. místo
                      </td>
                      <td style={{ ...THEME.td, textAlign: 'center' }}>
                        {res.pos_race_2}. místo
                      </td>
                      <td style={{ ...THEME.td, textAlign: 'right', fontWeight: '900', color: '#fbbf24', fontSize: '1.2rem' }}>
                        {(res.total_points || 0) + (res.extra_point || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {/* Pokud pro závod nejsou žádná data */}
      {(!results || results.length === 0) && (
        <div style={{ textAlign: 'center', padding: '100px', color: '#444' }}>
          <h3>Výsledky tohoto závodu zatím nebyly nahrány.</h3>
        </div>
      )}
    </div>
  );
}
