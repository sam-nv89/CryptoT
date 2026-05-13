'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Search, Plus, Globe, ChevronDown, Radar } from 'lucide-react';
import { WhaleNetwork } from '@/types/whales';

interface Props {
  onSearch: (address: string, network: WhaleNetwork) => void;
  onNetworkChange?: (network: WhaleNetwork | 'ALL') => void;
  onDiscover?: () => void;
  isLoading?: boolean;
  isDiscovering?: boolean;
}

const NETWORKS: (WhaleNetwork | 'ALL')[] = ['ALL', 'ETH', 'BSC', 'ARB', 'SOL', 'MANTLE', 'ZKSYNC'];

// Simple network auto-detection from address format
function detectNetwork(addr: string): WhaleNetwork | 'ALL' {
  if (!addr) return 'ALL';
  if (addr.startsWith('0x')) return 'ETH';
  if (addr.length >= 32 && addr.length <= 44) return 'SOL';
  return 'ALL';
}

export const WhaleSearchBar: React.FC<Props> = ({ onSearch, onNetworkChange, onDiscover, isLoading, isDiscovering }) => {
  const [address, setAddress] = useState('');
  const [network, setNetwork] = useState<WhaleNetwork | 'ALL'>('ALL');
  const [isOpen, setIsOpen] = useState(false);
  // Ref to the trigger button — used to calculate portal dropdown position
  const btnRef = useRef<HTMLButtonElement>(null);
  // Dropdown rect state for portal positioning
  const [dropRect, setDropRect] = useState<DOMRect | null>(null);

  const onNetworkChangeRef = useRef(onNetworkChange);
  useEffect(() => { onNetworkChangeRef.current = onNetworkChange; }, [onNetworkChange]);

  useEffect(() => {
    onNetworkChangeRef.current?.(network);
  }, [network]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      // Close when clicking outside the button (portal dropdown handles its own clicks)
      if (btnRef.current && !btnRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Auto-detect network when address changes
  useEffect(() => {
    if (address && network === 'ALL') {
      const detected = detectNetwork(address.trim());
      if (detected !== 'ALL') setNetwork(detected);
    }
  }, [address, network]);

  const handleToggle = useCallback(() => {
    if (btnRef.current) {
      setDropRect(btnRef.current.getBoundingClientRect());
    }
    setIsOpen(prev => !prev);
  }, []);

  const selectNetwork = useCallback((n: WhaleNetwork | 'ALL') => {
    setNetwork(n);
    setIsOpen(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (address.trim() && network !== 'ALL' && !isLoading) {
      onSearch(address.trim(), network as WhaleNetwork);
      setAddress('');
    }
  };

  // Portal dropdown — rendered in document.body to escape backdrop-filter stacking contexts
  const dropdownPortal = isOpen && dropRect && typeof document !== 'undefined'
    ? createPortal(
        <div
          style={{
            position: 'fixed',
            top: dropRect.bottom + 4,
            left: dropRect.left,
            minWidth: Math.max(dropRect.width, 180),
            zIndex: 9999,
          }}
          onMouseDown={(e) => e.stopPropagation()} // prevent closing on internal click
        >
          <div style={{
            background: '#0b0e14',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '12px',
            boxShadow: '0 16px 56px rgba(0,0,0,0.95)',
            overflow: 'hidden',
          }}>
            {/* All Networks option */}
            <button
              type="button"
              onClick={() => selectNetwork('ALL')}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '10px 16px',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                background: network === 'ALL' ? 'rgba(6,182,212,0.15)' : 'transparent',
                color: network === 'ALL' ? '#22d3ee' : '#94a3b8',
                fontWeight: network === 'ALL' ? 700 : 400,
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (network !== 'ALL') (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = network === 'ALL' ? 'rgba(6,182,212,0.15)' : 'transparent'; (e.currentTarget as HTMLElement).style.color = network === 'ALL' ? '#22d3ee' : '#94a3b8'; }}
            >
              All Networks
              {network === 'ALL' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22d3ee', boxShadow: '0 0 8px #22d3ee', display: 'inline-block' }} />}
            </button>

            {/* Per-network options */}
            {NETWORKS.filter(n => n !== 'ALL').map(n => (
              <button
                key={n}
                type="button"
                onClick={() => selectNetwork(n)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 16px',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: network === n ? 'rgba(6,182,212,0.15)' : 'transparent',
                  color: network === n ? '#22d3ee' : '#94a3b8',
                  fontWeight: network === n ? 700 : 400,
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (network !== n) { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = '#fff'; } }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = network === n ? 'rgba(6,182,212,0.15)' : 'transparent'; (e.currentTarget as HTMLElement).style.color = network === n ? '#22d3ee' : '#94a3b8'; }}
              >
                {n}
                {network === n && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22d3ee', boxShadow: '0 0 8px #22d3ee', display: 'inline-block' }} />}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )
    : null;

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
          {/* Network selector — uses portal to escape backdrop-filter stacking contexts */}
          <button
            ref={btnRef}
            type="button"
            onClick={handleToggle}
            className={`relative border rounded-xl py-3 pl-9 pr-9 text-sm text-white focus:outline-none transition-all flex items-center gap-2 min-w-[120px] ${
              isOpen ? 'bg-white/10 border-primary-500/50' : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.08]'
            }`}
          >
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-text-muted"><Globe size={15} /></div>
            <span className="font-medium">{network}</span>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-text-muted">
              <ChevronDown size={13} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {dropdownPortal}

          <button
            type="submit"
            disabled={!address.trim() || network === 'ALL' || isLoading}
            className="bg-primary-500 hover:bg-primary-400 disabled:opacity-50 disabled:cursor-not-allowed text-background-dark font-bold px-5 rounded-xl flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(56,189,248,0.3)] active:scale-95"
          >
            {isLoading && !isDiscovering ? (
              <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
            ) : (
              <Plus size={18} />
            )}
            <span className="hidden sm:inline">Track</span>
          </button>
        </div>
      </form>
      
      {/* Discovery Button Row */}
      {onDiscover && (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onDiscover}
            disabled={isDiscovering}
            className="group flex items-center gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 px-4 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDiscovering ? (
              <>
                <div className="w-4 h-4 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                <span>Scanning DexScreener & RPCs...</span>
              </>
            ) : (
              <>
                <Radar size={16} className="group-hover:animate-pulse" />
                <span>Discover Smart Money</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
