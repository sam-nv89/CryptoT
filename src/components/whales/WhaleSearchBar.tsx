'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, Globe, ChevronDown } from 'lucide-react';
import { WhaleNetwork } from '@/types/whales';

interface Props {
  onSearch: (address: string, network: WhaleNetwork) => void;
  onNetworkChange?: (network: WhaleNetwork | 'ALL') => void;
  isLoading?: boolean;
}

const NETWORKS: (WhaleNetwork | 'ALL')[] = ['ALL', 'ETH', 'BSC', 'ARB', 'SOL', 'MANTLE', 'ZKSYNC'];

// Simple network auto-detection from address format
function detectNetwork(addr: string): WhaleNetwork | 'ALL' {
  if (!addr) return 'ALL';
  if (addr.startsWith('0x')) return 'ETH';
  if (addr.length >= 32 && addr.length <= 44) return 'SOL';
  return 'ALL';
}

export const WhaleSearchBar: React.FC<Props> = ({ onSearch, onNetworkChange, isLoading }) => {
  const [address, setAddress] = useState('');
  const [network, setNetwork] = useState<WhaleNetwork | 'ALL'>('ALL');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const onNetworkChangeRef = useRef(onNetworkChange);
  useEffect(() => { onNetworkChangeRef.current = onNetworkChange; }, [onNetworkChange]);

  useEffect(() => {
    onNetworkChangeRef.current?.(network);
  }, [network]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-detect network when address changes
  useEffect(() => {
    if (address && network === 'ALL') {
      const detected = detectNetwork(address.trim());
      if (detected !== 'ALL') setNetwork(detected);
    }
  }, [address, network]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (address.trim() && network !== 'ALL' && !isLoading) {
      onSearch(address.trim(), network as WhaleNetwork);
      setAddress('');
    }
  };

  return (
    <div className="mb-6 animate-fade-in">
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-text-muted group-focus-within:text-primary-400 transition-colors">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Paste wallet address (0x... or Solana base58)"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-text-muted focus:outline-none focus:border-primary-500/50 focus:bg-white/[0.05] transition-all text-sm"
          />
        </div>

        <div className="flex gap-2">
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className={`h-full border rounded-xl py-3 pl-9 pr-9 text-sm text-white focus:outline-none transition-all flex items-center gap-2 min-w-[120px] ${
                isOpen ? 'bg-white/10 border-primary-500/50' : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.08]'
              }`}
            >
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-text-muted"><Globe size={15} /></div>
              <span className="font-medium">{network}</span>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-text-muted">
                <ChevronDown size={13} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {isOpen && (
              <div className="absolute top-full mt-1 left-0 w-full min-w-[160px] bg-[#0b0e14] border border-white/30 rounded-xl shadow-[0_12px_48px_rgba(0,0,0,0.9)] z-[100] overflow-hidden animate-fade-in ring-1 ring-white/10">
                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => { setNetwork('ALL'); setIsOpen(false); }}
                    className={`w-full text-left px-4 py-3 text-sm transition-all flex items-center justify-between border-b border-white/5 ${
                      network === 'ALL' ? 'bg-primary-500/20 text-primary-400 font-bold' : 'text-text-secondary hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    All Networks
                    {network === 'ALL' && <div className="w-1.5 h-1.5 rounded-full bg-primary-400 shadow-[0_0_8px_#22d3ee]" />}
                  </button>
                  {NETWORKS.filter(n => n !== 'ALL').map(n => (
                    <button
                      key={n} type="button"
                      onClick={() => { setNetwork(n); setIsOpen(false); }}
                      className={`w-full text-left px-4 py-3 text-sm transition-all flex items-center justify-between ${
                        network === n ? 'bg-primary-500/20 text-primary-400 font-bold' : 'text-text-secondary hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {n}
                      {network === n && <div className="w-1.5 h-1.5 rounded-full bg-primary-400 shadow-[0_0_8px_#22d3ee]" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!address.trim() || network === 'ALL' || isLoading}
            className="bg-primary-500 hover:bg-primary-400 disabled:opacity-50 disabled:cursor-not-allowed text-background-dark font-bold px-5 rounded-xl flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(56,189,248,0.3)] active:scale-95"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
            ) : (
              <Plus size={18} />
            )}
            <span className="hidden sm:inline">Track</span>
          </button>
        </div>
      </form>
    </div>
  );
};
