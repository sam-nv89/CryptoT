'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Menu, ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

interface ShellProps {
  children: React.ReactNode;
}

export function Shell({ children }: ShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    // Check local storage for preference
    const saved = localStorage.getItem('sidebar-open');
    if (saved !== null) {
      setIsSidebarOpen(saved === 'true');
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !isSidebarOpen;
    setIsSidebarOpen(newState);
    localStorage.setItem('sidebar-open', String(newState));
  };

  if (!mounted) {
    return (
      <div className="min-h-full flex">
        <Sidebar isOpen={true} onToggle={toggleSidebar} />
        <main className="flex-1 lg:ml-[260px] relative z-10 transition-all duration-300">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-full flex">
      {/* Sidebar with visibility prop */}
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />

      {/* Main content with dynamic margin */}
      <main
        className={clsx(
          'flex-1 relative z-10 transition-all duration-300 ease-in-out',
          isSidebarOpen ? 'lg:ml-[260px]' : 'lg:ml-[80px]'
        )}
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
