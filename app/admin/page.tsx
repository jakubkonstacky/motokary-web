'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function MasterAdminPage() {
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState('results');
  const [status, setStatus] = useState({ msg: '', type: '' });

  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [allDrivers, setAllDrivers] = useState<any[]>([]);
  const [filteredRaces, setFilteredRaces] = useState<any[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<any[]>([]);
  const [currentResults, setCurrentResults] = useState<any[]>([]);

  const loadGlobalData = async () => {
    const { data: s } = await supabase.from('seasons').select('*').order('id', { ascending: false });
    const { data: d } = await supabase.from('drivers').select('*').order('full_name');
    setSeasons(s || []);
    setAllDrivers(d || []);
    if (!selectedYear && s && s.length > 0) setSelectedYear(s[0].id);
  };

  const loadYearData = async (year: number) => {
    const { data: r } = await supabase.from('races').select('*').eq('season_id', year).order('id', { ascending: true });
    const { data: c } = await supabase.from('categories').select('*').eq('season_id', year).order('order_by', { ascending: true });
    const { data: res } = await supabase.from('results').select('*, drivers(full_name), races!inner(season_id)').eq('races.season_id', year);
    
    setFilteredRaces(r || []);
    setFilteredCategories(c || []);
    setCurrentResults(res || []);
  };

  useEffect(() => { if (isAuthorized) loadGlobalData(); }, [isAuthorized]);
  useEffect(() => { if (isAuthorized && selectedYear) loadYearData(selectedYear); }, [selectedYear, isAuthorized]);

  const notify = (msg: string, type = 'success') => {
    setStatus({ msg, type });
    setTimeout(() => setStatus({ msg: '', type: '' }), 4000);
  };

  // --- FUNKCE PRO MAZÁNÍ ---
  const deleteItem = async (table: string, id: any) => {
    if (!window.confirm('Opravdu to chceš smazat? Tato akce je nevratná.')) return;
    
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) notify(error.message, 'error');
    else {
      notify('Smazáno.');
      loadGlobalData();
      if (selectedYear) loadYearData(selectedYear);
    }
  };

  // --- HANDLERY PRO PŘIDÁVÁNÍ (Zůstávají stejné) ---
  const handleAddResult = async (e: any) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const { error } = await supabase.from('results').insert([{
      race_id: parseInt(fd.get('race_id') as string),
      driver_id: parseInt(fd.get('driver_id') as string),
      category_id: fd.get('category_id'),
      pos_race_1: parseInt(fd.get('p1') as string),
      pos_race_2: parseInt(fd.get('p2') as string),
      extra_point: parseInt(fd.get('extra') as string) || 0,
      total_points: parseInt(fd.get('total') as string),
      qualy_time: fd.get('qualy') || null,
      pole_position: e.target.pole.checked
    }]);
    if (!error) { notify('Uloženo.'); e.target.reset(); loadYearData(selectedYear!); }
  };

  if (!isAuthorized) {
    return (
      <div style={loginBoxStyle}>
        <h2 style={{ color: '#fbbf24' }}>🔐 Admin Vstup</h2>
        <input type="password" style={inputStyle} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && password === 'admin123' && setIsAuthorized(true)} />
        <button onClick={() => password === 'admin123' ? setIsAuthorized(true) : alert('Heslo!')} style={submitBtnStyle}>Vstoupit</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '40px auto', color: '#fff', padding: '0 20px', fontFamily: 'sans-serif' }}>
      
      {/* VÝBĚR ROKU */}
      <div style={yearSelectorStyle}>
        <label>SPRAVOVANÝ ROK: </label>
        <select value={selectedYear || ''} onChange={(e) => setSelectedYear(parseInt(e.target.value))} style={selectStyle}>
          {seasons.map(s => <option key={s.id} value={s.id}>{s.id}</option>)}
        </select>
      </div>

      <nav style={navStyle}>
        {['results', 'races', 'categories', 'drivers', 'seasons'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ ...tabBtnStyle, background: activeTab === tab ? '#fbbf24' : '#111', color: activeTab === tab ? '#000' : '#fff' }}>{tab}</button>
        ))}
      </nav>

      {status.msg && <div style={{ color: status.type === 'success' ? '#10b981' : '#ef4444', textAlign: 'center', marginBottom: '20px' }}>{status.msg}</div>}

      {/* --- SEKCE VÝSLEDKY --- */}
      {activeTab === 'results' && (
        <>
          <form onSubmit={handleAddResult} style={formBoxStyle}>
            <h3>Nový výsledek ({selectedYear})</h3>
            <div style={gridStyle}>
              <select name="race_id" required style={inputStyle}>
                <option value="">-- Závod --</option>
                {filteredRaces.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              <select name="category_id" required style={inputStyle}>
                <option value="">-- Kategorie --</option>
                {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <select name="driver_id" required style={{...inputStyle, marginTop:'10px'}}>
              <option value="">-- Jezdec --</option>
              {allDrivers.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
            </select>
            <div style={{...gridStyle, marginTop:'10px'}}>
              <input name="total" type="number" placeholder="Body celkem" required style={inputStyle} />
              <label><input name="pole" type="checkbox" /> Pole Position</label>
            </div>
            <button type="submit" style={submitBtnStyle}>Uložit</button>
          </form>

          <div style={listStyle}>
            <h4>Nahrané výsledky pro rok {selectedYear}</h4>
            {currentResults.map(res => (
              <div key={res.id} style={listItemStyle}>
                <span>{res.drivers?.full_name} - {res.total_points}b</span>
                <button onClick={() => deleteItem('results', res.id)} style={delBtnStyle}>Smazat</button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* --- SEKCE ZÁVODY --- */}
      {activeTab === 'races' && (
        <div style={listStyle}>
          {filteredRaces.map(r => (
            <div key={r.id} style={listItemStyle}>
              <span>{r.name} ({r.id})</span>
              <button onClick={() => deleteItem('races', r.id)} style={delBtnStyle}>Smazat</button>
            </div>
          ))}
        </div>
      )}

      {/* --- SEKCE KATEGORIE --- */}
      {activeTab === 'categories' && (
        <div style={listStyle}>
          {filteredCategories.map(c => (
            <div key={c.id} style={listItemStyle}>
              <span>{c.name} ({c.id})</span>
              <button onClick={() => deleteItem('categories', c.id)} style={delBtnStyle}>Smazat</button>
            </div>
          ))}
        </div>
      )}

      {/* --- SEKCE JEZDCI --- */}
      {activeTab === 'drivers' && (
        <div style={listStyle}>
          {allDrivers.map(d => (
            <div key={d.id} style={listItemStyle}>
              <span>{d.full_name} (#{d.start_number})</span>
              <button onClick={() => deleteItem('drivers', d.id)} style={delBtnStyle}>Smazat</button>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

// --- STYLY ---
const yearSelectorStyle: any = { background: '#111', padding: '15px', borderRadius: '10px', marginBottom: '20px', textAlign: 'center', border: '1px solid #333' };
const selectStyle: any = { padding: '8px', background: '#222', color: '#fbbf24', border: '1px solid #fbbf24', borderRadius: '5px' };
const loginBoxStyle: any = { maxWidth: '350px', margin: '100px auto', padding: '30px', background: '#111', borderRadius: '15px', textAlign: 'center', border: '1px solid #333' };
const navStyle: any = { display: 'flex', gap: '5px', marginBottom: '25px', justifyContent: 'center', flexWrap: 'wrap' };
const tabBtnStyle: any = { padding: '8px 15px', border: '1px solid #333', borderRadius: '5px', cursor: 'pointer', fontSize: '0.8rem' };
const formBoxStyle: any = { background: '#111', padding: '20px', borderRadius: '10px', border: '1px solid #222', marginBottom: '30px' };
const inputStyle: any = { padding: '10px', background: '#1a1a1a', border: '1px solid #333', color: '#fff', borderRadius: '5px', width: '100%' };
const submitBtnStyle: any = { padding: '12px', background: '#fbbf24', color: '#000', border: 'none', borderRadius: '5px', cursor: 'pointer', width: '100%', fontWeight: 'bold', marginTop: '15px' };
const gridStyle: any = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' };
const listStyle: any = { background: '#0a0a0a', padding: '20px', borderRadius: '10px', border: '1px solid #222' };
const listItemStyle: any = { display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #222', alignItems: 'center' };
const delBtnStyle: any = { background: '#991b1b', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' };
