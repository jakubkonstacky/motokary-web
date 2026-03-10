import { createClient } from '@supabase/supabase-js';
import { THEME } from '@/lib/theme';
import Link from 'next/link';

export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Pomocná funkce pro formátování času kvalifikace na mm:ss.xxx
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

export default async function DetailVysledkyPage(props: { 
  searchParams: Promise<{ id?: string }> 
}) {
  const searchParams = await props.searchParams;
  const raceId = searchParams.id ? parseInt(searchParams.id) : null;

  if (!raceId) {
    return (
      <div style={THEME.container}>
        <h1 style={THEME.mainTitle}>Závod nenalezen</h1>
        <Link href="/" style={{ color: '#fbbf24', textDecoration: 'none' }}>← Zpět na kalendář</Link>
      </div>
    );
  }

  // 1. Načtení detailů aktuálního závodu
  const { data: race } = await supabase
    .from('races')
    .select('*')
    .eq('id', raceId)
    .single();

  if (!race) {
    return (
      <div style={THEME.container}>
        <h1 style={THEME.mainTitle}>Závod neexistuje</h1>
        <Link href="/" style={{ color: '#fbbf24', textDecoration: 'none' }}>← Zpět na kalendář</Link>
      </div>
    );
  }

  // 2. Načtení PŘEDCHOZÍHO a NÁSLEDUJÍCÍHO závodu ve stejné sezóně
  const { data: prevRace } = await supabase
    .from('races')
    .select('id')
    .eq('season_id', race.season_id)
    .lt('id', raceId)
    .order('id', { ascending: false })
    .limit(1)
    .single();

  const { data: nextRace } = await supabase
    .from('races')
    .select('id')
    .eq('season_id', race.season_id)
    .gt('id', raceId)
    .order('id', { ascending: true })
    .limit(1)
    .single();

  // 3. Načtení kategorií a výsledků
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('season_id', race.season_id)
    .order('order_by', { ascending: true });

  const { data: results } = await supabase
    .from('results')
    .select('*, drivers(full_name)')
    .eq('race_id', raceId)
    .order('total_points', { ascending: false });

  return (
    <div style={THEME.container}>
      
      {/* HEADER SEKCE */}
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h1 style={{ ...THEME.mainTitle, fontSize: '3.5rem', marginBottom: '10px' }}>
          {race.name}
        </h1>
        
        {/* DATUM - šedá barva */}
        <div style={{ color: '#888', fontSize: '1.2rem', marginBottom: '20px' }}>
          {new Date(race.race_date).toLocaleDateString('cs-CZ')}
        </div>

        {/* NAVIGAČNÍ ODKAZY NA JEDNÉ ÚROVNI */}
        <div style={navRowStyle}>
          <div style={navColStyle}>
            {prevRace && (
              <Link href={`/detail_vysledky?id=${prevRace.id}`} style={navLinkStyle}>
                ← Předchozí
              </Link>
            )}
          </div>

          <div style={navColStyle}>
            <Link href="/" style={navLinkStyle}>
              ← Zpět na kalendář
            </Link>
          </div>

          <div style={navColStyle}>
            {nextRace && (
              <Link href={`/detail_vysledky?id=${nextRace.id}`} style={navLinkStyle}>
                Následující →
              </Link>
            )}
          </div>
        </div>

        {race.desc && (
          <div style={{ color: '#555', marginTop: '25px', fontStyle: 'italic', maxWidth: '600px', margin: '25px auto 0' }}>
            {race.desc}
          </div>
        )}
      </div>

      {/* VÝPISY VÝSLEDKŮ PO KATEGORIÍCH */}
      {categories?.map((cat) => {
        const catResults = results?.filter(r => r.category_id === cat.id) || [];
        if (catResults.length === 0) return null;

        return (
          <div key={cat.id} style={{ marginBottom: '60px' }}>
            <h2 style={{ ...THEME.categoryTitle, borderLeft: '4px solid #fbbf24', paddingLeft: '15px', marginBottom: '20px' }}>
              🏆 {cat.name}
            </h2>
            
            <div style={THEME.tableContainer}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #333', background: 'rgba(255,255,255,0.02)' }}>
                    <th style={{ ...THEME.th, width: '60px' }}>#</th>
                    <th style={{ ...THEME.th, textAlign: 'left' }}>Jezdec</th>
                    <th style={{ ...THEME.th, textAlign: 'center' }}>Kvalifikace</th>
                    <th style={{ ...THEME.th, textAlign: 'center' }}>PP</th>
                    <th style={{ ...THEME.th, textAlign: 'center' }}>1. jízda</th>
                    <th style={{ ...THEME.th, textAlign: 'center' }}>2. jízda</th>
                    <th style={{ ...THEME.th, textAlign: 'right', color: '#fbbf24' }}>Body</th>
                  </tr>
                </thead>
                <tbody>
                  {catResults.map((res, idx) => (
                    <tr key={res.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ ...THEME.td, fontWeight: '800', color: idx < 3 ? '#fbbf24' : '#555' }}>
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
                        {res.pos_race_1 ? `${res.pos_race_1}. místo` : '-'}
                      </td>
                      <td style={{ ...THEME.td, textAlign: 'center' }}>
                        {res.pos_race_2 ? `${res.pos_race_2}. místo` : '-'}
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

      {/* PRÁZDNÝ STAV */}
      {(!results || results.length === 0) && (
        <div style={{ textAlign: 'center', padding: '100px', color: '#444' }}>
          <h3 style={{ fontWeight: '400' }}>Výsledky tohoto závodu zatím nebyly nahrány.</h3>
        </div>
      )}
    </div>
  );
}

// --- STYLY PRO NAVIGACI ---

const navRowStyle: any = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '30px',
  marginTop: '10px'
};

const navColStyle: any = {
  minWidth: '150px',
  display: 'flex',
  justifyContent: 'center'
};

const navLinkStyle: any = {
  color: '#fbbf24',
  textDecoration: 'none',
  fontSize: '0.95rem',
  fontWeight: '600',
  transition: 'opacity 0.2s',
  whiteSpace: 'nowrap'
};
