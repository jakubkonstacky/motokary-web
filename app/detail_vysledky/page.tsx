import { createClient } from '@supabase/supabase-js';
import { THEME } from '@/lib/theme';
import Link from 'next/link';

export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
        <Link href="/" style={{ color: '#fbbf24' }}>← Zpět na úvod</Link>
      </div>
    );
  }

  // 1. Načtení detailů aktuálního závodu
  const { data: race } = await supabase.from('races').select('*').eq('id', raceId).single();

  if (!race) return <div style={THEME.container}>Závod neexistuje.</div>;

  // 2. Načtení PŘEDCHOZÍHO a NÁSLEDUJÍCÍHO závodu ve stejné sezóně
  const { data: prevRace } = await supabase
    .from('races')
    .select('id, name')
    .eq('season_id', race.season_id)
    .lt('id', raceId)
    .order('id', { ascending: false })
    .limit(1)
    .single();

  const { data: nextRace } = await supabase
    .from('races')
    .select('id, name')
    .eq('season_id', race.season_id)
    .gt('id', raceId)
    .order('id', { ascending: true })
    .limit(1)
    .single();

  // 3. Načtení kategorií a výsledků
  const { data: categories } = await supabase.from('categories').select('*').eq('season_id', race.season_id).order('order_by', { ascending: true });
  const { data: results } = await supabase.from('results').select('*, drivers(full_name)').eq('race_id', raceId).order('total_points', { ascending: false });

  return (
    <div style={THEME.container}>
      
      {/* NAVIGACE MEZI ZÁVODY */}
      <div style={raceNavStyle}>
        {prevRace ? (
          <Link href={`/detail_vysledky?id=${prevRace.id}`} style={navLinkStyle}>
            ← Předchozí: {prevRace.name}
          </Link>
        ) : <div />}

        {nextRace ? (
          <Link href={`/detail_vysledky?id=${nextRace.id}`} style={navLinkStyle}>
            Následující: {nextRace.name} →
          </Link>
        ) : <div />}
      </div>

      {/* HLAVNÍ INFO O ZÁVODU */}
      <div style={{ marginBottom: '40px', textAlign: 'center' }}>
        <h1 style={{ ...THEME.mainTitle, marginBottom: '10px' }}>{race.name}</h1>
        <div style={{ color: '#fbbf24', fontWeight: 'bold', fontSize: '1.1rem' }}>
          {new Date(race.race_date).toLocaleDateString('cs-CZ')}
        </div>
        {race.desc && <div style={{ color: '#888', marginTop: '10px' }}>{race.desc}</div>}
      </div>

      {/* VÝSLEDKY PO KATEGORIÍCH */}
      {categories?.map((cat) => {
        const catResults = results?.filter(r => r.category_id === cat.id) || [];
        if (catResults.length === 0) return null;

        return (
          <div key={cat.id} style={{ marginBottom: '50px' }}>
            <h2 style={{ ...THEME.categoryTitle, background: 'rgba(251,191,36,0.1)', padding: '10px 20px', borderRadius: '8px' }}>
              🏆 {cat.name}
            </h2>
            <div style={THEME.tableContainer}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #333' }}>
                    <th style={{ ...THEME.th, width: '50px' }}>#</th>
                    <th style={{ ...THEME.th, textAlign: 'left' }}>Jezdec</th>
                    <th style={THEME.th}>Kvalifikace</th>
                    <th style={THEME.th}>PP</th>
                    <th style={THEME.th}>Jízdy (1./2.)</th>
                    <th style={{ ...THEME.th, textAlign: 'right', color: '#fbbf24' }}>Body</th>
                  </tr>
                </thead>
                <tbody>
                  {catResults.map((res, idx) => (
                    <tr key={res.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ ...THEME.td, fontWeight: '800', color: idx < 3 ? '#fbbf24' : '#666' }}>{idx + 1}.</td>
                      <td style={{ ...THEME.td, fontWeight: '700' }}>{res.drivers?.full_name}</td>
                      <td style={{ ...THEME.td, textAlign: 'center', color: '#aaa' }}>{formatInterval(res.qualy_time)}</td>
                      <td style={{ ...THEME.td, textAlign: 'center' }}>{res.pole_position ? '🥇' : '-'}</td>
                      <td style={{ ...THEME.td, textAlign: 'center' }}>{res.pos_race_1}. / {res.pos_race_2}.</td>
                      <td style={{ ...THEME.td, textAlign: 'right', fontWeight: '900', color: '#fbbf24', fontSize: '1.1rem' }}>
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

      <div style={{ textAlign: 'center', marginTop: '40px' }}>
        <Link href="/" style={{ color: '#888', textDecoration: 'none' }}>← Zpět na kompletní kalendář</Link>
      </div>
    </div>
  );
}

// --- STYLY PRO NAVIGACI ---
const raceNavStyle: any = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '30px',
  padding: '15px 0',
  borderBottom: '1px solid rgba(255,255,255,0.05)'
};

const navLinkStyle: any = {
  color: '#fbbf24',
  textDecoration: 'none',
  fontSize: '0.9rem',
  fontWeight: '600',
  background: 'rgba(251,191,36,0.05)',
  padding: '8px 16px',
  borderRadius: '20px',
  transition: 'all 0.2s'
};
