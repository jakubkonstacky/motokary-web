import { createClient } from '@supabase/supabase-js'

// Vyměň tyto dvě hodnoty za své ze Supabase
const supabase = createClient(
  'https://yjpevqwklfehterabrwo.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqcGV2cXdrbGZlaHRlcmFicndvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MDI2MTgsImV4cCI6MjA4ODQ3ODYxOH0.NhqsP1tlia2qj_vEKrLDfpx-wZ72NeHw8uNAAM26kig' 
)

export default async function Page() {
  const { data: results } = await supabase
    .from('results')
    .select(`
      position,
      points,
      bonus_points,
      drivers (full_name, start_number),
      categories (name)
    `)
    .order('position', { ascending: true });

  return (
    <div style={{ padding: '20px', background: '#000', color: '#fff', minHeight: '100vh' }}>
      <h1>🏎️ Výsledky Motokáry</h1>
      <ul>
        {results?.map((r: any, i: number) => (
          <li key={i}>
            {r.position}. {r.drivers.full_name} (#{r.drivers.start_number}) - {r.points + r.bonus_points}b
          </li>
        ))}
      </ul>
    </div>
  )
}
