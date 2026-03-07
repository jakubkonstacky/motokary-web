'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function MasterAdmin() {
  const [activeTab, setActiveTab] = useState('vysledky');
  const [status, setStatus] = useState({ msg: '', type: '' });
  
  // Data z DB pro selecty
  const [seasons, setSeasons] = useState<any[]>([]);
  const [races, setRaces] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    const { data: s } = await supabase.from('seasons').select('*').order('id', { ascending: false });
    const { data: r } = await supabase.from('races').select('*').order('id', { ascending: false });
    const { data: d } = await supabase.from('drivers').select('*').order('full_name');
    const { data: c } = await supabase.from('categories').select('*').order('order_by');
    setSeasons(s || []); setRaces(r || []); setDrivers(d || []); setCategories(c || []);
  }

  const showMsg = (msg: string, type = 'success') => {
    setStatus({ msg, type });
    setTimeout(() => setStatus({ msg: '', type: '' }), 4000);
  };

  // --- FORMULÁŘE ---

  const AddSeason = async (e: any) => {
    e.preventDefault();
    const { error } = await supabase.from('seasons').insert([{ id: e.target.year.value, name: e.target.name.value }]);
    if (!error) { showMsg('Sezóna přidána'); loadAllData(); e.target.reset(); }
  };

  const AddRace = async (e: any) => {
    e.preventDefault();
    const { error } = await supabase.from('races').insert([{
      id: e.target.id.value,
      season_id: e.target.season.value,
      name: e.target.name.value,
      race_date: e.target.date.value
    }]);
    if (!error) { showMsg('Závod přidán'); loadAllData(); e.target.reset(); }
  };

  const AddResult = async (e: any) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const { error } = await supabase.from('results').insert([{
      race_id: fd.get('race_id'),
      driver_id: fd.get('driver_id'),
      category_id: fd.get('category_id'),
      pos_race_1: fd.get('p1'),
      pos_race_2: fd.get('p2'),
      extra_point: fd.get('extra'),
      total_points: fd.get('total'),
      qualy_time: fd.get('qualy') || null,
      pole_position: e.target.pole.checked
    }]);
    if (!error) { showMsg('Výsledek uložen'); e.target.reset(); } else { console.error(error); }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', color: '#fff', padding: '0 20px' }}>
      <h1 style={{ color: '#fbbf24' }}>🏎️ Master Admin</h1>
      
      {status.msg && <div style={{ padding: '15px', background: status.type === 'success' ? '#065f46' : '#991b1b', borderRadius: '8px', marginBottom: '20px' }}>{status.msg}</div>}

      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
        {['vysledky', 'zavody', 'sezony', 'kategorie'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '10px 15px', background: activeTab === tab ? '#fbbf24' : '#222', color: activeTab === tab ? '#000' : '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 'bold' }}>{tab}</button>
        ))}
      </div>

      {/* SEKCE VÝSLEDKY */}
      {activeTab === 'vysledky' && (
        <form onSubmit={AddResult} style={formStyle}>
          <h3>Zadat výsledek závodu</h3>
          <select name="race_id" required style={inputStyle}>
            <option value="">-- Vyber závod --</option>
            {races.map(r => <option key={r.id} value={r.id}>{r.id} - {r.name}</option>)}
          </select>
          <select name="driver_id" required style={inputStyle}>
            <option value="">-- Vyber jezdce --</option>
            {drivers.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
          </select>
          <select name="category_id" required style={inputStyle}>
            <option value="">-- Vyber kategorii --</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name} ({c.id})</option>)}
          </select>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <input name="p1" type="number" placeholder="Pořadí jízda 1" style={inputStyle} />
            <input name="p2" type="number" placeholder="Pořadí jízda 2" style={inputStyle} />
            <input name="extra" type="number" placeholder="Extra bod" style={inputStyle} />
          </div>
          <input name="total" type="number" placeholder="CELKOVÉ BODY" required style={{ ...inputStyle, border: '1px solid #fbbf24' }} />
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <input name="qualy" type="text" placeholder="Čas kvalifikace (00:45.123)" style={inputStyle} />
            <label><input name="pole" type="checkbox" /> Pole Position</label>
          </div>
          <button type="submit" style={btnStyle}>Uložit do databáze</button>
        </form>
      )}

      {/* SEKCE ZÁVODY */}
      {activeTab === 'zavody' && (
        <form onSubmit={AddRace} style={formStyle}>
          <h3>Nový závod</h3>
          <input name="id" type="number" placeholder="ID (např. 202601)" required style={inputStyle} />
          <select name="season" required style={inputStyle}>
            {seasons.map(s => <option key={s.id} value={s.id}>Sezóna {s.id}</option>)}
          </select>
          <input name="name" type="text" placeholder="Název (např. GP Cheb I)" required style={inputStyle} />
          <input name="date" type="date" required style={inputStyle} />
          <button type="submit" style={btnStyle}>Vytvořit závod</button>
        </form>
      )}

      {/* SEKCE SEZONY */}
      {activeTab === 'sezony' && (
        <form onSubmit={AddSeason} style={formStyle}>
          <h3>Nová sezóna</h3>
          <input name="year" type="number" placeholder="Rok (např. 2027)" required style={inputStyle} />
          <input name="name" type="text" placeholder="Název sezóny" required style={inputStyle} />
          <button type="submit" style={btnStyle}>Přidat rok</button>
        </form>
      )}
    </div>
  );
}

const formStyle = { display: 'flex', flexDirection: 'column' as const, gap: '15px', background: '#111', padding: '30px', borderRadius: '15px', border: '1px solid #222' };
const inputStyle = { padding: '12px', background: '#222', border: '1px solid #333', color: '#fff', borderRadius: '6px' };
const btnStyle = { padding: '15px', background: '#fbbf24', border: 'none', color: '#000', fontWeight: 'bold', borderRadius: '6px', cursor: 'pointer', marginTop: '10px' };
