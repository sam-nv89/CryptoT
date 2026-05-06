import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, Globe, ChevronDown } from 'lucide-react';
import { WhaleNetwork } from '@/types/whales';

interface Props {
  onSearch: (address: string, network: WhaleNetwork) => void;
}

export const WhaleSearchBar: React.FC<Props> = ({ onSearch }) => {
  const [address, setAddress] = useState('');
  const [network, setNetwork] = useState<WhaleNetwork>('ETH');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const networks: WhaleNetwork[] = ['ETH', 'BSC', 'ARB', 'SOL', 'MANTLE', 'ZKSYNC'];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (address.trim()) {
      onSearch(address.trim(), network);
      setAddress('');
    }
  };

  return (
    <div className="mb-8 animate-fade-in">
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-text-muted group-focus-within:text-primary-400 transition-colors">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Paste wallet address (0x... or Solana address)"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-text-muted focus:outline-none focus:border-primary-500/50 focus:bg-white/[0.05] transition-all"
          />
        </div>
        
        <div className="flex gap-2">
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="h-full bg-white/[0.03] border border-white/10 rounded-xl py-3.5 pl-10 pr-10 text-sm text-white focus:outline-none focus:border-primary-500/50 transition-all flex items-center gap-2 hover:bg-white/[0.05] min-w-[120px]"
            >
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-text-muted">
                <Globe size={16} />
              </div>
              <span className="font-medium">{network}</span>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-text-muted">
                <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {isOpen && (
              <div className="absolute top-full mt-2 left-0 w-full min-w-[140px] bg-[#111827] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl animate-fade-in duration-200">
                <div className="py-1">
                  {networks.map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => {
                        setNetwork(n);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
                        network === n 
                        ? 'bg-primary-500/10 text-primary-400' 
                        : 'text-text-secondary hover:bg-white/5 hover:text-white'
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
            disabled={!address.trim()}
            className="bg-primary-500 hover:bg-primary-400 disabled:opacity-50 disabled:cursor-not-allowed text-background-dark font-bold px-6 rounded-xl flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(56,189,248,0.3)] active:scale-95"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Track Whale</span>
          </button>
        </div>
      </form>
    </div>
  );
};
