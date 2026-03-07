import { createClient } from '@supabase/supabase-js'

// Teď už tu nejsou žádná hesla, kód si je vezme z nastavení Vercelu
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function Page() {
  const { data: results } = await supabase
    .from('results')
    .select(`
      position,
      points,
      bonus_points,
      drivers (full_name, start_number)
    `)
    .order('position', { ascending: true });

  return (
    <div style={{ padding: '20px', background: '#000', color: '#fff', minHeight: '100vh' }}>
      <h1>🏁 Výsledky online</h1>
      {results?.map((r: any, i: number) => (
        <div key={i}>{r.position}. {r.drivers?.full_name} - {Number(r.points) + Number(r.bonus_points)}b</div>
      ))}
    </div>
  )
}
