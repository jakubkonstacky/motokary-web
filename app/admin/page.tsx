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

  // --- DATA ---
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
    const { data: res } = await supabase.from('results').select('*, drivers(full_name), races!inner(season_id, name)').eq('races.season_id', year);
    
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

  const deleteItem = async (table: string, id: any) => {
    if (!window.confirm('Opravdu chcete tuto položku smazat?')) return;
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) notify('Chyba při mazání: ' + error.message, 'error');
    else {
      notify('Smazáno.');
      if (table === 'drivers' || table === 'seasons') loadGlobalData();
      if (selectedYear) loadYearData(selectedYear);
    }
  };

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
    if (error) notify('Chyba: ' + error.message, 'error');
    else { notify('Výsledek uložen.'); e.target.reset(); loadYearData(selectedYear!); }
  };

  const handleAddRace = async (e: any) => {
    e.preventDefault();
    const { error } = await supabase.from('races').insert([{
      id: parseInt(e.target.race_id.value),
      season_id: selectedYear,
      name: e.target.name.value,
      race_date: e.target.date.value
    }]);
    if (error) notify(error.message, 'error');
    else { notify('Závod přidán.'); loadYearData(selectedYear!); e.target.reset(); }
  };

  const handleAddCategory = async (e: any) => {
    e.preventDefault();
    const { error } = await supabase.from('categories').insert([{
      id: e.target.cat_id.value,
      season_id: selectedYear,
      name: e.target.name.value,
      order_by: parseInt(e.target.order_by.value)
    }]);
    if (error) notify(error.message, 'error');
    else { notify('Kategorie přidána.'); loadYearData(selectedYear!); e.target.reset(); }
  };

  const handleAddDriver = async (e: any) => {
    e.preventDefault();
    const { error } = await supabase.from('drivers').insert([{
      full_name: e.target.name.value,
      start_number: parseInt(e.target.number.value)
    }]);
    if (error) notify(error.message, 'error');
    else { notify('Jezdec přidán.'); loadGlobalData(); e.target.reset(); }
  };

  if (!isAuthorized) {
    return (
      <div style={loginBoxStyle}>
        <h2 style={{ color: '#fbbf24' }}>🔐 Admin Vstup</h2>
        <input type="password" placeholder="Heslo" style={inputStyle} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && password === 'admin123' && setIsAuthorized(true)} />
        <button onClick={() => password === 'admin123' ? setIsAuthorized(true) : alert('Špatné heslo!')} style={submitBtnStyle}>Vstoupit</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '40px auto', color: '#fff', padding: '0 20px', fontFamily: 'sans-serif' }}>
      
      {/* VÝBĚR ROKU */}
      <div style={yearSelectorStyle}>
        <label style={{ fontWeight: 'bold' }}>AKTIVNÍ ROK: </label>
        <select value={selectedYear || ''} onChange={(e) => setSelectedYear(parseInt(e.target.value))} style={selectYearStyle}>
          {seasons.map(s => <option key={s.id} value={s.id}>{s.id}</option>)}
        </select>
      </div>

      <nav style={navStyle}>
        <button onClick={() => setActiveTab('results')} style={{ ...tabBtnStyle, background: activeTab === 'results' ? '#fbbf24' : '#111', color: activeTab === 'results' ? '#000' : '#fff' }}>Výsledky</button>
        <button onClick={() => setActiveTab('races')} style={{ ...tabBtnStyle, background: activeTab === 'races' ? '#fbbf24' : '#111', color: activeTab === 'races' ? '#000' : '#fff' }}>Závody</button>
        <button onClick={() => setActiveTab('categories')} style={{ ...tabBtnStyle, background: activeTab === 'categories' ? '#fbbf24' : '#111', color: activeTab === 'categories' ? '#000' : '#fff' }}>Kategorie</button>
        <button onClick={() => setActiveTab('drivers')} style={{ ...tabBtnStyle, background: activeTab === 'drivers' ? '#fbbf24' : '#111', color: activeTab === 'drivers' ? '#000' : '#fff' }}>Jezdci</button>
      </nav>

      {status.msg && <div style={{ color: status.type === 'success' ? '#10b981' : '#ef4444', textAlign: 'center', marginBottom: '20px', fontWeight: 'bold' }}>{status.msg}</div>}

      {/* SEKCE VÝSLEDKY */}
      {activeTab === 'results' && (
        <>
          <form onSubmit={handleAddResult} style={formBoxStyle}>
            <h3 style={{ color: '#fbbf24', marginBottom: '20px' }}>Zadat výsledky pro rok {selectedYear}</h3>
            <div style={gridStyle}>
              <div style={inputGroup}>
                <label>Závod</label>
                <select name="race_id" required style={inputStyle}>
                  <option value="">-- Vyber závod --</option>
                  {filteredRaces.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div style={inputGroup}>
                <label>Kategorie</label>
                <select name="category_id" required style={inputStyle}>
                  <option value="">-- Vyber kategorii --</option>
                  {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div style={{ ...inputGroup, marginTop: '10px' }}>
              <label>Jezdec</label>
              <select name="driver_id" required style={inputStyle}>
                <option value="">-- Vyber jezdce --</option>
                {allDrivers.map(d => <option key={d.id} value={d.id}>{d.full_name} (#{d.start_number})</option>)}
              </select>
            </div>
            
            <div style={{ ...gridStyle, marginTop: '20px', gridTemplateColumns: '1fr 1fr 1fr' }}>
              <div style={inputGroup}>
                <label>Pořadí 1. jízda</label>
                <input name="p1" type="number" required style={inputStyle} placeholder="např. 1" />
              </div>
              <div style={inputGroup}>
                <label>Pořadí 2. jízda</label>
                <input name="p2" type="number" required style={inputStyle} placeholder="např. 2" />
              </div>
              <div style={inputGroup}>
                <label>Extra body</label>
                <input name="extra" type="number" defaultValue="0" style={inputStyle} />
              </div>
            </div>

            <div style={{ ...gridStyle, marginTop: '20px' }}>
              <div style={inputGroup}>
                <label>Celkové body do tabulky</label>
                <input name="total" type="number" required style={{ ...inputStyle, borderColor: '#fbbf24' }} placeholder="např. 46" />
              </div>
              <div style={inputGroup}>
                <label>Čas v kvalifikaci</label>
                <input name="qualy" type="text" style={inputStyle} placeholder="00:45.123" />
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input name="pole" type="checkbox" id="pole" style={{ width: '20px', height: '20px' }} />
              <label htmlFor="pole" style={{ color: '#fbbf24', fontWeight: 'bold' }}>Pole Position (+1b info)</label>
            </div>

            <button type="submit" style={submitBtnStyle}>Uložit výsledek</button>
          </form>

          <div style={listContainerStyle}>
            <h4>Existující výsledky ({selectedYear})</h4>
            {currentResults.map(res => (
              <div key={res.id} style={listItemStyle}>
                <div style={{ fontSize: '0.9rem' }}>
                  <strong>{res.drivers?.full_name}</strong> - {res.races?.name} ({res.total_points} b.)
                </div>
                <button onClick={() => deleteItem('results', res.id)} style={delBtnStyle}>Smazat</button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* OSTATNÍ SEKCE (Závody, Kategorie, Jezdci) */}
      {activeTab === 'races' && (
        <>
          <form onSubmit={handleAddRace} style={formBoxStyle}>
            <h3>Nový závod ({selectedYear})</h3>
            <input name="race_id" type="number" placeholder="ID (např. 202601)" required style={inputStyle} />
            <input name="name" type="text" placeholder="Název závodu" required style={{ ...inputStyle, marginTop: '10px' }} />
            <input name="date" type="date" required style={{ ...inputStyle, marginTop: '10px' }} />
            <button type="submit" style={submitBtnStyle}>Přidat závod</button>
          </form>
          <div style={listContainerStyle}>
            {filteredRaces.map(r => (
              <div key={r.id} style={listItemStyle}>
                <span>{r.name} ({r.id}) - {r.race_date}</span>
                <button onClick={() => deleteItem('races', r.id)} style={delBtnStyle}>Smazat</button>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'categories' && (
        <>
          <form onSubmit={handleAddCategory} style={formBoxStyle}>
            <h3>Nová kategorie ({selectedYear})</h3>
            <input name="cat_id" type="text" placeholder="ID (např. A2026)" required style={inputStyle} />
            <input name="name" type="text" placeholder="Název" required style={{ ...inputStyle, marginTop: '10px' }} />
            <input name="order_by" type="number" defaultValue="1" style={{ ...inputStyle, marginTop: '10px' }} />
            <button type="submit" style={submitBtnStyle}>Přidat kategorii</button>
          </form>
          <div style={listContainerStyle}>
            {filteredCategories.map(c => (
              <div key={c.id} style={listItemStyle}>
                <span>{c.name} ({c.id})</span>
                <button onClick={() => deleteItem('categories', c.id)} style={delBtnStyle}>Smazat</button>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'drivers' && (
        <>
          <form onSubmit={handleAddDriver} style={formBoxStyle}>
            <h3>Nový jezdec (globální)</h3>
            <input name="name" type="text" placeholder="Celé jméno" required style={inputStyle} />
            <input name="number" type="number" placeholder="Startovní číslo" required style={{ ...inputStyle, marginTop: '10px' }} />
            <button type="submit" style={submitBtnStyle}>Přidat jezdce</button>
          </form>
          <div style={listContainerStyle}>
            {allDrivers.map(d => (
              <div key={d.id} style={listItemStyle}>
                <span>{d.full_name} (#{d.start_number})</span>
                <button onClick={() => deleteItem('drivers', d.id)} style={delBtnStyle}>Smazat</button>
              </div>
            ))}
          </div>
        </>
      )}

    </div>
  );
}

// --- STYLY ---
const loginBoxStyle: any = { maxWidth: '400px', margin: '100px auto', padding: '40px', background: '#111', borderRadius: '15px', border: '1px solid #333', textAlign: 'center' };
const yearSelectorStyle: any = { background: '#111', padding: '20px', borderRadius: '10px', marginBottom: '25px', border: '1px solid #333', textAlign: 'center' };
const selectYearStyle: any = { padding: '8px 15px', background: '#222', color: '#fbbf24', border: '2px solid #fbbf24', borderRadius: '5px', fontWeight: 'bold' };
const navStyle: any = { display: 'flex', gap: '8px', marginBottom: '30px', justifyContent: 'center' };
const tabBtnStyle: any = { padding: '12px 20px', border: '1px solid #333', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' };
const formBoxStyle: any = { background: '#111', padding: '30px', borderRadius: '15px', border: '1px solid #222', marginBottom: '30px' };
const inputGroup: any = { display: 'flex', flexDirection: 'column', gap: '5px' };
const inputStyle: any = { padding: '12px', background: '#1a1a1a', border: '1px solid #333', color: '#fff', borderRadius: '8px', outline: 'none', width: '100%' };
const submitBtnStyle: any = { padding: '15px', background: '#fbbf24', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', width: '100%', fontWeight: 'bold', marginTop: '20px' };
const gridStyle: any = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' };
const listContainerStyle: any = { background: '#0a0a0a', padding: '20px', borderRadius: '12px', border: '1px solid #222' };
const listItemStyle: any = { display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid #222', alignItems: 'center' };
const delBtnStyle: any = { background: '#991b1b', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' };
