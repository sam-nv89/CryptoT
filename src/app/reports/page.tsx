'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { FuturesArbDetails } from '@/components/dashboard/FuturesArbDetails';
import { RefreshCw, Download, Info, Play, Eye } from 'lucide-react';
import type { FuturesArbitrageReport } from '@/types';
import { clsx } from 'clsx';

export default function ReportsPage() {
  const [reports, setReports] = useState<FuturesArbitrageReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExample, setShowExample] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/export?format=json');
      const data = await res.json();
      setReports(data.data || []);
    } catch (err) {
      console.error('Failed to fetch reports', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    window.open('/api/export?format=csv', '_blank');
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return (
    <div className="p-6 lg:p-10 space-y-8 animate-in fade-in duration-700">
      <Header 
        title="Детальные Отчеты" 
        subtitle="Аналитика арбитражных возможностей по фьючерсам"
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowExample(!showExample)}
              className={clsx(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border",
                showExample 
                  ? "bg-primary-500/20 border-primary-500/30 text-primary-400" 
                  : "bg-white/5 border-white/10 text-text-secondary hover:bg-white/10"
              )}
            >
              <Eye size={18} />
              {showExample ? "Скрыть пример" : "Показать пример"}
            </button>
            <button
              onClick={fetchReports}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-medium text-text-secondary hover:bg-white/10 transition-all"
            >
              <RefreshCw size={18} className={clsx(loading && "animate-spin")} />
              Обновить
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-all shadow-lg shadow-primary-500/25"
            >
              <Download size={18} />
              Выгрузить всё (CSV)
            </button>
          </div>
        }
      />

      {loading && !showExample ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-primary-500/20 border-t-primary-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <RefreshCw size={24} className="text-primary-500/50" />
            </div>
          </div>
          <p className="text-text-muted animate-pulse">Генерация отчетов...</p>
        </div>
      ) : (reports.length > 0 || showExample) ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-8">
          {showExample && !reports.find(r => r.symbol === 'POKT/USDT:USDT') && (
             <FuturesArbDetails report={MOCK_EXAMPLE} />
          )}
          {reports.map((report, idx) => (
            <FuturesArbDetails key={`${report.symbol}-${idx}`} report={report} />
          ))}
        </div>
      ) : (
        <Card className="flex flex-col items-center justify-center py-20 text-center border-dashed">
          <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mb-6 text-text-muted">
            <Info size={40} />
          </div>
          <h3 className="text-xl font-bold text-text-primary mb-2">Активных пар не найдено</h3>
          <p className="text-text-muted max-w-md mb-8">
            На данный момент система не обнаружила прибыльных арбитражных возможностей. 
            Попробуйте запустить сканирование на главной странице.
          </p>
          <button
             onClick={() => window.location.href = '/'}
             className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-400 font-medium hover:bg-primary-500/20 transition-all"
          >
            <Play size={18} />
            Запустить сканирование
          </button>
        </Card>
      )}
    </div>
  );
}

const MOCK_EXAMPLE: FuturesArbitrageReport = {
  symbol: 'POKT/USDT:USDT',
  avgTakerFee: 0.0825,
  entrySpread: 3.085,
  exitSpread: -0.402,
  fundingDiff: 0.1601,
  timestamp: Date.now(),
  shortPosition: {
    exchange: 'mexc',
    fundingRate: -0.5025,
    fundingForecast: undefined,

    nextFundingTime: '01:54:12',
    ask: 0.01524,
    bid: 0.01523,
    takerFee: 0.1,
    volume24h: 1245000,
    url: 'https://www.mexc.com/futures/POKT_USDT'
  },
  longPosition: {
    exchange: 'gate',
    fundingRate: -0.3424,
    fundingForecast: undefined,

    nextFundingTime: '03:12:05',
    ask: 0.01476,
    bid: 0.01475,
    takerFee: 0.065,
    volume24h: 854000,
    url: 'https://www.gate.io/futures/usdt/POKT_USDT'
  }
};
