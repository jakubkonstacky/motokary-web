import { createClient } from '@supabase/supabase-client'

// SEM VLOŽ SVOJE ÚDAJE ZE SUPABASE (Settings -> API)
const SUPABASE_URL = 'https://yjpevqwklfehterabrwo.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqcGV2cXdrbGZlaHRlcmFicndvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MDI2MTgsImV4cCI6MjA4ODQ3ODYxOH0.NhqsP1tlia2qj_vEKrLDfpx-wZ72NeHw8uNAAM26kig'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export default async function KartingResults() {
  // Načtení dat z databáze se spojením tabulek
  const { data: results, error } = await supabase
    .from('results')
    .select(`
      position,
      points,
      bonus_points,
      qualifying_time,
      drivers (full_name, start_number),
      categories (name),
      events (name)
    `)
    .order('position', { ascending: true });

  if (error) return <div>Chyba při načítání dat: {error.message}</div>;

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#111', color: '#fff', minHeight: '100vh' }}>
      <h1 style={{ color: '#eab308' }}>🏎️ Výsledky závodů 2001</h1>
      
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px', backgroundColor: '#222' }}>
        <thead>
          <tr style={{ backgroundColor: '#333', textAlign: 'left' }}>
            <th style={{ padding: '12px' }}>Pozice</th>
            <th style={{ padding: '12px' }}>Jezdec</th>
            <th style={{ padding: '12px' }}>Číslo</th>
            <th style={{ padding: '12px' }}>Kategorie</th>
            <th style={{ padding: '12px' }}>Kvalifikace</th>
            <th style={{ padding: '12px' }}>Body</th>
          </tr>
        </thead>
        <tbody>
          {results?.map((res, index) => (
            <tr key={index} style={{ borderBottom: '1px solid #444' }}>
              <td style={{ padding: '12px' }}>{res.position}.</td>
              <td style={{ padding: '12px', fontWeight: 'bold' }}>{res.drivers.full_name}</td>
              <td style={{ padding: '12px' }}>#{res.drivers.start_number}</td>
              <td style={{ padding: '12px' }}>{res.categories.name}</td>
              <td style={{ padding: '12px', color: '#aaa' }}>{res.qualifying_time}</td>
              <td style={{ padding: '12px', color: '#eab308', fontWeight: 'bold' }}>
                {res.points + res.bonus_points} b.
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
