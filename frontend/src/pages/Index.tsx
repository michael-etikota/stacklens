import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, BarChart3, Calculator, Search, Zap, Shield, TrendingUp, HelpCircle } from "lucide-react";
import { GradientMeshCanvas } from "@/components/GradientMeshCanvas";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/AppLayout";
import { useNetworkStats } from "@/hooks/use-stacking-data";
import { useWallet } from "@/contexts/WalletContext";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const stagger = {
  initial: {},
  animate: { transition: { staggerChildren: 0.1 } },
};

function StatsTicker() {
  const { data } = useNetworkStats();
  if (!data) return null;

  const stats = [
    { label: "Total Stacked", value: `${(data.totalStacked / 1e9).toFixed(1)}B STX` },
    { label: "Average APY", value: `${data.averageAPY}%` },
    { label: "BTC Distributed", value: `${data.btcDistributed.toLocaleString()} BTC` },
    { label: "Active Stackers", value: data.activeStackers.toLocaleString() },
  ];

  return (
    <div className="overflow-hidden border-y border-border/50 bg-muted/30 backdrop-blur-sm">
      <div className="flex animate-ticker whitespace-nowrap py-3">
        {[...stats, ...stats].map((s, i) => (
          <div key={i} className="flex items-center gap-2 px-8">
            <span className="text-xs text-muted-foreground">{s.label}</span>
            <span className="text-sm font-semibold font-mono text-accent">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const valueProps = [
  { icon: BarChart3, title: "Real-Time Analytics", desc: "Live stacking data, APY tracking, and reward monitoring across all cycles." },
  { icon: Calculator, title: "Smart Simulations", desc: "Model your stacking rewards with advanced projections for Solo and Pool modes." },
  { icon: Search, title: "Pool Intelligence", desc: "Compare pools by performance, fees, and reliability to find the best fit." },
];

const steps = [
  { icon: Zap, title: "Connect", desc: "Link your Stacks wallet in one click" },
  { icon: BarChart3, title: "Analyze", desc: "View your stacking position and rewards" },
  { icon: Calculator, title: "Simulate", desc: "Model future returns with our calculator" },
  { icon: TrendingUp, title: "Optimize", desc: "Make data-driven stacking decisions" },
];

const faqs = [
  { q: "What is STX stacking?", a: "Stacking is the process of locking STX tokens to support the Stacks network consensus and earn BTC rewards. It's similar to staking on other networks but uniquely rewards you in Bitcoin." },
  { q: "How are rewards calculated?", a: "Rewards depend on the total STX stacked network-wide, the number of stacking slots, and the BTC committed by miners. Our simulator uses real network data to project your expected returns." },
  { q: "Solo vs Pool stacking?", a: "Solo stacking requires a minimum of ~100,000 STX and you run your own signer. Pool stacking lets you delegate any amount to a pool operator who handles the technical setup, usually for a small fee." },
  { q: "Is my data safe?", a: "StackLens is read-only — we never request transaction signing permissions. Your wallet connection is only used to fetch your public stacking data from the blockchain." },
];

export default function LandingPage() {
  const { isConnected } = useWallet();
  return (
    <AppLayout showFooter>
      {/* Hero */}
      <section className="relative overflow-hidden min-h-[600px]">
        <GradientMeshCanvas className="absolute inset-0" />
        {/* Floating orbs on top of canvas */}
        <motion.div
          className="absolute top-20 left-[10%] w-40 sm:w-72 h-40 sm:h-72 rounded-full bg-primary/10 blur-3xl"
          animate={{ y: [0, -30, 0], x: [0, 15, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-10 right-[15%] w-32 sm:w-56 h-32 sm:h-56 rounded-full bg-accent/10 blur-3xl"
          animate={{ y: [0, 20, 0], x: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 sm:w-96 h-56 sm:h-96 rounded-full bg-primary/5 blur-3xl"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="relative container py-24 md:py-36 text-center">
          <motion.div {...fadeUp} className="max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Shield className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">Stacks Ecosystem Analytics</span>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 font-display">
              Maximize Your{" "}
              <span className="text-gradient">STX Stacking</span>{" "}
              Rewards
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              The most advanced analytics dashboard for Stacks stacking. Track yields, simulate rewards, and discover the best pools — all in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="gap-2 glow-primary text-base">
                <Link to="/dashboard">
                  {isConnected ? "Go to Dashboard" : "Launch App"} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base">
                <a href="#how-it-works">Learn More</a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Ticker */}
      <StatsTicker />

      {/* Value Props */}
      <section className="container py-20 md:py-28">
        <motion.div variants={stagger} initial="initial" whileInView="animate" viewport={{ once: true, amount: 0.1 }} className="grid md:grid-cols-3 gap-6">
          {valueProps.map((vp, i) => (
            <motion.div key={i} variants={fadeUp} className="glass-card p-8 group hover:border-primary/30 transition-all relative overflow-hidden">
              {/* Gradient top accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/60 via-accent/40 to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:glow-primary transition-shadow">
                <vp.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{vp.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{vp.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="container py-20 md:py-28">
        <motion.div initial="initial" whileInView="animate" viewport={{ once: true, amount: 0.1 }} variants={fadeUp} className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 font-display">How It Works</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">Get started in four simple steps</p>
        </motion.div>
        <motion.div variants={stagger} initial="initial" whileInView="animate" viewport={{ once: true, amount: 0.1 }} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <motion.div key={i} variants={fadeUp} className="relative text-center p-6">
              <div className="inline-flex h-14 w-14 rounded-2xl bg-accent/10 items-center justify-center mb-4">
                <step.icon className="h-7 w-7 text-accent" />
              </div>
              <div className="text-xs font-mono text-accent mb-2">0{i + 1}</div>
              <h3 className="font-semibold mb-1">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Trusted By / Social Proof */}
      <section className="border-y border-border/50 bg-muted/20">
        <div className="container py-16 md:py-20">
          <motion.div initial="initial" whileInView="animate" viewport={{ once: true, amount: 0.1 }} variants={fadeUp} className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-2 font-display">Trusted by the Community</h2>
            <p className="text-muted-foreground text-sm">Powering stacking intelligence across the ecosystem</p>
          </motion.div>
          <motion.div variants={stagger} initial="initial" whileInView="animate" viewport={{ once: true, amount: 0.1 }} className="grid grid-cols-3 gap-6 max-w-2xl mx-auto mb-12">
            {[
              { value: "2.4B", label: "STX Analyzed" },
              { value: "12,500+", label: "Active Users" },
              { value: "85,000+", label: "Simulations Run" },
            ].map((stat, i) => (
              <motion.div key={i} variants={fadeUp} className="text-center">
                <div className="text-2xl md:text-3xl font-bold font-mono text-gradient">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 opacity-40">
            {["Friedger Pool", "Fast Pool", "Planbetter", "ALEX Lab"].map((name) => (
              <div key={name} className="text-sm font-medium text-muted-foreground">{name}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="container py-20 md:py-28">
        <motion.div initial="initial" whileInView="animate" viewport={{ once: true, amount: 0.1 }} variants={fadeUp} className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 font-display">See It in Action</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">A real-time dashboard built for serious stackers</p>
        </motion.div>
        <motion.div initial="initial" whileInView="animate" viewport={{ once: true, amount: 0.1 }} variants={fadeUp} className="relative max-w-4xl mx-auto">
          {/* Mock dashboard preview */}
          <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm p-6 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "STX Balance", value: "245,000 STX", accent: false },
                { label: "Currently Stacked", value: "200,000 STX", accent: false },
                { label: "Current APY", value: "8.5%", accent: true },
                { label: "BTC Rewards", value: "0.0842 BTC", accent: true },
              ].map((m) => (
                <div key={m.label} className="p-4 rounded-xl bg-muted/30 border border-border/50">
                  <div className="text-xs text-muted-foreground mb-1">{m.label}</div>
                  <div className={`text-sm font-bold font-mono ${m.accent ? "text-accent" : ""}`}>{m.value}</div>
                </div>
              ))}
            </div>
            {/* Mini chart SVG */}
            <div className="h-32 rounded-xl bg-muted/10 border border-border/30 p-4 overflow-hidden">
              <svg viewBox="0 0 400 100" className="w-full h-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="previewGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,70 C40,65 60,55 100,50 C140,45 160,60 200,40 C240,20 260,35 300,25 C340,15 360,20 400,10 L400,100 L0,100 Z"
                  fill="url(#previewGrad)"
                />
                <path
                  d="M0,70 C40,65 60,55 100,50 C140,45 160,60 200,40 C240,20 260,35 300,25 C340,15 360,20 400,10"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                {/* Data dots */}
                {[[0,70],[100,50],[200,40],[300,25],[400,10]].map(([cx,cy], i) => (
                  <circle key={i} cx={cx} cy={cy} r="3" fill="hsl(var(--primary))" />
                ))}
              </svg>
            </div>
          </div>
          {/* Blur overlay */}
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-4">
            <p className="text-lg font-semibold">Connect Your Wallet to View Your Stats</p>
            <Button asChild className="gap-2 glow-primary">
              <Link to="/dashboard">
                Launch Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </section>

      {/* FAQ */}
      <section className="container py-20 md:py-28 max-w-2xl">
        <motion.div initial="initial" whileInView="animate" viewport={{ once: true, amount: 0.1 }} variants={fadeUp} className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-4 font-display flex items-center justify-center gap-3">
            <HelpCircle className="h-7 w-7 text-primary" /> FAQ
          </h2>
        </motion.div>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="border-border/50">
              <AccordionTrigger className="text-left hover:no-underline">{faq.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </AppLayout>
  );
}
