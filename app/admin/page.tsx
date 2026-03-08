'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Inicializace Supabase - ujisti se, že máš tyto proměnné v .env.local nebo ve Vercelu
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function MasterAdminPage() {
  // --- STAV PRO ZABEZPEČENÍ ---
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);

  // --- STAVY PRO DATA ---
  const [activeTab, setActiveTab] = useState('results');
  const [status, setStatus] = useState({ msg: '', type: '' });
  
  const [seasons, setSeasons] = useState<any[]>([]);
  const [races, setRaces] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  // Načtení dat z databáze
  const loadDatabaseInfo = async () => {
    const { data: s } = await supabase.from('seasons').select('*').order('id', { ascending: false });
    const { data: r } = await supabase.from('races').select('*').order('id', { ascending: false });
    const { data: d } = await supabase.from('drivers').select('*').order('full_name');
    const { data: c } = await supabase.from('categories').select('*').order('order_by', { ascending: true });
    
    setSeasons(s || []);
    setRaces(r || []);
    setDrivers(d || []);
    setCategories(c || []);
  };

  useEffect(() => {
    if (isAuthorized) {
      loadDatabaseInfo();
    }
  }, [isAuthorized]);

  const notify = (msg: string, type = 'success') => {
    setStatus({ msg, type });
    setTimeout(() => setStatus({ msg: '', type: '' }), 5000);
  };

  // --- AUTENTIZAČNÍ BRÁNA ---
  if (!isAuthorized) {
    return (
      <div style={{ 
        maxWidth: '400px', margin: '100px auto', padding: '40px', 
        background: '#111', borderRadius: '15px', border: '1px solid #333', textAlign: 'center' 
      }}>
        <h2 style={{ color: '#fbbf24', marginBottom: '20px' }}>🔐 Admin Vstup</h2>
        <input 
          type="password" 
          placeholder="Zadej heslo"
          style={inputStyle}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && password === 'admin123' && setIsAuthorized(true)}
        />
        <button 
          onClick={() => password === 'admin123' ? setIsAuthorized(true) : alert('Špatné heslo!')}
          style={{ ...submitBtnStyle, marginTop: '20px' }}
        >
          Vstoupit
        </button>
        <p style={{ color: '#444', fontSize: '0.8rem', marginTop: '15px' }}>Výchozí heslo: admin123</p>
      </div>
    );
  }

  // --- HANDLERY ---

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
    if (error) notify(error.message, 'error');
    else { notify('✅ Výsledek úspěšně uložen!'); e.target.reset(); }
  };

  const handleAddRace = async (e: any) => {
    e.preventDefault();
    const { error } = await supabase.from('races').insert([{
      id: parseInt(e.target.race_id.value),
      season_id: parseInt(e.target.season_id.value),
      name: e.target.name.value,
      race_date: e.target.date.value
    }]);
    if (error) notify(error.message, 'error');
    else { notify('🏁 Závod vytvořen'); loadDatabaseInfo(); e.target.reset(); }
  };

  const handleAddCategory = async (e: any) => {
    e.preventDefault();
    const { error } = await supabase.from('categories').insert([{
      id: e.target.cat_id.value,
      season_id: parseInt(e.target.season_id.value),
      name: e.target.name.value,
      order_by: parseInt(e.target.order_by.value)
    }]);
    if (error) notify(error.message, 'error');
    else { notify('🏷️ Kategorie vytvořena'); loadDatabaseInfo(); e.target.reset(); }
  };

  const handleAddSeason = async (e: any) => {
    e.preventDefault();
    const { error } = await supabase.from('seasons').insert([{ 
      id: parseInt(e.target.year.value), 
      name: e.target.name.value 
    }]);
    if (error) notify(error.message, 'error');
    else { notify('📅 Sezóna (rok) přidána'); loadDatabaseInfo(); e.target.reset(); }
  };

  const handleAddDriver = async (e: any) => {
    e.preventDefault();
    const { error } = await supabase.from('drivers').insert([{
      full_name: e.target.name.value,
      start_number: parseInt(e.target.number.value)
    }]);
    if (error) notify(error.message, 'error');
    else { notify('👤 Jezdec přidán'); loadDatabaseInfo(); e.target.reset(); }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', color: '#fff', padding: '0 20px', fontFamily: 'sans-serif' }}>
      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#fbbf24', fontSize: '2.2rem', marginBottom: '5px' }}>🏎️ Motokáry Admin</h1>
        {status.msg && <div style={{ color: status.type === 'success' ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>{status.msg}</div>}
      </header>

      {/* NAVIGACE */}
      <nav style={{ display: 'flex', gap: '8px', marginBottom: '30px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {['results', 'races', 'categories', 'seasons', 'drivers'].map(tab => (
          <button 
            key={tab} onClick={() => setActiveTab(tab)} 
            style={{ 
              padding: '10px 18px', background: activeTab === tab ? '#fbbf24' : '#111', 
              color: activeTab === tab ? '#000' : '#fff', border: '1px solid #333', 
              borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.75rem'
            }}
          >
            {tab === 'results' ? 'Výsledky' : tab === 'races' ? 'Závody' : tab === 'categories' ? 'Kategorie' : tab === 'seasons' ? 'Sezóny' : 'Jezdci'}
          </button>
        ))}
      </nav>

      {/* VÝSLEDKY FORM */}
      {activeTab === 'results' && (
        <form onSubmit={handleAddResult} style={formBoxStyle}>
          <h2 style={formTitleStyle}>Zadat nový výsledek</h2>
          <div style={gridStyle}>
            <select name="race_id" required style={inputStyle}>
              <option value="">-- Vyber závod --</option>
              {races.map(r => <option key={r.id} value={r.id}>{r.id} | {r.name}</option>)}
            </select>
            <select name="category_id" required style={inputStyle}>
              <option value="">-- Vyber kategorii --</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name} ({c.id})</option>)}
            </select>
          </div>
          <select name="driver_id" required style={{ ...inputStyle, marginBottom: '20px' }}>
            <option value="">-- Vyber jezdce --</option>
            {drivers.map(d => <option key={d.id} value={d.id}>{d.full_name} (#{d.start_number})</option>)}
          </select>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '20px' }}>
            <input name="p1" type="number" placeholder="Pořadí Jízda 1" required style={inputStyle} />
            <input name="p2" type="number" placeholder="Pořadí Jízda 2" required style={inputStyle} />
            <input name="extra" type="number" placeholder="Extra body" style={inputStyle} />
          </div>
          <div style={gridStyle}>
            <input name="total" type="number" placeholder="Celkové body" required style={{ ...inputStyle, border: '1px solid #fbbf24' }} />
            <input name="qualy" type="text" placeholder="Čas kvalifikace (00:45.123)" style={inputStyle} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px', color: '#fbbf24', fontWeight: 'bold', cursor: 'pointer' }}>
            <input name="pole" type="checkbox" style={{ width: '18px', height: '18px' }} /> Pole Position (+1b. info v tabulce)
          </label>
          <button type="
