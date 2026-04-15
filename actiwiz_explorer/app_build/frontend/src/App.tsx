import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Search, BarChart3, Settings, ShieldAlert, 
  Menu, ChevronRight, Zap, Info, ShieldCheck, Database, FlaskConical
} from 'lucide-react';
import { SiPython, SiSqlite, SiReact } from 'react-icons/si';
import { Overview } from './features/overview';
import { Explorer } from './features/explorer';
import { Button } from './components/ui/button';
import { Separator } from './components/ui/separator';
import { Badge } from './components/ui/badge';
import { cn } from './lib/utils';

function App() {
  const [activeView, setActiveView] = useState('overview');

  useEffect(() => {
    console.log("RENDER_SUCCESS");
    
    // Handle hash navigation
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (['overview', 'explorer'].includes(hash)) {
        setActiveView(hash);
      }
    };
    window.addEventListener('hashchange', handleHash);
    handleHash();
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'explorer', label: 'Scenario Explorer', icon: Search },
  ];

  return (
    <div className="flex h-screen bg-background font-sans text-foreground antialiased selection:bg-primary/10 selection:text-primary">
      {/* Blueprint Grid Texture Overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.03] z-[-1]" 
        style={{ backgroundImage: "url(./assets/texture-blueprint-grid.jpg)", backgroundSize: '800px' }}
      />
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 border-r bg-muted/30 flex-col shrink-0">
        <div className="p-6 flex flex-col items-center justify-center border-b">
          <img src="./assets/logo-cern-ch.png" alt="CERN Logo" className="h-14 mb-3 object-contain" />
          <div className="text-center">
            <h1 className="font-heading text-lg font-bold tracking-tight">ActiWiz Explorer</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Scientific Dashboard</p>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveView(item.id); window.location.hash = item.id; }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-200 group relative",
                activeView === item.id 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-4 w-4", activeView === item.id ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
              <span className="font-medium tracking-tight">{item.label}</span>
              {activeView === item.id && (
                <div className="absolute left-[-1rem] w-1 h-6 bg-primary rounded-r-full" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-6 mt-auto">
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 space-y-3">
            <div className="flex items-center gap-2 text-primary">
              <ShieldCheck className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Risk Level 1</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-snug">
              ActiWiz models activation for waste classification as per radiological safety criteria.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header (Mobile) */}
        <header className="md:hidden flex items-center justify-between p-4 border-b bg-background/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <img src="./assets/logo-cern-ch.png" alt="CERN Logo" className="h-6" />
            <span className="font-heading font-bold text-sm tracking-tight">ActiWiz Explorer</span>
          </div>
          <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
        </header>

        {/* Scrollable Content Container */}
        <main className="flex-1 overflow-y-auto px-4 md:px-10 py-6 md:py-8 max-w-[1400px] mx-auto w-full">
          {activeView === 'overview' && <Overview />}
          {activeView === 'explorer' && <Explorer />}
        </main>

        {/* Footer Technical Stack */}
        <footer className="border-t bg-muted/20 px-4 md:px-10 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="h-5 px-1.5 font-normal">v1.2.0-stable</Badge>
              <Badge variant="outline" className="h-5 px-1.5 font-normal">Scientific Tier 3</Badge>
            </div>
            <span className="hidden sm:inline">•</span>
            <span>© 2026 CERN Radiological Safety Division</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="uppercase tracking-widest font-bold text-[9px] text-muted-foreground/50">Tech Stack</span>
            <div className="flex items-center gap-3">
              <SiPython className="h-3.5 w-3.5 hover:text-foreground transition-colors" title="Python Backend" />
              <SiSqlite className="h-3.5 w-3.5 hover:text-foreground transition-colors" title="SQLite Database" />
              <SiReact className="h-3.5 w-3.5 hover:text-foreground transition-colors" title="React Frontend" />
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
