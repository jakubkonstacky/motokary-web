import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function HomePage() {
  // 1. Načteme TOP 3 jezdce pro aktuální rok (2024)
  // Používáme vnější spojení, aby kód nespadl, pokud chybí driver nebo kategorie
  const { data: topResults } = await supabase
    .from('results')
    .select(`
      points, bonus_points,
      drivers (full_name, start_number),
      categories (name)
    `)
    .eq('year', 2024)
    .order('points', { ascending: false })
    .limit(3);

  // 2. Načteme informaci o úplně posledním závodě z tabulky races
  const { data: lastRace } = await supabase
    .from('races')
    .select('*')
    .order('race_date', { ascending: false })
    .limit(1)
    .single();

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', color: '#fff' }}>
      {/* --- HERO SEKCE --- */}
      <section style={{ 
        textAlign: 'center', 
        padding: '60px 20px', 
        background: 'linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.8)), url("https://images.unsplash.com/photo-1596567130024-48540332c63b?q=80&w=2000") center/cover', 
        borderRadius: '15px', 
        marginBottom: '40px',
        border: '1px solid #333'
      }}>
        <h1 style={{ fontSize: '3rem', color: '#fbbf24', marginBottom: '10px' }}>🏎️ Motokáry Konstacký</h1>
        <p style={{ fontSize: '1.2rem', color: '#ccc' }}>Výsledky a statistiky našeho týmu na jednom místě.</p>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
        
        {/* --- TOP 3 JEZDCI --- */}
        <section style={{ background: '#111', padding: '25px', borderRadius: '12px', border: '1px solid #333' }}>
          <h2 style={{ color: '#fbbf24', marginTop: 0 }}>🏆 TOP 3 Sezóny (2024)</h2>
          <div style={{ marginTop: '20px' }}>
            {topResults && topResults.length > 0 ? topResults.map((res: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < 2 ? '1px solid #222' : 'none' }}>
                <span>
                  {/* Použití ?. zajišťuje, že pokud drivers chybí, web nespadne */}
                  <strong style={{ color: i === 0 ? '#fbbf24' : '#fff' }}>
                    {i + 1}. {res.drivers?.full_name || 'Neznámý jezdec'}
                  </strong>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>{res.categories?.name || 'Bez kategorie'}</div>
                </span>
                <span style={{ fontWeight: 'bold' }}>{Number(res.points || 0) + Number(res.bonus_points || 0)} b.</span>
              </div>
            )) : <p style={{ color: '#666' }}>Zatím žádná data pro tento rok.</p>}
          </div>
          <Link href="/vysledky" style={{ display: 'block', textAlign: 'center', marginTop: '20px', color: '#fbbf24', textDecoration: 'none' }}>
            Kompletní tabulka →
          </Link>
        </section>

        {/* --- POSLEDNÍ ZÁVOD (DYNAMICKÝ) --- */}
        <section style={{ background: '#111', padding: '25px', borderRadius: '12px', border: '1px solid #333', textAlign: 'center' }}>
          <h3 style={{ color: '#888', textTransform: 'uppercase', fontSize: '0.8rem' }}>Poslední odjetý závod</h3>
          {lastRace ? (
            <>
              <h2 style={{ fontSize: '1.8rem', margin: '15px 0', color: '#fff' }}>🏁 {lastRace.name}</h2>
              <p style={{ color: '#aaa' }}>Datum: {new Date(lastRace.race_date).toLocaleDateString('cs-CZ')}</p>
              <Link href="/galerie" style={{ display: 'inline-block', marginTop: '20px', color: '#fbbf24' }}>
                Prohlédnout fotogalerii
              </Link>
            </>
          ) : (
            <p style={{ color: '#666', marginTop: '20px' }}>Žádný závod nebyl nalezen.</p>
          )}
        </section>

      </div>
    </div>
  )
}
