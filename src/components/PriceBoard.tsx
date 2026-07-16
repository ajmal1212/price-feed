import React, { useState, useEffect, useRef } from "react";
import { 
  Activity, 
  Plus, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  Grid, 
  List, 
  RefreshCw, 
  Info, 
  Search,
  Wifi,
  WifiOff,
  Sparkles,
  DollarSign
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useKambalaFeed, TickData } from "../hooks/useKambalaFeed";
import { ResponsiveContainer, AreaChart, Area } from "recharts";
import { toast } from "sonner";

// Preset tokens for rapid testing
const PRESETS = [
  { name: "NIFTY 50", token: "NSE|26000" },
  { name: "FIN NIFTY", token: "NSE|26009" },
  { name: "BANK NIFTY", token: "NSE|26001" },
  { name: "MCX GOLD", token: "MCX|570760" },
  { name: "RELIANCE", token: "NSE|13" },
  { name: "SBIN", token: "NSE|3045" },
  { name: "TCS", token: "NSE|11536" }
];

// Individual Token Card component to isolate tick render updates and manage flash animations
interface TokenCardProps {
  token: string;
  tick?: TickData;
  onRemove: (token: string) => void;
  tickHistory: number[];
}

const TokenCard: React.FC<TokenCardProps> = ({ token, tick, onRemove, tickHistory }) => {
  const lpNumber = tick && tick.lp && !isNaN(parseFloat(tick.lp)) ? parseFloat(tick.lp) : null;
  const pcNumber = tick && tick.pc && !isNaN(parseFloat(tick.pc)) ? parseFloat(tick.pc) : null;

  const isPositive = pcNumber !== null ? pcNumber >= 0 : true;

  // Chart data formatting
  const chartData = tickHistory.map((val, idx) => ({ id: idx, price: val }));

  return (
    <Card className="relative overflow-hidden transition-all duration-300 border-border/60 hover:border-primary/45 hover:shadow-md hover:translate-y-[-2px] bg-card">
      {/* Dynamic side accent */}
      <div className={`absolute top-0 left-0 bottom-0 w-1 ${isPositive ? "bg-emerald-500" : "bg-rose-500"}`} />

      <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs font-bold text-muted-foreground uppercase tracking-wider">{token.split('|')[0]}</span>
            <Badge variant="outline" className="text-[10px] px-1 py-0 font-mono bg-slate-50 dark:bg-slate-900 border-border/80">
              ID: {token.split('|')[1] || token}
            </Badge>
          </div>
          <CardTitle className="text-base font-extrabold mt-1 tracking-tight text-foreground truncate">
            {token === "NSE|26000" ? "NIFTY 50" : token === "NSE|26009" ? "NIFTY FIN SERVICE" : token === "NSE|26001" ? "NIFTY BANK" : token === "MCX|570760" ? "MCX GOLD" : token.split('|')[1]}
          </CardTitle>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => onRemove(token)}
          className="h-7 w-7 text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="p-4 pt-1 space-y-3">
        {/* Main price section */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono tracking-tight text-foreground">
                {lpNumber !== null ? lpNumber.toFixed(2) : "—"}
              </span>
              {pcNumber !== null && (
                <Badge className={`text-xs font-black px-2 py-0.5 rounded pointer-events-none border shadow-none ${
                  isPositive 
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30" 
                    : "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border-rose-100 dark:border-rose-900/30"
                }`}>
                  {isPositive ? "+" : ""}{pcNumber.toFixed(2)}%
                </Badge>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground font-semibold mt-0.5">Last Traded Price</span>
          </div>
        </div>

        {/* Sparkline chart */}
        <div className="h-[40px] w-full rounded overflow-hidden mt-1 opacity-80">
          {chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 2, bottom: 2, left: 0, right: 0 }}>
                <defs>
                  <linearGradient id={`gradient-${token}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isPositive ? "#10b981" : "#f43f5e"} stopOpacity={0.4}/>
                    <stop offset="95%" stopColor={isPositive ? "#10b981" : "#f43f5e"} stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <Area 
                  type="monotone" 
                  dataKey="price" 
                  stroke={isPositive ? "#10b981" : "#f43f5e"} 
                  strokeWidth={1.5}
                  fillOpacity={1} 
                  fill={`url(#gradient-${token})`} 
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center border border-dashed border-border/40 rounded text-[10px] text-muted-foreground font-medium italic">
              Gathering ticks...
            </div>
          )}
        </div>

        {/* Grid Stats details */}
        <div className="grid grid-cols-3 gap-1.5 text-[11px] pt-1.5 border-t border-border/30">
          <div className="flex flex-col">
            <span className="text-muted-foreground font-semibold">Open</span>
            <span className="font-mono font-bold text-foreground">{tick?.o ? parseFloat(tick.o).toFixed(2) : "—"}</span>
          </div>
          <div className="flex flex-col text-center">
            <span className="text-muted-foreground font-semibold">High</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{tick?.h ? parseFloat(tick.h).toFixed(2) : "—"}</span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-muted-foreground font-semibold">Low</span>
            <span className="font-mono font-bold text-rose-500 dark:text-rose-400">{tick?.l ? parseFloat(tick.l).toFixed(2) : "—"}</span>
          </div>
        </div>

        <div className="flex justify-between items-center text-[10px] text-muted-foreground/80 font-mono">
          <span>Vol: {tick?.v ? parseInt(tick.v).toLocaleString() : "—"}</span>
          <span>{tick?.ts ? new Date(parseInt(tick.ts) * 1000).toLocaleTimeString() : "—"}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export function PriceBoard() {
  const [tokens, setTokens] = useState<string[]>(() => {
    const saved = localStorage.getItem("kambala_tokens");
    return saved ? JSON.parse(saved) : ["NSE|26009", "NSE|26000", "MCX|570760"];
  });

  const [inputToken, setInputToken] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [tickHistories, setTickHistories] = useState<Record<string, number[]>>({});
  
  // Live Feed Hook
  const { ticks: liveTicks, isConnected: liveConnected } = useKambalaFeed(tokens);

  // Simulation Mode state (to wow users if actual market stream is offline)
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedTicks, setSimulatedTicks] = useState<Record<string, TickData>>({});
  const simIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [tickCount, setTickCount] = useState(0);

  // Combine ticks based on simulation mode
  const ticks = isSimulating ? simulatedTicks : liveTicks;
  const isConnected = isSimulating ? true : liveConnected;

  // Persist tokens
  useEffect(() => {
    localStorage.setItem("kambala_tokens", JSON.stringify(tokens));
  }, [tokens]);

  // Track tick prices for Recharts sparklines
  useEffect(() => {
    // We update histories whenever a new tick arrives
    const nowTicks = isSimulating ? simulatedTicks : liveTicks;
    setTickHistories(prev => {
      const updated = { ...prev };
      Object.keys(nowTicks).forEach(token => {
        const pc = parseFloat(nowTicks[token].pc);
        if (!isNaN(pc)) {
          const currentHistory = updated[token] || [];
          // Keep last 15 ticks
          const nextHistory = [...currentHistory, pc];
          if (nextHistory.length > 15) {
            nextHistory.shift();
          }
          updated[token] = nextHistory;
        }
      });
      return updated;
    });

    if (Object.keys(nowTicks).length > 0) {
      setTickCount(c => c + 1);
    }
  }, [liveTicks, simulatedTicks, isSimulating]);

  // Simulate price feed ticks
  useEffect(() => {
    if (isSimulating) {
      // Initialize simulation ticks
      const initTicks: Record<string, TickData> = {};
      tokens.forEach(tok => {
        const base = tok === "NSE|26000" ? 22000 : tok === "NSE|26009" ? 20000 : tok === "NSE|26001" ? 48000 : 500;
        initTicks[tok] = {
          token: tok,
          lp: base.toString(),
          pc: "0.0",
          o: (base - 10).toString(),
          h: (base + 50).toString(),
          l: (base - 30).toString(),
          c: base.toString(),
          v: "1000",
          ts: Math.floor(Date.now() / 1000).toString()
        };
      });
      setSimulatedTicks(initTicks);

      simIntervalRef.current = setInterval(() => {
        setSimulatedTicks(prev => {
          const updated = { ...prev };
          // Randomly update 1 or 2 tokens
          const tokensToUpdate = tokens.filter(() => Math.random() > 0.4);
          tokensToUpdate.forEach(tok => {
            const current = updated[tok];
            if (!current) return;
            const currentPrice = parseFloat(current.lp);
            const deltaPercent = (Math.random() - 0.5) * 0.08; // -0.04% to +0.04%
            const delta = currentPrice * deltaPercent;
            const newPrice = Math.max(1, currentPrice + delta);

            const openPrice = parseFloat(current.o || current.lp);
            const currentPc = ((newPrice - openPrice) / openPrice) * 100;

            const high = parseFloat(current.h || "0");
            const low = parseFloat(current.l || "999999");

            updated[tok] = {
              ...current,
              lp: newPrice.toFixed(2),
              pc: currentPc.toFixed(2),
              h: Math.max(high, newPrice).toFixed(2),
              l: Math.min(low, newPrice).toFixed(2),
              v: (parseInt(current.v || "0") + Math.floor(Math.random() * 50)).toString(),
              ts: Math.floor(Date.now() / 1000).toString()
            };
          });
          return updated;
        });
      }, 1000);
    } else {
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current);
        simIntervalRef.current = null;
      }
    }

    return () => {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    };
  }, [isSimulating, JSON.stringify(tokens)]);

  const handleAddToken = (tokenStr: string) => {
    const formatted = tokenStr.trim();
    if (!formatted) return;
    
    // Simple verification
    if (!formatted.includes("|")) {
      toast.error("Invalid token format. Use 'EXCHANGE|NUMBER' (e.g. NSE|26000)");
      return;
    }

    if (tokens.includes(formatted)) {
      toast.info("Token is already in subscription list.");
      return;
    }

    setTokens(prev => [...prev, formatted]);
    setInputToken("");
    toast.success(`Subscribed to ${formatted}`);
  };

  const handleRemoveToken = (tokenStr: string) => {
    setTokens(prev => prev.filter(t => t !== tokenStr));
    setTickHistories(prev => {
      const updated = { ...prev };
      delete updated[tokenStr];
      return updated;
    });
    toast.info(`Unsubscribed from ${tokenStr}`);
  };

  const filteredTokens = tokens.filter(t => 
    t.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (t === "NSE|26000" && "nifty 50".includes(searchQuery.toLowerCase())) ||
    (t === "NSE|26009" && "nifty fin service".includes(searchQuery.toLowerCase())) ||
    (t === "NSE|26001" && "nifty bank".includes(searchQuery.toLowerCase())) ||
    (t === "MCX|570760" && "mcx gold".includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Connection and Header Card */}
      <Card className="rounded-2xl border-border/60 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/40 dark:to-slate-900 shadow-md">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isConnected ? "bg-emerald-400" : "bg-rose-400"
                  }`}></span>
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${
                    isConnected ? "bg-emerald-500" : "bg-rose-500"
                  }`}></span>
                </span>
                <h2 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
                  Kambala Live Stream 
                  <span className="text-xs font-semibold text-muted-foreground">
                    ({isConnected ? "🟢 Connected" : "🔴 Reconnecting..."})
                  </span>
                </h2>
              </div>
              <p className="text-sm text-muted-foreground font-medium">
                Subscribe to real-time asset indices. Path: <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-xs font-mono">/socket.io</code> | Namespace: <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-xs font-mono">/crm.codenetic.online</code>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                variant={isSimulating ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setIsSimulating(!isSimulating);
                  toast.success(isSimulating ? "Live socket feed active" : "Dev tick simulator enabled!");
                }}
                className={`gap-1.5 font-bold rounded-xl shadow-sm ${
                  isSimulating 
                    ? "bg-gradient-to-r from-violet-500 to-indigo-600 text-white border-none" 
                    : "border-border text-muted-foreground hover:bg-slate-50 dark:hover:bg-slate-850"
                }`}
              >
                <Sparkles className="h-4 w-4" />
                {isSimulating ? "Simulation Active" : "Simulate Ticks"}
              </Button>

              <Badge variant="secondary" className="font-mono font-bold text-xs px-3 py-1 bg-white dark:bg-slate-900 border border-border/80 text-muted-foreground">
                <Wifi className="h-3 w-3 mr-1.5 text-blue-500" />
                Ticks Recv: {tickCount}
              </Badge>
            </div>
          </div>

          {/* Quick presets row */}
          <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-border/40">
            <span className="text-xs font-bold text-muted-foreground">Presets:</span>
            {PRESETS.map((preset) => (
              <Button
                key={preset.token}
                variant="outline"
                size="sm"
                disabled={tokens.includes(preset.token)}
                onClick={() => handleAddToken(preset.token)}
                className="text-[10px] h-6 px-2.5 rounded-full font-bold bg-white dark:bg-slate-900 hover:bg-primary/5 hover:text-primary transition-all border-border/60"
              >
                <Plus className="h-2.5 w-2.5 mr-1" />
                {preset.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Subscription Input and view mode switches */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Add subscription bar */}
        <div className="flex items-center w-full sm:w-auto max-w-md gap-2">
          <div className="relative flex-1 sm:w-64">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="e.g. NSE|26000"
              value={inputToken}
              onChange={(e) => setInputToken(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddToken(inputToken)}
              className="pl-9 pr-3 rounded-xl border-border bg-card font-mono text-sm focus-visible:ring-primary shadow-sm"
            />
          </div>
          <Button 
            onClick={() => handleAddToken(inputToken)}
            className="rounded-xl font-bold bg-gradient-to-r from-blue-500 to-sky-600 text-white shadow-md border-none"
          >
            Subscribe
          </Button>
        </div>

        {/* Search and Layout Tabs */}
        <div className="flex items-center w-full sm:w-auto gap-3 justify-end">
          <div className="relative w-full sm:w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Filter feeds..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 h-9 rounded-xl border-border/60 bg-card text-xs focus-visible:ring-primary shadow-sm"
            />
          </div>

          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-border/40 shrink-0">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className={`h-7 px-3.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "grid" 
                  ? "bg-white dark:bg-slate-800 text-foreground shadow-sm hover:bg-white" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Grid className="h-3.5 w-3.5 mr-1.5" />
              Grid
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className={`h-7 px-3.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "table" 
                  ? "bg-white dark:bg-slate-800 text-foreground shadow-sm hover:bg-white" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="h-3.5 w-3.5 mr-1.5" />
              Table
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content View */}
      {filteredTokens.length === 0 ? (
        <Card className="rounded-2xl border-dashed border-2 border-border/50 py-16 text-center">
          <CardContent className="space-y-3">
            <Activity className="h-10 w-10 text-muted-foreground/40 mx-auto animate-pulse" />
            <h3 className="text-base font-bold text-foreground">No Subscriptions Found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Please subscribe to a token above (e.g. <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-xs font-mono">NSE|26000</code>) or select a quick preset.
            </p>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        /* Grid Layout */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTokens.map((token) => (
            <TokenCard 
              key={token} 
              token={token} 
              tick={ticks[token]} 
              onRemove={handleRemoveToken}
              tickHistory={tickHistories[token] || []}
            />
          ))}
        </div>
      ) : (
        /* Table Layout (Terminal Style) */
        <Card className="rounded-2xl border-border/60 overflow-hidden shadow-md bg-card">
          <Table>
            <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
              <TableRow>
                <TableHead className="font-extrabold text-foreground">Token Key</TableHead>
                <TableHead className="text-right font-extrabold text-foreground">LTP (Last Price)</TableHead>
                <TableHead className="text-right font-extrabold text-foreground">High</TableHead>
                <TableHead className="text-right font-extrabold text-foreground">Low</TableHead>
                <TableHead className="text-right font-extrabold text-foreground">Volume</TableHead>
                <TableHead className="text-right font-extrabold text-foreground">Time</TableHead>
                <TableHead className="text-center font-extrabold text-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTokens.map((token) => {
                const tick = ticks[token];
                const lp = tick && tick.lp && !isNaN(parseFloat(tick.lp)) ? parseFloat(tick.lp) : null;
                const change = tick && tick.pc && !isNaN(parseFloat(tick.pc)) ? parseFloat(tick.pc) : null;
                const isPositive = change !== null ? change >= 0 : true;

                return (
                  <TableRow key={token} className="hover:bg-slate-50/40 dark:hover:bg-slate-850/40 transition-colors">
                    <TableCell className="font-mono text-sm font-semibold py-4">
                      <div className="flex flex-col">
                        <span className="font-extrabold text-foreground">
                          {token === "NSE|26000" ? "NIFTY 50" : token === "NSE|26009" ? "NIFTY FIN SERVICE" : token === "NSE|26001" ? "NIFTY BANK" : token === "MCX|570760" ? "MCX GOLD" : token.split('|')[1]}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-medium">{token}</span>
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-right font-mono font-black text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <span>{lp !== null ? lp.toFixed(2) : "—"}</span>
                        {change !== null && (
                          <Badge className={`text-[10px] font-black px-1.5 py-0.5 rounded pointer-events-none border shadow-none ${
                            isPositive 
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30" 
                              : "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border-rose-100 dark:border-rose-900/30"
                          }`}>
                            {isPositive ? "+" : ""}{change.toFixed(2)}%
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-right font-mono font-semibold text-xs text-emerald-600/90 dark:text-emerald-400/90">
                      {tick?.h ? parseFloat(tick.h).toFixed(2) : "—"}
                    </TableCell>

                    <TableCell className="text-right font-mono font-semibold text-xs text-rose-500/90">
                      {tick?.l ? parseFloat(tick.l).toFixed(2) : "—"}
                    </TableCell>

                    <TableCell className="text-right font-mono text-xs text-muted-foreground">
                      {tick?.v ? parseInt(tick.v).toLocaleString() : "—"}
                    </TableCell>

                    <TableCell className="text-right font-mono text-xs text-muted-foreground/80">
                      {tick?.ts ? new Date(parseInt(tick.ts) * 1000).toLocaleTimeString() : "—"}
                    </TableCell>

                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveToken(token)}
                        className="h-8 w-8 text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
