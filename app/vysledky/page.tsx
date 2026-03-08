'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function VysledkyPage() {
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [races, setRaces] = useState<any[]>([]);
  const [resultsByCat, setResultsByCat] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInitial() {
      const { data } = await supabase.from('seasons').select('*').order('id', { ascending: false });
      if (data && data.length > 0) {
        setSeasons(data);
        const currentSystemYear = new Date().getFullYear();
        const hasCurrentYear = data.some(s => s.id === currentSystemYear);
        setSelectedYear(hasCurrentYear ? currentSystemYear : data[0].id);
      }
    }
    fetchInitial();
  }, []);

  useEffect(() => {
    if (!selectedYear) return;

    async function fetchData() {
      setLoading(true);
      const { data: catData } = await supabase
        .from('categories')
        .select('*')
        .eq('season_id', selectedYear)
        .order('order_by', { ascending: true });
      setCategories(catData || []);

      const { data: raceData } = await supabase
        .from('races')
        .select('*')
        .eq('season_id', selectedYear)
        .order('id', { ascending: true });
      setRaces(raceData || []);

      const { data: resData, error } = await supabase
        .from('results')
        .select(`
          pos_race_1, pos_race_2, extra_point, total_points, race_id, category_id, pole_position,
          drivers (id, full_name, start_number),
          races!inner (season_id)
        `)
        .eq('races.season_id', selectedYear);

      if (error) {
        setLoading(false);
        return;
      }

      const grouped: any = {};
      resData?.forEach((res: any) => {
        const catId = res.category_id;
        const dId = res.drivers?.id;
        if (!dId) return;
        if (!grouped[catId]) grouped[catId] = {};
        if (!grouped[catId][dId]) {
          grouped[catId][dId] = {
            name: res.drivers.full_name,
            number: res.drivers.start_number,
            raceResults: {},
            totalPoints: 0
          };
        }
        grouped
