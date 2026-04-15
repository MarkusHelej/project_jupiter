import React, { useState, useEffect, useCallback } from 'react';
import { 
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell 
} from '../components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem 
} from '../components/ui/select';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription 
} from '../components/ui/dialog';
import { ScrollArea } from '../components/ui/scroll-area';
import { 
  Search, Filter, ExternalLink, Info, 
  Database, Activity, Radiation, FlaskConical, Layers, Settings2
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { rpcCall } from '../api';
import { cn } from '../lib/utils';

export function Explorer() {
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ machine: 'all', material: 'all', search: '' });
  const [selectedScenario, setSelectedScenario] = useState<any>(null);
  const [nuclides, setNuclides] = useState<any[]>([]);
  const [loadingNuclides, setLoadingNuclides] = useState(false);

  // Machine and Material options would typically come from backend, but we'll use a subset based on manifest or common values
  const machineOptions = ["14GeVc", "450GeVc", "7TeVc", "all"];
  const materialOptions = ["steel", "concrete", "aluminum", "copper", "all"];

  const fetchScenarios = useCallback(async () => {
    setLoading(true);
    try {
      const activeFilters: any = {};
      if (filters.machine !== 'all') activeFilters.machine = filters.machine;
      if (filters.material !== 'all') activeFilters.material = filters.material;
      
      const data = await rpcCall({ func: 'get_scenarios', args: { filters: activeFilters, limit: 100 } });
      
      // Client-side search for ID or Position
      const filtered = data.filter((s: any) => 
        s.position?.toLowerCase().includes(filters.search.toLowerCase()) || 
        s.id.toString().includes(filters.search)
      );
      setScenarios(filtered);
    } catch (err) {
      console.error("Failed to fetch scenarios", err);
    } finally {
      setLoading(false);
    }
  }, [filters.machine, filters.material, filters.search]);

  useEffect(() => {
    fetchScenarios();
  }, [fetchScenarios]);

  const handleRowClick = async (scenario: any) => {
    setSelectedScenario(scenario);
    setNuclides([]); // Reset before fetch
    setLoadingNuclides(true);
    try {
      const data = await rpcCall({ func: 'get_nuclide_breakdown', args: { scenario_id: scenario.id } });
      console.log("[DEBUG] get_nuclide_breakdown data:", data);
      setNuclides(data || []);
    } catch (err) {
      console.error("Failed to fetch nuclide breakdown", err);
    } finally {
      // Ensure loading state is cleared even if component is unmounting
      setLoadingNuclides(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="font-heading text-2xl font-bold tracking-tight">Scenario Explorer</h2>
          <p className="text-muted-foreground">Browse and analyze high-precision simulation data.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by ID or Position..." 
              className="pl-9 h-9" 
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
          <Select value={filters.machine} onValueChange={(val) => setFilters(prev => ({ ...prev, machine: val }))}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Machine" />
            </SelectTrigger>
            <SelectContent>
              {machineOptions.map(opt => <SelectItem key={opt} value={opt}>{opt === 'all' ? 'All Machines' : opt}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filters.material} onValueChange={(val) => setFilters(prev => ({ ...prev, material: val }))}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Material" />
            </SelectTrigger>
            <SelectContent>
              {materialOptions.map(opt => <SelectItem key={opt} value={opt}>{opt === 'all' ? 'All Materials' : opt}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => setFilters({ machine: 'all', material: 'all', search: '' })}>
            <Settings2 className="h-4 w-4 mr-2" /> Reset
          </Button>
        </div>
      </div>

      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-320px)] min-h-[400px]">
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0 z-10 backdrop-blur-sm shadow-sm">
                <TableRow>
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead>Machine</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead className="text-right">Activation Index</TableHead>
                  <TableHead className="text-right">Activity (Bq/g)</TableHead>
                  <TableHead className="text-right">Dose Rate @10cm (µSv/h)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}><div className="h-4 w-full bg-muted animate-pulse rounded" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : scenarios.length > 0 ? (
                  scenarios.map((s) => (
                    <TableRow 
                      key={s.id} 
                      className="cursor-pointer hover:bg-muted/50 transition-colors group"
                      onClick={() => handleRowClick(s)}
                    >
                      <TableCell className="font-mono text-xs">{s.id}</TableCell>
                      <TableCell><Badge variant="outline">{s.machine}</Badge></TableCell>
                      <TableCell className="text-sm">{s.position}</TableCell>
                      <TableCell className="capitalize text-sm">{s.material}</TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        <span className={cn(
                          s.activation_index > 1 ? "text-rose-600 font-bold" : "text-emerald-600"
                        )}>
                          {s.activation_index.toFixed(4)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">{s.total_activity_Bq_g.toExponential(2)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        <div className="flex items-center justify-end gap-2">
                          {s.DR_10cm_uSv_h.toFixed(2)}
                          <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      No scenarios found matching filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Scenario Detail Dialog */}
      <Dialog open={!!selectedScenario} onOpenChange={(open) => !open && setSelectedScenario(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden border-border/50">
          {selectedScenario && (
            <div className="flex flex-col h-full max-h-[90vh]">
              <DialogHeader className="p-6 bg-muted/30 border-b">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        {selectedScenario.machine}
                      </Badge>
                      <Badge variant="outline" className="bg-muted text-muted-foreground">
                        {selectedScenario.material}
                      </Badge>
                    </div>
                    <DialogTitle className="font-heading text-2xl font-bold">{selectedScenario.position}</DialogTitle>
                    <DialogDescription className="text-xs font-mono uppercase tracking-wider">
                      Scenario ID: {selectedScenario.id} • {selectedScenario.energy_GeV} GeV Energy
                    </DialogDescription>
                  </div>
                  <div className="text-right hidden sm:block">
                    <div className="text-xs text-muted-foreground uppercase font-bold tracking-tight mb-1">Activation Index</div>
                    <div className={cn(
                      "text-3xl font-bold font-heading",
                      selectedScenario.activation_index > 1 ? "text-rose-600" : "text-emerald-600"
                    )}>
                      {selectedScenario.activation_index.toFixed(4)}
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <ScrollArea className="flex-1 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Metadata & Key Metrics */}
                  <div className="space-y-6">
                    <section>
                      <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                        <Info className="h-3 w-3" /> Core Metrics
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <MetricBox label="Mass" value={`${selectedScenario.mass_kg} kg`} icon={Layers} />
                        <MetricBox label="IRAS" value={selectedScenario.IRAS.toExponential(2)} icon={FlaskConical} />
                        <MetricBox label="Total Activity" value={`${selectedScenario.total_activity_Bq_g.toExponential(2)} Bq/g`} icon={Activity} />
                        <MetricBox label="Co-60 Equivalent" value={selectedScenario.Co_60_eq.toExponential(2)} icon={Radiation} />
                      </div>
                    </section>

                    <section className="p-4 rounded-lg bg-slate-950 text-slate-100 border border-slate-800">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Dose Rate Profile (µSv/h)</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">At 10cm Distance</span>
                          <span className="text-lg font-mono font-bold text-amber-400">{selectedScenario.DR_10cm_uSv_h.toFixed(2)}</span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-amber-400 transition-all duration-500" 
                            style={{ width: `${Math.min(100, (selectedScenario.DR_10cm_uSv_h / 50) * 100)}%` }} 
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">At 40cm Distance</span>
                          <span className="text-lg font-mono font-bold text-amber-400">{selectedScenario.DR_40cm_uSv_h.toFixed(2)}</span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-amber-400/70 transition-all duration-500" 
                            style={{ width: `${Math.min(100, (selectedScenario.DR_40cm_uSv_h / 50) * 100)}%` }} 
                          />
                        </div>
                      </div>
                    </section>
                  </div>

                  {/* Nuclide Breakdown Chart */}
                  <div className="space-y-6">
                    <section>
                      <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                        <Radiation className="h-3 w-3" /> Top 10 Isotopes (Bq/g)
                      </h4>
                      <div className="h-[300px] w-full border rounded-lg p-4 bg-muted/20">
                        {loadingNuclides ? (
                          <div className="h-full w-full flex items-center justify-center gap-2">
                            <div className="h-4 w-4 bg-primary animate-bounce rounded-full" />
                            <div className="h-4 w-4 bg-primary animate-bounce rounded-full [animation-delay:-.3s]" />
                            <div className="h-4 w-4 bg-primary animate-bounce rounded-full [animation-delay:-.5s]" />
                          </div>
                        ) : nuclides.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={nuclides} layout="vertical" margin={{ left: 10, right: 30 }}>
                              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                              <XAxis type="number" hide domain={[0, 'auto']} />
                              <YAxis 
                                dataKey="nuclide_name" 
                                type="category" 
                                tick={{ fontSize: 11, fontWeight: 600, fill: 'hsl(var(--muted-foreground))' }}
                                width={80}
                                interval={0}
                              />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: 'hsl(var(--background))', 
                                  borderColor: 'hsl(var(--border))',
                                  borderRadius: '8px',
                                  fontSize: '12px',
                                  color: 'hsl(var(--foreground))'
                                }}
                                formatter={(value: any) => [`${parseFloat(value).toExponential(2)} Bq/g`, 'Activity']}
                              />
                              <Bar 
                                dataKey="activity_Bq_g" 
                                fill="hsl(var(--primary))" 
                                radius={[0, 4, 4, 0]}
                                barSize={20}
                                isAnimationActive={false}
                              >
                                {nuclides.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={index < 3 ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground)/0.5)'} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm">
                            No nuclide data available.
                          </div>
                        )}
                      </div>
                    </section>
                  </div>
                </div>
              </ScrollArea>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MetricBox({ label, value, icon: Icon }: any) {
  return (
    <div className="p-3 border rounded-lg bg-background shadow-sm space-y-1">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-3 w-3" />
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-sm font-mono font-bold truncate">{value}</div>
    </div>
  );
}
