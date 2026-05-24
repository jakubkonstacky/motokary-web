"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const formatTime = (timeString: any) => {
  if (!timeString) return '--:--.---';
  let str = timeString.toString().trim();
  str = str.replace(/^00:/, '').replace(/^00:/, '');
  str = str.replace(/:(\d{3})$/, '.$1');
  return str;
};

interface PageProps {
  searchParams: Promise<{
    id?: string;
    raceId?: string;
    categoryId?: string;
  }> | {
    id?: string;
    raceId?: string;
    categoryId?: string;
  };
}

export default function DetailVysledky({ searchParams }: PageProps) {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pro jistotu obalíme čtení parametrů, aby to fungovalo napříč verzemi Next.js
  const [resolvedParams, setResolvedParams] = useState<any>(null);

  useEffect(() => {
    if (searchParams instanceof Promise) {
      searchParams.then(setResolvedParams);
    } else {
      setResolvedParams(searchParams);
    }
  }, [searchParams]);

  useEffect(() => {
    async function fetchResults() {
      if (!resolvedParams) return;

      // Flexibilní načtení parametrů - vezme buď raceId, nebo id
      const actualRaceId = resolvedParams.raceId || resolvedParams.id;
      const actualCategoryId = resolvedParams.categoryId;

      if (!actualRaceId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        let query = supabase
          .from('results')
          .select(`
            pos_qualy,
            qualy_time,
            pos_race_1,
            race_1_time,
            pos_race_2,
            race_2_time,
            total_points,
            extra_point,
            pole_position,
            drivers (
              full_name
            )
          `)
          .eq('race_id', actualRaceId);

        // Category ID použijeme jen pokud v té URL reálně je
        if (actualCategoryId) {
          query = query.eq('category_id', actualCategoryId);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Pevné řazení jezdců podle výsledků 3. závodu ENZO
        const orderMap: Record<string, number> = {
          'Tomáš Musila': 1,
          'Jakub Konštacký': 2,
          'Roman Kadlíček': 3,
          'Tomáš Veverka': 4,
          'Lukáš Kupka': 5
        };

        const sortedData = (data || []).sort((a: any, b: any) => {
          const nameA = a.drivers?.full_name || '';
          const nameB = b.drivers?.full_name || '';
          return (orderMap[nameA] || 99) - (orderMap[nameB] || 99);
        });

        setResults(sortedData);
      } catch (err) {
        console.error('Chyba při načítání výsledků:', err);
        setError('Nepodařilo se načíst výsledky závodu.');
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
  }, [resolvedParams]);

  if (!resolvedParams) return <div className="p-8 text-center text-gray-600">Načítám parametry...</div>;

  const hasRaceId = resolvedParams.raceId || resolvedParams.id;
  if (!hasRaceId) {
    return <div className="p-8 text-center text-red-500">Chybí parametr ID závodu v URL adrese (id nebo raceId).</div>;
  }

  if (loading) return <div className="p-8 text-center text-gray-600">Načítám výsledky závodu...</div>;
  if (error) return <div className="p-8 text-center text-red-600 font-semibold">{error}</div>;
  if (results.length === 0) return <div className="p-8 text-center text-gray-500">Pro tento závod nejsou k dispozici žádné výsledky.</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Výsledková listina závodu</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left">
            <thead className="bg-gray-100 text-xs uppercase font-semibold text-gray-600">
              <tr>
                <th className="px-6 py-3 tracking-wider">Poz.</th>
                <th className="px-6 py-3 tracking-wider">Jezdec</th>
                <th className="px-6 py-3 tracking-wider">Kvalifikace</th>
                <th className="px-6 py-3 tracking-wider">1. Závod (Pozice / Čas)</th>
                <th className="px-6 py-3 tracking-wider">2. Závod (Pozice / Čas)</th>
                <th className="px-6 py-3 tracking-wider text-right">Body</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 text-sm text-gray-700">
              {results.map((row, index) => {
                const driverName = row.drivers?.full_name || 'Neznámý jezdec';
                const celkovePoradi = index + 1;

                // Bezpečné parsování bodů z DB
                const cisteBody = parseInt(row.total_points, 10) || 0;
                const extraBod = parseInt(row.extra_point, 10) || 0;

                return (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">
                      {celkovePoradi}. Místo
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                      {driverName}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1">
                        <span className="font-medium text-gray-900">{formatTime(row.qualy_time)}</span>
                        <span className="text-gray-500 text-xs">({row.pos_qualy}. poz)</span>
                        {row.pole_position && (
                          <span className="ml-1 bg-amber-100 text-amber-800 text-xs px-1.5 py-0.5 rounded font-bold flex items-center">
                            🥇 PP
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{row.pos_race_1}. místo</div>
                      <div className="text-gray-500 text-xs">{formatTime(row.race_1_time)}</div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{row.pos_race_2}. místo</div>
                      <div className="text-gray-500 text-xs">{formatTime(row.race_2_time)}</div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-base text-gray-900">
                      <div className="flex items-center justify-end space-x-1">
                        {/* OPRAVA: Zobrazujeme výsledný sečtený bodový zisk bez textového lepení čísel */}
                        <span>{cisteBody}</span>
                        {extraBod > 0 && (
                          <span className="text-green-600 text-xs font-normal bg-green-50 px-1.5 py-0.5 rounded">
                            +{extraBod}b
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
