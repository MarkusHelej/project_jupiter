import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell, Legend 
} from 'recharts';
import { 
  LayoutDashboard, Activity, Zap, Info, 
  ShieldAlert, Database, Server
} from 'lucide-react';
import { rpcCall } from '../api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { cn } from '../lib/utils';

export function Overview() {
  const [stats, setStats] = useState<any>(null);
  const [machineData, setMachineData] = useState<any[]>([]);
  const [distData, setDistData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [s, m, d] = await Promise.all([
        rpcCall({ func: 'get_stats' }),
        rpcCall({ func: 'get_machine_comparison' }),
        rpcCall({ func: 'get_activation_distribution', args: { metric: 'activation_index' } })
      ]);
      setStats(s);
      setMachineData(m);
      
      // Histogram binning for distribution
      const values = d.map((v: any) => v.value).sort((a: number, b: number) => a - b);
      if (values.length > 0) {
        const min = values[0];
        const max = values[values.length - 1];
        const binCount = 20;
        const binSize = (max - min) / binCount;
        const bins = Array.from({ length: binCount }, (_, i) => ({
          range: `${(min + i * binSize).toFixed(2)}`,
          count: values.filter((v: number) => v >= min + i * binSize && v < min + (i + 1) * binSize).length
        }));
        setDistData(bins);
      }
    } catch (err) {
      console.error("Failed to fetch overview data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading || !stats) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-[240px] bg-muted rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-muted rounded-lg" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-[350px] bg-muted rounded-lg" />
          <div className="h-[350px] bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  const statItems = [
    { label: 'Simulated Machines', value: stats.machine_count, icon: Server, color: 'text-blue-600' },
    { label: 'Total Scenarios', value: stats.scenario_count, icon: Database, color: 'text-emerald-600' },
    { label: 'Avg Activation Index', value: stats.avg_activation_index?.toFixed(3), icon: Zap, color: 'text-amber-600' },
    { label: 'Max Dose Rate (10cm)', value: `${stats.max_dr_10cm?.toFixed(2)} µSv/h`, icon: Activity, color: 'text-rose-600' },
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* Hero Section */}
      <div className="relative rounded-xl overflow-hidden h-[280px] bg-cover bg-center border border-border shadow-sm"
        style={{ backgroundImage: "url(./assets/hero-lhc-tunnel.jpg)" }}>
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/40 to-transparent" />
        <div className="relative h-full flex flex-col justify-center p-8 max-w-2xl">
          <Badge variant="outline" className="w-fit mb-3 bg-background/50 backdrop-blur-sm border-primary/20 text-primary uppercase tracking-widest text-[10px] font-bold">
            Particle Accelerator Safety
          </Badge>
          <h1 className="font-heading text-4xl font-bold tracking-tight mb-3">ActiWiz Explorer</h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            High-precision radiological risk assessment for CERN accelerator environments. 
            Analyze induced radioactivity, dose rates, and isotope production across the machine complex.
          </p>
          <div className="flex gap-3 mt-6">
            <Button size="sm" onClick={() => (window as any).location.hash = '#explorer'}>Launch Scenario Browser</Button>
            <Button size="sm" variant="outline" className="bg-background/20 backdrop-blur-md">Download Methodology</Button>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statItems.map((item, i) => (
          <Card key={i} className="relative overflow-hidden group hover:border-primary/50 transition-colors">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <item.icon className="h-12 w-12" />
            </div>
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className={cn("p-2 rounded-md bg-muted", item.color)}>
                  <item.icon className="h-4 w-4" />
                </div>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{item.label}</div>
              </div>
              <div className="text-2xl font-bold font-heading">{item.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Machine Comparison */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-heading text-lg">Machine Risk Profile</CardTitle>
                <CardDescription>Average activation index across different accelerator configurations</CardDescription>
              </div>
              <ShieldAlert className="h-5 w-5 text-muted-foreground/50" />
            </div>
          </CardHeader>
          <CardContent className="pt-4 h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={machineData} layout="vertical" margin={{ left: 40, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="machine" 
                  type="category" 
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  width={80}
                />
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--primary)/0.05)' }}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Bar 
                  dataKey="avg_activation_index" 
                  fill="hsl(var(--primary))" 
                  radius={[0, 4, 4, 0]}
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Activation Distribution */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-heading text-lg">Activation Distribution</CardTitle>
                <CardDescription>Histogram of activation indices across all simulated scenarios</CardDescription>
              </div>
              <Activity className="h-5 w-5 text-muted-foreground/50" />
            </div>
          </CardHeader>
          <CardContent className="pt-4 h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={distData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="range" 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  label={{ value: 'Activation Index', position: 'bottom', offset: 0, fontSize: 10 }}
                />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="hsl(var(--primary))" 
                  fillOpacity={1} 
                  fill="url(#colorCount)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Feature Card */}
      <Card className="overflow-hidden border-none shadow-xl bg-slate-950 text-white">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/3 h-[200px] md:h-auto overflow-hidden">
            <img 
              src="./assets/card-radiation-warning.jpg" 
              className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity" 
              alt="Radiation signage" 
            />
          </div>
          <div className="md:w-2/3 p-8 flex flex-col justify-center space-y-4">
            <div className="flex items-center gap-2 text-amber-400">
              <ShieldAlert className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-widest">Scientific Guidance</span>
            </div>
            <h3 className="text-2xl font-bold font-heading">Radiological Risk Modeling</h3>
            <p className="text-slate-400 leading-relaxed">
              ActiWiz uses Fluka-derived data to estimate activation risks. 
              The 'Activation Index' (AI) is a normalized risk metric where AI &gt; 1 indicates 
              potential regulatory classification as radioactive waste in specific disposal scenarios.
            </p>
            <Button variant="outline" className="w-fit text-white border-white/20 hover:bg-white/10">
              Read Risk Assessment Whitepaper
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
