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

  // --- DATA STATE ---
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [allDrivers, setAllDrivers] = useState<any[]>([]); // Jezdci jsou globální
  const [filteredRaces, setFilteredRaces] = useState<any[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<any[]>([]);

  // 1. GLOBÁLNÍ DATA (Sezóny a Jezdci - nezávislé na filtru roku)
  const loadGlobalData = async () => {
    const { data: s } = await supabase.from('seasons').select('*').order('id', { ascending: false });
    const { data: d } = await supabase.from('drivers').select('*').order('full_name');
    setSeasons(s || []);
    setAllDrivers(d || []);
    
    // Nastavení výchozího roku
    if (!selectedYear) {
      const currentYear = new Date().getFullYear();
      const yearToSet = s?.some(season => season.id === currentYear) ? currentYear : (s?.[0]?.id || null);
      setSelectedYear(yearToSet);
    }
  };

  // 2. DATA ZÁVISLÁ NA ROCE (Závody a Kategorie)
  const loadYearSpecificData = async (year: number) => {
    const { data: r } = await supabase.from('races').select('*').eq('season_id', year).order('id', { ascending: true });
    const { data: c } = await supabase.from('categories').select('*').eq('season_id', year).order('order_by', { ascending: true });
    setFilteredRaces(r || []);
    setFilteredCategories(c || []);
  };

  useEffect(() => {
    if (isAuthorized) loadGlobalData();
  }, [isAuthorized]);

  useEffect(() => {
    if (isAuthorized && selectedYear) {
      loadYearSpecificData(selectedYear);
    }
  }, [selectedYear, isAuthorized]);

  const notify = (msg: string, type = 'success') => {
    setStatus({ msg, type });
    setTimeout(() => setStatus({ msg: '', type: '' }), 5000);
  };

  // --- PŘIHLAŠOVACÍ OBRAZOVKA ---
  if (!isAuthorized) {
    return (
      <div style={loginBoxStyle}>
        <h2 style={{ color: '#fbbf24' }}>🔐 Admin Vstup</h2>
        <input 
          type="password" 
          placeholder="admin123" 
          style={inputStyle} 
          onChange={(e) => setPassword(e.target.value)} 
          onKeyDown={(e) => e.key === 'Enter' && password === 'admin123' && setIsAuthorized(true)} 
        />
        <button onClick={() => password === 'admin123' ? setIsAuthorized(true) : alert('Špatné heslo!')} style={submitBtnStyle}>Vstoupit</button>
      </div>
    );
  }

  // --- HANDLERY (Zápis do DB) ---

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
    else { notify('✅ Výsledek uložen!'); e.target.reset(); }
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
    else { notify('🏁 Závod přidán'); loadYearSpecificData(selectedYear!); e.target.reset(); }
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
    else { notify('🏷️ Kategorie vytvořena'); loadYearSpecificData(selectedYear!); e.target.reset(); }
  };

  const handleAddDriver = async (e: any) => {
    e.preventDefault();
    const { error } = await supabase.from('drivers').insert([{
      full_name: e.target.name.value,
      start_number: parseInt(e.target.number.value)
    }]);
    if (error) notify(error.message, 'error');
    else { notify('👤 Jezdec přidán globálně'); loadGlobalData(); e.target.reset(); }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', color: '#fff', padding: '0 20px', fontFamily: 'sans-serif' }}>
      
      {/* 1. GLOBÁLNÍ VÝBĚR ROKU */}
      <div style={yearSelectorStyle}>
        <label style={{ fontWeight: 'bold', color: '#fbbf24' }}>AKTIVNÍ SEZÓNA: </label>
        <select 
          value={selectedYear || ''} 
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          style={{ ...inputStyle, width: 'auto', marginLeft: '15px', border: '1px solid #fbbf24' }}
        >
          {seasons.map(s => <option key={s.id} value={s.id}>{
