import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import heroImg from "@/assets/hero.jpg";
import cleanerImg from "@/assets/cleaner.jpg";
import guardImg from "@/assets/guard.jpg";
import salesImg from "@/assets/sales.jpg";
import receptionistImg from "@/assets/receptionist.jpg";
import storekeeperImg from "@/assets/storekeeper.jpg";
import marketerImg from "@/assets/marketer.jpg";
import driverImg from "@/assets/driver.jpg";
import cashierImg from "@/assets/cashier.jpg";
import loaderImg from "@/assets/loader.jpg";
import supervisorImg from "@/assets/supervisor.jpg";
import chefImg from "@/assets/chef.jpg";
import {
  checkMpesaPaymentStatus,
  initiateMpesaPayment,
  isValidKenyanPhoneNumber,
} from "@/lib/payment.functions";

export const Route = createFileRoute("/")({
  component: HomePage,
});

type Position = {
  category: string;
  emoji: string;
  title: string;
  description: string;
  salary: number;
  allowance: number;
  image: string;
};

const EXPECTED_SALARY_RANGES = [
  { value: "15000-20000", label: "Ksh 15,000 – 20,000" },
  { value: "20000-25000", label: "Ksh 20,000 – 25,000" },
  { value: "25000-30000", label: "Ksh 25,000 – 30,000" },
  { value: "30000-35000", label: "Ksh 30,000 – 35,000" },
  { value: "35000-40000", label: "Ksh 35,000 – 40,000" },
  { value: "40000-45000", label: "Ksh 40,000 – 45,000" },
  { value: "45000-50000", label: "Ksh 45,000 – 50,000" },
  { value: "50000-60000", label: "Ksh 50,000 – 60,000" },
  { value: "60000-70000", label: "Ksh 60,000 – 70,000" },
  { value: "70000-80000", label: "Ksh 70,000 – 80,000" },
  { value: "80000+", label: "Ksh 80,000+" },
] as const;

function getDefaultSalaryRange(salary: number): (typeof EXPECTED_SALARY_RANGES)[number]["value"] {
  for (const r of EXPECTED_SALARY_RANGES) {
    if (r.value === "80000+") return "80000+";
    const [minStr, maxStr] = r.value.split("-");
    const min = Number(minStr);
    const max = Number(maxStr);
    if (Number.isFinite(min) && Number.isFinite(max) && salary >= min && salary < max) return r.value;
  }
  return salary >= 80000 ? "80000+" : EXPECTED_SALARY_RANGES[0].value;
}

const POSITIONS: Position[] = [
  { category: "Operations", emoji: "🧹", title: "Cleaner", description: "Maintain cleanliness and hygiene standards across the store", salary: 22400, allowance: 500, image: cleanerImg },
  { category: "Security", emoji: "🛡️", title: "Guard", description: "Ensure safety and security of premises and customers", salary: 27000, allowance: 700, image: guardImg },
  { category: "Sales", emoji: "🛒", title: "Sales Attendant", description: "Assist customers and manage product displays", salary: 25000, allowance: 500, image: salesImg },
  { category: "Administration", emoji: "📞", title: "Receptionist", description: "Front desk management and customer service", salary: 34000, allowance: 3000, image: receptionistImg },
  { category: "Inventory", emoji: "📦", title: "Store Keeper", description: "Manage stock inventory and storage organization", salary: 22000, allowance: 500, image: storekeeperImg },
  { category: "Marketing", emoji: "📊", title: "Distributor & Marketer", description: "Product distribution and marketing activities", salary: 29000, allowance: 1500, image: marketerImg },
  { category: "Logistics", emoji: "🚛", title: "Driver", description: "Transport goods and ensure timely deliveries", salary: 27400, allowance: 2500, image: driverImg },
  { category: "Finance", emoji: "💰", title: "Accountant & Cashier", description: "Handle financial transactions and bookkeeping", salary: 32000, allowance: 3000, image: cashierImg },
  { category: "Warehouse", emoji: "💪", title: "Loader & Off-loader", description: "Loading and unloading of goods and merchandise", salary: 17000, allowance: 500, image: loaderImg },
  { category: "Management", emoji: "📋", title: "Warehouse Supervisor", description: "Oversee warehouse operations and staff", salary: 31000, allowance: 2000, image: supervisorImg },
  { category: "Food Services", emoji: "👨‍🍳", title: "Chef", description: "Prepare quality meals for staff and customers", salary: 23750, allowance: 1500, image: chefImg },
];

const LOCATIONS = ["Nairobi - CBD", "Nairobi - Eastlands", "Nairobi - Westlands", "Kiambu", "Thika", "Nakuru", "Mombasa", "Kisumu", "Eldoret", "Machakos"];
const EDUCATION = ["KCPE Certificate", "KCSE Certificate", "Certificate", "Diploma", "Bachelor's Degree", "Master's Degree"];

type Stage = "browse" | "form" | "processing" | "qualified" | "booking" | "payment" | "stk" | "success";

type PaymentSession = {
  checkoutRequestId: string;
  normalizedPhone: string;
  reference: string;
};

type PaymentResult = {
  receiptNumber?: string | null;
  resultDesc?: string;
};

function HomePage() {
  const [stage, setStage] = useState<Stage>("browse");
  const [selected, setSelected] = useState<Position | null>(null);
  const [refundCode] = useState(() => "MG-" + Math.random().toString(36).slice(2, 8).toUpperCase() + "-" + Math.floor(Math.random() * 9000 + 1000));
  const [paymentSession, setPaymentSession] = useState<PaymentSession | null>(null);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [stage]);

  const openApply = (p: Position) => {
    setSelected(p);
    setStage("form");
  };

  return (
    <div className="min-h-screen">
      <Header />
      {stage === "browse" && <Browse onApply={openApply} />}
      {stage === "form" && selected && <ApplicationForm position={selected} onBack={() => setStage("browse")} onSubmit={() => setStage("processing")} />}
      {stage === "processing" && <Processing onDone={() => setStage("qualified")} />}
      {stage === "qualified" && selected && <Qualified position={selected} onBook={() => setStage("booking")} />}
      {stage === "booking" && selected && <BookingForm position={selected} onContinue={() => setStage("payment")} onBack={() => setStage("qualified")} />}
      {stage === "payment" && (
        <PaymentScreen
          onPay={(session) => {
            setPaymentSession(session);
            setPaymentResult(null);
            setStage("stk");
          }}
          onBack={() => setStage("booking")}
        />
      )}
      {stage === "stk" && paymentSession && (
        <StkLoader
          checkoutRequestId={paymentSession.checkoutRequestId}
          onDone={(result) => {
            setPaymentResult(result);
            setStage("success");
          }}
          onRetry={() => setStage("payment")}
        />
      )}
      {stage === "success" && selected && (
        <SuccessScreen
          position={selected}
          refundCode={refundCode}
          receiptNumber={paymentResult?.receiptNumber ?? null}
          onHome={() => {
            setPaymentSession(null);
            setPaymentResult(null);
            setStage("browse");
          }}
        />
      )}
      <Footer />
    </div>
  );
}

/* ============ HEADER ============ */
function Header() {
  return (
    <header className="sticky top-0 z-50 glass border-b border-white/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex items-center justify-between">
        <Logo />
        <div className="hidden sm:flex items-center gap-2 text-xs">
          <span className="size-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-muted-foreground font-semibold">Now Hiring · 11 Open Positions</span>
        </div>
      </div>
    </header>
  );
}

function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative size-10 rounded-xl brand-gradient grid place-items-center shadow-orange">
        <span className="text-white font-black text-lg">M</span>
        <span className="absolute -top-1 -right-1 size-3 rounded-full bg-[color:var(--brand-yellow)] border-2 border-white" />
      </div>
      <div className="leading-tight">
        <div className={`font-black text-lg tracking-tight ${light ? "text-white" : "text-[color:var(--brand-ink)]"}`}>MAGUNAS</div>
        <div className={`text-[10px] font-semibold tracking-wider uppercase ${light ? "text-white/80" : "text-[color:var(--brand-orange)]"}`}>Careers Portal</div>
      </div>
    </div>
  );
}

/* ============ BROWSE ============ */
function Browse({ onApply }: { onApply: (p: Position) => void }) {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 hero-gradient" />
        <img src={heroImg} alt="Magunas Supermarket team" className="absolute inset-0 size-full object-cover mix-blend-overlay opacity-40" width={1920} height={1280} />
        <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--brand-ink)]/90 via-transparent to-transparent" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24 lg:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-4 py-1.5 text-xs font-bold text-white border border-white/30 animate-float-up">
              <span className="size-1.5 rounded-full bg-[color:var(--brand-yellow)] animate-pulse" />
              SHEREHEKEA BEI YA MWANANCHI
            </div>
            <h1 className="mt-6 text-4xl sm:text-6xl lg:text-7xl font-black text-white animate-float-up" style={{ animationDelay: "0.1s" }}>
              Build Your Career at <span className="block bg-gradient-to-r from-[color:var(--brand-yellow)] to-[color:var(--brand-orange)] bg-clip-text text-transparent">Magunas</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-white/85 max-w-2xl animate-float-up" style={{ animationDelay: "0.2s" }}>
              Join Kenya's fastest growing supermarket chain. We're hiring across 11 departments — competitive pay, medical allowance, and real growth opportunities.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 animate-float-up" style={{ animationDelay: "0.3s" }}>
              <a href="#positions" className="inline-flex items-center gap-2 rounded-full bg-[color:var(--brand-orange)] px-7 py-3.5 font-bold text-white shadow-orange hover:scale-105 transition-transform">
                View Open Positions →
              </a>
              <div className="inline-flex items-center gap-3 text-white/90 text-sm">
                <Stat n="500+" label="Hired" />
                <Stat n="11" label="Roles" />
                <Stat n="24/7" label="Stores" />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* POSITIONS */}
      <section id="positions" className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-block text-xs font-bold tracking-widest text-[color:var(--brand-orange)] uppercase">Open Positions</div>
          <h2 className="mt-2 text-3xl sm:text-5xl font-black">Find Your <span className="text-gradient">Perfect Role</span></h2>
          <p className="mt-4 text-muted-foreground">Each position includes a competitive monthly salary plus a medical allowance. Apply in under 3 minutes.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {POSITIONS.map((p, i) => (
            <PositionCard key={p.title} p={p} delay={i * 0.05} onApply={() => onApply(p)} />
          ))}
        </div>
      </section>
    </>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div className="flex items-baseline gap-1.5 border-l border-white/30 pl-3">
      <span className="font-black text-lg">{n}</span>
      <span className="text-xs uppercase tracking-wider text-white/70">{label}</span>
    </div>
  );
}

function PositionCard({ p, onApply, delay }: { p: Position; onApply: () => void; delay: number }) {
  return (
    <article className="group relative overflow-hidden rounded-3xl bg-card shadow-card border border-border/50 hover:shadow-glow transition-all duration-500 hover:-translate-y-1 animate-float-up" style={{ animationDelay: `${delay}s` }}>
      <div className="relative h-48 overflow-hidden">
        <img src={p.image} alt={p.title} loading="lazy" width={800} height={600} className="size-full object-cover group-hover:scale-110 transition-transform duration-700" />
        <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--brand-ink)]/80 via-transparent to-transparent" />
        <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur px-3 py-1 text-[10px] font-bold tracking-wider uppercase text-[color:var(--brand-green-dark)]">
          {p.category}
        </div>
        <div className="absolute bottom-3 right-3 size-14 rounded-2xl bg-white/95 backdrop-blur grid place-items-center text-2xl shadow-lg">
          {p.emoji}
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-xl font-black">{p.title}</h3>
        <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">{p.description}</p>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-[color:var(--brand-green)]/8 border border-[color:var(--brand-green)]/20 p-3">
            <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Monthly</div>
            <div className="mt-0.5 font-black text-[color:var(--brand-green-dark)]">Ksh {p.salary.toLocaleString()}</div>
          </div>
          <div className="rounded-2xl bg-[color:var(--brand-orange)]/10 border border-[color:var(--brand-orange)]/25 p-3">
            <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Medical</div>
            <div className="mt-0.5 font-black text-[color:var(--brand-orange)]">+Ksh {p.allowance.toLocaleString()}</div>
          </div>
        </div>

        <button onClick={onApply} className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-2xl brand-gradient px-5 py-3 font-bold text-white shadow-orange hover:shadow-glow hover:scale-[1.02] transition-all">
          Apply for this Position
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </button>
      </div>
    </article>
  );
}

/* ============ APPLICATION FORM ============ */
function ApplicationForm({ position, onSubmit, onBack }: { position: Position; onSubmit: () => void; onBack: () => void }) {
  const [workType, setWorkType] = useState<"full" | "part">("full");
  const [training, setTraining] = useState<"yes" | "no">("yes");
  const [salaryRange, setSalaryRange] = useState<(typeof EXPECTED_SALARY_RANGES)[number]["value"]>(() => getDefaultSalaryRange(position.salary));

  return (
    <section className="mx-auto max-w-4xl px-4 sm:px-6 py-10 animate-float-up">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground mb-6">← Back to positions</button>

      <div className="rounded-3xl overflow-hidden shadow-card border border-border/50 bg-card">
        {/* Top banner */}
        <div className="relative hero-gradient p-6 sm:p-8 text-white">
          <div className="flex items-center gap-4">
            <div className="size-16 rounded-2xl bg-white/20 backdrop-blur grid place-items-center text-3xl">{position.emoji}</div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-white/80">{position.category}</div>
              <h2 className="text-2xl sm:text-3xl font-black">Apply: {position.title}</h2>
              <p className="text-sm text-white/85 mt-0.5">Ksh {position.salary.toLocaleString()}/month + Ksh {position.allowance.toLocaleString()} medical</p>
            </div>
          </div>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
          className="p-6 sm:p-10 space-y-10"
        >
          <Section title="Personal Information" icon="👤">
            <Grid>
              <Field label="Full Name" required>
                <input required type="text" placeholder="Enter your full name" className={inputCls} />
              </Field>
              <Field label="Email Address" required>
                <input required type="email" placeholder="your.email@example.com" className={inputCls} />
              </Field>
              <Field label="Phone Number" required>
                <input required type="tel" placeholder="07XX XXX XXX" className={inputCls} />
              </Field>
            </Grid>
          </Section>

          <Section title="Location & Education" icon="📍">
            <Grid>
              <Field label="Preferred Work Location" required>
                <select required className={inputCls} defaultValue="">
                  <option value="" disabled>Select preferred location</option>
                  {LOCATIONS.map(l => <option key={l}>{l}</option>)}
                </select>
              </Field>
              <Field label="Level of Education" required>
                <select required className={inputCls} defaultValue="">
                  <option value="" disabled>Select your education level</option>
                  {EDUCATION.map(l => <option key={l}>{l}</option>)}
                </select>
              </Field>
              <Field label="Current Location" required>
                <input required type="text" placeholder="e.g. Kasarani, Nairobi" className={inputCls} />
              </Field>
            </Grid>
          </Section>

          <Section title="Job Preferences" icon="💼">
            <Field label="Position Applying For" required>
              <select required className={inputCls} defaultValue={position.title}>
                {POSITIONS.map(p => <option key={p.title}>{p.title}</option>)}
              </select>
            </Field>

            <div className="mt-5">
              <Label>Work Type</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <ChoiceCard active={workType === "full"} onClick={() => setWorkType("full")} title="Full Time" sub="40+ hours/week" icon="⏰" />
                <ChoiceCard active={workType === "part"} onClick={() => setWorkType("part")} title="Part Time" sub="<40 hours/week" icon="🕐" />
              </div>
            </div>

            <Grid className="mt-5">
              <Field label="When can you start?">
                <select className={inputCls} defaultValue="">
                  <option value="" disabled>Select start time</option>
                  <option>Immediately</option>
                  <option>Within 2 weeks</option>
                  <option>Within 1 month</option>
                  <option>More than 1 month</option>
                </select>
              </Field>
              <Field label="Willing to undergo training?">
                <div className="grid grid-cols-2 gap-2">
                  <ChoicePill active={training === "yes"} onClick={() => setTraining("yes")}>Yes ✓</ChoicePill>
                  <ChoicePill active={training === "no"} onClick={() => setTraining("no")}>No</ChoicePill>
                </div>
              </Field>
            </Grid>

            <div className="mt-5">
              <Label>Expected Salary Range (KES)</Label>
              <select
                className={inputCls}
                value={salaryRange}
                onChange={(e) => setSalaryRange(e.target.value as (typeof EXPECTED_SALARY_RANGES)[number]["value"])}
              >
                {EXPECTED_SALARY_RANGES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          </Section>

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl brand-gradient px-8 py-4 text-lg font-black text-white shadow-orange hover:shadow-glow hover:scale-[1.01] transition-all"
          >
            Submit Application →
          </button>
        </form>
      </div>
    </section>
  );
}

const inputCls = "w-full rounded-xl bg-white border border-input px-4 py-3 text-sm font-medium outline-none focus:border-[color:var(--brand-orange)] focus:ring-4 focus:ring-[color:var(--brand-orange)]/15 transition-all";

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="size-9 rounded-xl brand-gradient grid place-items-center text-white text-base">{icon}</div>
        <h3 className="text-lg font-black">{title}</h3>
        <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
      </div>
      <div>{children}</div>
    </div>
  );
}
function Grid({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`grid sm:grid-cols-2 gap-4 ${className}`}>{children}</div>;
}
function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-bold text-foreground mb-1.5">{children}</label>;
}
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label} {required && <span className="text-[color:var(--brand-orange)]">*</span>}</Label>
      {children}
    </div>
  );
}
function ChoiceCard({ active, onClick, title, sub, icon }: { active: boolean; onClick: () => void; title: string; sub: string; icon: string }) {
  return (
    <button type="button" onClick={onClick} className={`text-left rounded-2xl border-2 p-4 transition-all ${active ? "border-[color:var(--brand-orange)] bg-[color:var(--brand-orange)]/8 shadow-orange" : "border-border bg-card hover:border-[color:var(--brand-orange)]/40"}`}>
      <div className="flex items-center gap-3">
        <div className={`size-10 rounded-xl grid place-items-center text-lg ${active ? "brand-gradient text-white" : "bg-secondary"}`}>{icon}</div>
        <div>
          <div className="font-black text-sm">{title}</div>
          <div className="text-xs text-muted-foreground">{sub}</div>
        </div>
      </div>
    </button>
  );
}
function ChoicePill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={`rounded-xl px-4 py-3 text-sm font-bold border-2 transition-all ${active ? "border-[color:var(--brand-green)] bg-[color:var(--brand-green)]/10 text-[color:var(--brand-green-dark)]" : "border-border bg-card hover:border-[color:var(--brand-green)]/40"}`}>{children}</button>
  );
}

/* ============ PROCESSING ============ */
function Processing({ onDone }: { onDone: () => void }) {
  const steps = [
    "Reviewing personal information...",
    "Verifying education details...",
    "Processing job preferences...",
    "Looking for open positions...",
    "Finalizing application...",
  ];
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (step >= steps.length) { const t = setTimeout(onDone, 600); return () => clearTimeout(t); }
    const t = setTimeout(() => setStep(s => s + 1), 1200);
    return () => clearTimeout(t);
  }, [step]);

  return (
    <section className="mx-auto max-w-2xl px-4 sm:px-6 py-16 animate-float-up">
      <div className="rounded-3xl bg-card shadow-card border border-border/50 p-8 sm:p-12 text-center">
        <div className="relative mx-auto size-28 mb-6">
          <div className="absolute inset-0 rounded-full hero-gradient animate-pulse-ring" />
          <div className="absolute inset-2 rounded-full bg-card grid place-items-center">
            <div className="size-16 rounded-full border-4 border-[color:var(--brand-orange)]/20 border-t-[color:var(--brand-orange)] animate-spin-slow" />
          </div>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black">Processing Your Application</h2>
        <p className="text-muted-foreground mt-2">Please wait while we review your information...</p>

        <div className="mt-8 space-y-3 text-left max-w-md mx-auto">
          {steps.map((s, i) => (
            <div key={s} className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${i < step ? "border-[color:var(--brand-green)]/30 bg-[color:var(--brand-green)]/5" : i === step ? "border-[color:var(--brand-orange)]/40 bg-[color:var(--brand-orange)]/5 shimmer" : "border-border bg-secondary/30 opacity-50"}`}>
              <div className={`size-7 rounded-full grid place-items-center text-xs font-black ${i < step ? "bg-[color:var(--brand-green)] text-white" : i === step ? "bg-[color:var(--brand-orange)] text-white" : "bg-muted text-muted-foreground"}`}>
                {i < step ? "✓" : i + 1}
              </div>
              <span className="text-sm font-semibold">{s}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============ QUALIFIED ============ */
function Qualified({ position, onBook }: { position: Position; onBook: () => void }) {
  return (
    <section className="mx-auto max-w-2xl px-4 sm:px-6 py-16 animate-float-up">
      <div className="relative rounded-3xl overflow-hidden shadow-glow border border-[color:var(--brand-green)]/30 bg-card">
        <div className="absolute -top-20 -right-20 size-64 rounded-full bg-[color:var(--brand-green)]/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 size-64 rounded-full bg-[color:var(--brand-orange)]/20 blur-3xl" />

        <div className="relative p-8 sm:p-12 text-center">
          <div className="mx-auto size-24 rounded-full brand-gradient grid place-items-center text-5xl shadow-glow animate-pulse-ring">
            🎉
          </div>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-[color:var(--brand-green)]/15 border border-[color:var(--brand-green)]/30 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-[color:var(--brand-green-dark)]">
            ✓ Pre-Qualified
          </div>
          <h2 className="mt-4 text-3xl sm:text-4xl font-black">
            You Qualify for <span className="text-gradient">{position.title}!</span>
          </h2>
          <p className="mt-3 text-muted-foreground">Congratulations! Your profile matches our requirements. The HR team is ready to interview you.</p>

          <div className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-destructive/10 border-2 border-destructive/30 px-5 py-3 text-sm font-bold text-destructive animate-pulse">
            ⏰ Only 2 interview slots remaining today!
          </div>

          <button onClick={onBook} className="mt-8 w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl brand-gradient px-10 py-4 text-lg font-black text-white shadow-orange hover:shadow-glow hover:scale-105 transition-all">
            Book Your Interview Now →
          </button>
        </div>
      </div>
    </section>
  );
}

/* ============ BOOKING ============ */
function BookingForm({ position, onContinue, onBack }: { position: Position; onContinue: () => void; onBack: () => void }) {
  const dates = useMemo(() => {
    const arr: Date[] = [];
    for (let i = 1; i <= 14; i++) {
      const d = new Date(); d.setDate(d.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, []);
  const times = ["09:00 AM", "10:30 AM", "12:00 PM", "02:00 PM", "03:30 PM", "05:00 PM"];

  const [date, setDate] = useState<number | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [mode, setMode] = useState<"physical" | "online">("physical");
  const [contact, setContact] = useState<"sms" | "call" | "whatsapp">("whatsapp");

  const canContinue = date !== null && time !== null;

  return (
    <section className="mx-auto max-w-3xl px-4 sm:px-6 py-10 animate-float-up">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground mb-6">← Back</button>

      <div className="rounded-3xl overflow-hidden shadow-card border border-border/50 bg-card">
        <div className="hero-gradient p-6 sm:p-8 text-white">
          <div className="text-xs font-bold uppercase tracking-wider text-white/80">Interview Booking</div>
          <h2 className="text-2xl sm:text-3xl font-black mt-1">Schedule Your Interview</h2>
          <p className="text-sm text-white/85 mt-1">Position: {position.title}</p>
        </div>

        <div className="p-6 sm:p-10 space-y-8">
          <div>
            <Label>📅 Select Interview Date</Label>
            <div className="mt-3 grid grid-cols-3 sm:grid-cols-7 gap-2">
              {dates.map((d, i) => {
                const active = date === i;
                return (
                  <button key={i} onClick={() => setDate(i)} className={`rounded-xl border-2 p-2.5 text-center transition-all ${active ? "border-[color:var(--brand-orange)] brand-gradient text-white shadow-orange" : "border-border bg-card hover:border-[color:var(--brand-orange)]/40"}`}>
                    <div className="text-[10px] font-bold uppercase opacity-75">{d.toLocaleDateString("en-US", { weekday: "short" })}</div>
                    <div className="text-lg font-black leading-none mt-1">{d.getDate()}</div>
                    <div className="text-[10px] font-bold opacity-75 mt-0.5">{d.toLocaleDateString("en-US", { month: "short" })}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label>🕐 Select Time Slot</Label>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {times.map(t => (
                <button key={t} onClick={() => setTime(t)} className={`rounded-xl border-2 px-4 py-3 text-sm font-bold transition-all ${time === t ? "border-[color:var(--brand-green)] bg-[color:var(--brand-green)]/10 text-[color:var(--brand-green-dark)]" : "border-border bg-card hover:border-[color:var(--brand-green)]/40"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>📍 Interview Mode</Label>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <ChoiceCard active={mode === "physical"} onClick={() => setMode("physical")} title="Physical" sub="In-store interview" icon="🏢" />
              <ChoiceCard active={mode === "online"} onClick={() => setMode("online")} title="Online" sub="Video call (Zoom)" icon="💻" />
            </div>
          </div>

          <div>
            <Label>📞 Preferred Contact Method</Label>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {(["sms", "call", "whatsapp"] as const).map(m => (
                <ChoicePill key={m} active={contact === m} onClick={() => setContact(m)}>
                  {m === "sms" ? "💬 SMS" : m === "call" ? "📞 Call" : "🟢 WhatsApp"}
                </ChoicePill>
              ))}
            </div>
          </div>

          <button
            disabled={!canContinue}
            onClick={onContinue}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl brand-gradient px-8 py-4 text-lg font-black text-white shadow-orange hover:shadow-glow hover:scale-[1.01] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            Confirm Booking →
          </button>
        </div>
      </div>
    </section>
  );
}

/* ============ PAYMENT ============ */
function PaymentScreen({ onPay, onBack }: { onPay: (session: PaymentSession) => void; onBack: () => void }) {
  const initiatePaymentFn = useServerFn(initiateMpesaPayment);
  const [phone, setPhone] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const valid = isValidKenyanPhoneNumber(phone);

  const handlePay = async () => {
    if (!valid) {
      setErrorMessage("Enter a valid Safaricom number in 07, 011, 254, or +254 format.");
      return;
    }

    setErrorMessage("");
    setIsProcessing(true);

    try {
      const result = await initiatePaymentFn({
        data: {
          phoneNumber: phone,
          amount: 10,
          description: "Refundable interview processing fee",
          referencePrefix: "MAGUNAS",
        },
      });

      onPay({
        checkoutRequestId: result.checkoutRequestId,
        normalizedPhone: result.normalizedPhone,
        reference: result.reference,
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to send STK push. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <section className="mx-auto max-w-2xl px-4 sm:px-6 py-10 animate-float-up">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground mb-6">← Back</button>

      <div className="rounded-3xl overflow-hidden shadow-card border border-border/50 bg-card">
        <div className="hero-gradient p-6 sm:p-8 text-white text-center">
          <div className="mx-auto size-16 rounded-2xl bg-white/15 backdrop-blur grid place-items-center text-3xl mb-3">🔒</div>
          <h2 className="text-2xl sm:text-3xl font-black">Interview Processing Fee</h2>
          <p className="text-sm text-white/85 mt-1">Secure your interview slot</p>
        </div>

        <div className="p-6 sm:p-10">
          <div className="rounded-3xl brand-gradient text-white text-center p-8 shadow-orange">
            <div className="text-xs font-bold uppercase tracking-widest opacity-80">Processing Fee</div>
            <div className="mt-2 text-5xl sm:text-6xl font-black">KES 10</div>
            <div className="mt-2 inline-flex items-center gap-1 text-xs font-bold bg-white/20 backdrop-blur rounded-full px-3 py-1">
              💯 100% Refundable on Attendance
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-secondary/50 border border-border p-4 text-sm text-muted-foreground">
            <p className="font-bold text-foreground mb-1">Why a booking fee?</p>
            This fee guarantees your attendance, helps us schedule interviews efficiently, and is <span className="font-bold text-[color:var(--brand-green-dark)]">fully refunded</span> when you show up for your interview.
          </div>

          <div className="mt-6">
            <Label>M-Pesa Phone Number</Label>
            <div className="mt-1.5 flex items-center rounded-xl border border-input bg-white focus-within:border-[color:var(--brand-orange)] focus-within:ring-4 focus-within:ring-[color:var(--brand-orange)]/15 transition-all">
              <input
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (errorMessage) setErrorMessage("");
                }}
                type="tel"
                placeholder="07..., 011..., 254..., or +254..."
                className="flex-1 py-3 px-4 outline-none bg-transparent text-sm font-medium"
              />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">Enter any valid Safaricom format and you'll receive an M-Pesa STK push on this number.</p>
            {errorMessage && <p className="mt-2 text-sm font-medium text-destructive">{errorMessage}</p>}
          </div>

          <button
            disabled={!valid || isProcessing}
            onClick={handlePay}
            className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[color:var(--brand-green)] hover:bg-[color:var(--brand-green-dark)] px-8 py-4 text-lg font-black text-white shadow-glow hover:scale-[1.01] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isProcessing ? "Requesting M-Pesa Prompt..." : "Pay KES 10 with M-Pesa"}
          </button>

          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span>🔒 Secure</span><span>·</span><span>⚡ Instant</span><span>·</span><span>💯 Refundable</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============ STK LOADER ============ */
function StkLoader({
  checkoutRequestId,
  onDone,
  onRetry,
}: {
  checkoutRequestId: string;
  onDone: (result: PaymentResult) => void;
  onRetry: () => void;
}) {
  const checkPaymentStatusFn = useServerFn(checkMpesaPaymentStatus);
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<"pending" | "failed" | "timeout">("pending");
  const [message, setMessage] = useState("Waiting for you to enter your M-Pesa PIN...");
  const [resultDesc, setResultDesc] = useState("");
  const steps = [
    "STK push sent to your phone...",
    "Waiting for you to enter M-Pesa PIN...",
    "Confirming payment...",
    "Securing your interview slot...",
  ];

  useEffect(() => {
    if (status !== "pending") return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 30;

    const poll = async () => {
      if (cancelled) return;
      if (attempts >= maxAttempts) {
        setStatus("timeout");
        setMessage("Payment verification timed out. Please check your M-Pesa messages and try again.");
        return;
      }

      attempts += 1;
      setStep(Math.min(attempts === 1 ? 1 : 2, steps.length - 1));

      try {
        const result = await checkPaymentStatusFn({
          data: { checkoutRequestId },
        });

        if (cancelled) return;

        if (result.status === "success") {
          setStep(steps.length);
          setMessage("Payment confirmed. Finalizing your booking...");
          setTimeout(() => {
            if (!cancelled) {
              onDone({
                receiptNumber: result.receiptNumber,
                resultDesc: result.resultDesc,
              });
            }
          }, 700);
          return;
        }

        if (result.status === "failed") {
          setStatus("failed");
          setResultDesc(result.resultDesc || "Payment failed or was cancelled.");
          setMessage("Payment was not completed.");
          return;
        }

        setMessage("STK prompt sent. Complete the payment on your phone to continue.");
      } catch {
        setMessage("Still checking payment status...");
      }

      setTimeout(poll, 5000);
    };

    const initialTimer = setTimeout(poll, 5000);
    return () => {
      cancelled = true;
      clearTimeout(initialTimer);
    };
  }, [checkoutRequestId, checkPaymentStatusFn, onDone, status]);

  return (
    <section className="mx-auto max-w-2xl px-4 sm:px-6 py-16 animate-float-up">
      <div className="rounded-3xl bg-card shadow-card border border-border/50 p-8 sm:p-12 text-center">
        <div className="relative mx-auto size-28 mb-6">
          <div className="absolute inset-0 rounded-full bg-[color:var(--brand-green)]/20 animate-pulse-ring" />
          <div className="absolute inset-2 rounded-full bg-[color:var(--brand-green)] grid place-items-center text-white text-3xl font-black">M</div>
        </div>
        <h2 className="text-2xl font-black">Processing M-Pesa Payment</h2>
        <p className="text-sm text-muted-foreground mt-1">{message}</p>

        <div className="mt-8 space-y-3 text-left max-w-md mx-auto">
          {steps.map((s, i) => (
            <div key={s} className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${i < step ? "border-[color:var(--brand-green)]/30 bg-[color:var(--brand-green)]/5" : i === step && status === "pending" ? "border-[color:var(--brand-orange)]/40 bg-[color:var(--brand-orange)]/5 shimmer" : "border-border bg-secondary/30 opacity-50"}`}>
              <div className={`size-7 rounded-full grid place-items-center text-xs font-black ${i < step ? "bg-[color:var(--brand-green)] text-white" : i === step && status === "pending" ? "bg-[color:var(--brand-orange)] text-white animate-spin-slow" : "bg-muted text-muted-foreground"}`}>
                {i < step ? "✓" : i === step && status === "pending" ? "◐" : i + 1}
              </div>
              <span className="text-sm font-semibold">{s}</span>
            </div>
          ))}
        </div>

        {status !== "pending" && (
          <div className={`mt-6 rounded-2xl border p-4 text-left ${status === "failed" ? "border-destructive/30 bg-destructive/5" : "border-[color:var(--brand-orange)]/30 bg-[color:var(--brand-orange)]/5"}`}>
            <div className="font-bold">{status === "failed" ? "Payment not completed" : "Verification timed out"}</div>
            <p className="mt-1 text-sm text-muted-foreground">{resultDesc || message}</p>
            <button
              onClick={onRetry}
              className="mt-4 inline-flex items-center justify-center rounded-xl brand-gradient px-5 py-2.5 text-sm font-bold text-white shadow-orange hover:scale-105 transition-transform"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

/* ============ SUCCESS ============ */
function SuccessScreen({
  position,
  refundCode,
  receiptNumber,
  onHome,
}: {
  position: Position;
  refundCode: string;
  receiptNumber: string | null;
  onHome: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLDivElement>(null);
  const copy = () => {
    navigator.clipboard.writeText(refundCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <section className="mx-auto max-w-2xl px-4 sm:px-6 py-12 animate-float-up">
      <div className="relative rounded-3xl overflow-hidden shadow-glow border border-[color:var(--brand-green)]/30 bg-card">
        <div className="absolute -top-20 -right-20 size-72 rounded-full bg-[color:var(--brand-green)]/25 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 size-72 rounded-full bg-[color:var(--brand-orange)]/25 blur-3xl" />

        <div className="relative p-8 sm:p-12 text-center">
          <div className="mx-auto size-24 rounded-full bg-[color:var(--brand-green)] grid place-items-center text-5xl text-white shadow-glow">✓</div>
          <h2 className="mt-6 text-3xl sm:text-4xl font-black">Interview Booked!</h2>
          <p className="mt-2 text-muted-foreground">
            Your interview for <span className="font-bold text-foreground">{position.title}</span> is confirmed. We'll contact you shortly with details.
          </p>

          <div className="mt-8 rounded-2xl border-2 border-dashed border-[color:var(--brand-orange)]/40 bg-[color:var(--brand-orange)]/5 p-6">
            <div className="text-xs font-bold uppercase tracking-widest text-[color:var(--brand-orange)]">Your Refund Code</div>
            <p className="text-xs text-muted-foreground mt-1">Present this on interview day to claim your KES 10 refund</p>
            <div ref={codeRef} className="mt-4 text-2xl sm:text-3xl font-black font-mono text-[color:var(--brand-green-dark)] tracking-wider select-all">
              {refundCode}
            </div>
            <button onClick={copy} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[color:var(--brand-ink)] px-5 py-2.5 text-sm font-bold text-white hover:scale-105 transition-transform">
              {copied ? "✓ Copied!" : "📋 Copy Code"}
            </button>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 text-left">
            <InfoCard icon="📧" title="Check Email" sub="Confirmation sent" />
            <InfoCard icon="📱" title="SMS Reminder" sub="24 hours before" />
          </div>

          {receiptNumber && (
            <div className="mt-6 rounded-2xl bg-secondary/50 border border-border p-4 text-left">
              <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">M-Pesa Receipt</div>
              <div className="mt-1 text-base font-black text-[color:var(--brand-green-dark)]">{receiptNumber}</div>
            </div>
          )}

          <button onClick={onHome} className="mt-8 inline-flex items-center gap-2 rounded-2xl brand-gradient px-8 py-3.5 font-bold text-white shadow-orange hover:scale-105 transition-transform">
            Back to Positions →
          </button>
        </div>
      </div>
    </section>
  );
}

function InfoCard({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div className="rounded-2xl bg-secondary/50 border border-border p-4 flex items-center gap-3">
      <div className="size-10 rounded-xl bg-white grid place-items-center text-lg">{icon}</div>
      <div>
        <div className="font-bold text-sm">{title}</div>
        <div className="text-xs text-muted-foreground">{sub}</div>
      </div>
    </div>
  );
}

/* ============ FOOTER ============ */
function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-[color:var(--brand-ink)] text-white/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 grid sm:grid-cols-3 gap-8">
        <div>
          <Logo light />
          <p className="mt-4 text-sm text-white/60 max-w-xs">Sherehekea Bei Ya Mwananchi. Building careers, serving Kenya 24/7.</p>
        </div>
        <div className="text-sm">
          <div className="font-bold text-white mb-3">Quick Links</div>
          <ul className="space-y-1.5">
            <li><a href="#positions" className="hover:text-[color:var(--brand-orange)]">Open Positions</a></li>
            <li><a href="#" className="hover:text-[color:var(--brand-orange)]">Store Locations</a></li>
            <li><a href="#" className="hover:text-[color:var(--brand-orange)]">FAQ</a></li>
          </ul>
        </div>
        <div className="text-sm">
          <div className="font-bold text-white mb-3">Contact HR</div>
          <ul className="space-y-1.5">
            <li>📞 +254 700 000 000</li>
            <li>✉️ careers@magunas.co.ke</li>
            <li>📍 Nairobi, Kenya</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/50">
        © {new Date().getFullYear()} Magunas Supermarket. All rights reserved.
      </div>
    </footer>
  );
}
