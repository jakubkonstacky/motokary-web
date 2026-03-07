'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminPage() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [races, setRaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  // Stavy pro formulář výsledku
  const [selectedRace, setSelectedRace] = useState('');
  const [selectedDriver, setSelectedDriver] = useState('');
  const [pos, setPos] = useState('');
  const [pts, setPts] = useState('');
  const [bonus, setBonus] = useState('');

  // Načtení dat pro selecty
  useEffect(() => {
    async function loadData() {
      const { data: d } = await supabase.from('drivers').select('*').order('full_name');
      const { data: r } = await supabase.from('races').select('*').order('race_date', { ascending: false });
      setDrivers(d || []);
      setRaces(r || []);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleAddResult = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Ukládám...');

    // Zjistíme rok ze zvoleného závodu
    const race = races.find(r => r.id === selectedRace);
    
    const { error } = await supabase.from('results').insert([{
      race_id: selectedRace,
      driver_id: selectedDriver,
      position: parseInt(pos),
      points: parseInt(pts),
      bonus_points: parseInt(bonus) || 0,
      year: race?.year // Automaticky doplníme rok podle závodu
    }]);

    if (error) {
      setStatus('Chyba: ' + error.message);
    } else {
      setStatus('✅ Výsledek úspěšně přidán!');
      setPos(''); setPts(''); setBonus('');
    }
  };

  if (loading) return <div style={{ color: '#fff', textAlign: 'center', padding: '50px' }}>Načítám administraci...</div>;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', color: '#fff', padding: '20px' }}>
      <h1 style={{ color: '#fbbf24', borderBottom: '1px solid #333', paddingBottom: '10px' }}>🛠️ Administrace výsledků</h1>
      
      {status && <div style={{ padding: '15px', background: status.includes('✅') ? '#065f46' : '#991b1b', borderRadius: '5px', marginBottom: '20px' }}>{status}</div>}

      <form onSubmit={handleAddResult} style={{ display: 'flex', flexDirection: 'column', gap: '15px', background: '#111', padding: '25px', borderRadius: '10px', border: '1px solid #333' }}>
        <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Zadat nový výsledek</h2>
        
        <label>Závod:
          <select required value={selectedRace} onChange={e => setSelectedRace(e.target.value)} style={selectStyle}>
            <option value="">-- Vyber závod --</option>
            {races.map(r => <option key={r.id} value={r.id}>{r.year} - {r.name}</option>)}
          </select>
        </label>

        <label>Jezdec:
          <select required value={selectedDriver} onChange={e => setSelectedDriver(e.target.value)} style={selectStyle}>
            <option value="">-- Vyber jezdce --</option>
            {drivers.map(d => <option key={d.id} value={d.id}>{d.full_name} (#{d.start_number})</option>)}
          </select>
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
          <label>Pořadí:
            <input type="number" required value={pos} onChange={e => setPos(e.target.value)} placeholder="1" style={inputStyle} />
          </label>
          <label>Body:
            <input type="number" required value={pts} onChange={e => setPts(e.target.value)} placeholder="25" style={inputStyle} />
          </label>
          <label>Bonus:
            <input type="number" value={bonus} onChange={e => setBonus(e.target.value)} placeholder="1" style={inputStyle} />
          </label>
        </div>

        <button type="submit" style={{ background: '#fbbf24', color: '#000', padding: '12px', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>
          Uložit výsledek
        </button>
      </form>

      <p style={{ marginTop: '20px', fontSize: '0.8rem', color: '#666' }}>
        Tip: Pokud v seznamu chybí jezdec nebo závod, musíš je nejdříve přidat přímo v Supabase tabulkách "drivers" nebo "races".
      </p>
    </div>
  );
}

const selectStyle = { width: '100%', padding: '10px', marginTop: '5px', background: '#222', color: '#fff', border: '1px solid #444', borderRadius: '5px' };
const inputStyle = { width: '100%', padding: '10px', marginTop: '5px', background: '#222', color: '#fff', border: '1px solid #444', borderRadius: '5px' };
