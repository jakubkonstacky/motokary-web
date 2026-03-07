import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function HomePage() {
  // Načteme TOP 3 jezdce pro aktuální rok (2024)
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

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', color: '#fff' }}>
      {/* --- HERO SEKCE --- */}
      <section style={{ textAlign: 'center', padding: '60px 20px', background: 'linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url("https://images.unsplash.com/photo-1596567130024-48540332c63b?q=80&w=2000") center/cover', borderRadius: '15px', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '3rem', color: '#fbbf24', marginBottom: '10px' }}>🏎️ Motokáry Konstacký</h1>
        <p style={{ fontSize: '1.2rem', color: '#ccc' }}>Oficiální portál výsledků, statistik a fotogalerií z našich závodů.</p>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        {/* --- TOP 3 JEZDCI (Aktuální stav) --- */}
        <section style={{ background: '#111', padding: '25px', borderRadius: '12px', border: '1px solid #333' }}>
          <h2 style={{ color: '#fbbf24', marginTop: 0 }}>🏆 Průběžné TOP 3 (2024)</h2>
          <div style={{ marginTop: '20px' }}>
            {topResults?.map((res: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < 2 ? '1px solid #222' : 'none' }}>
                <span>
                  <strong style={{ color: i === 0 ? '#fbbf24' : '#fff', fontSize: i === 0 ? '1.2rem' : '1rem' }}>{i + 1}. {res.drivers.full_name}</strong>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>{res.categories?.name || 'Kategorie'}</div>
                </span>
                <span style={{ fontWeight: 'bold', alignSelf: 'center' }}>{Number(res.points) + Number(res.bonus_points)} b.</span>
              </div>
            ))}
          </div>
          <Link href="/vysledky" style={{ display: 'block', textAlign: 'center', marginTop: '20px', color: '#fbbf24', textDecoration: 'none', fontSize: '0.9rem' }}>
            Zobrazit kompletní tabulky →
          </Link>
        </section>

        {/* --- POSLEDNÍ ZÁVOD --- */}
        <section style={{ background: '#111', padding: '25px', borderRadius: '12px', border: '1px solid #333', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
          <h3 style={{ color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Poslední závod</h3>
          <h2 style={{ fontSize: '1.8rem', margin: '10px 0' }}>🏁 GP Cheb 2024</h2>
          <p style={{ color: '#aaa' }}>Vítěz závodu:</p>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fbbf24' }}>Michael Rychlý</div>
          <Link href="/galerie" style={{ marginTop: '20px', color: '#fff', textDecoration: 'underline' }}>Prohlédnout fotky ze závodu</Link>
        </section>
      </div>

      {/* --- RYCHLÉ ODKAZY --- */}
      <section style={{ marginTop: '50px', textAlign: 'center', padding: '40px', borderTop: '1px solid #222' }}>
        <h2 style={{ color: '#fbbf24' }}>Chcete s námi závodit?</h2>
        <p>Podívejte se na naše kontakty nebo si přečtěte více o našem týmu.</p>
        <div style={{ marginTop: '20px' }}>
          <Link href="/kontakt" style={{ padding: '12px 25px', background: '#fbbf24', color: '#000', borderRadius: '5px', fontWeight: 'bold', textDecoration: 'none', marginRight: '15px' }}>Kontaktujte nás</Link>
          <Link href="/o-nas" style={{ color: '#fff' }}>Více o nás</Link>
        </div>
      </section>
    </div>
  )
}
