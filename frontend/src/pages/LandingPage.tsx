import { useNavigate } from "react-router-dom";
import {
  Users,
  ClipboardCheck,
  GraduationCap,
  Wallet,
  BookOpen,
  BusFront,
  Megaphone,
  Briefcase,
  ChevronRight,
  ShieldCheck,
  School,
  User,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ClickSpark from "@/components/animations/ClickSpark";
import Noise from "@/components/animations/Noise";

const features = [
  {
    icon: Users,
    title: "Student Management",
    desc: "Digital records, enrollment tracking, and academic history in one place.",
  },
  {
    icon: ClipboardCheck,
    title: "Smart Attendance",
    desc: "Daily logs with automatic percentage tracking and alerts.",
  },
  {
    icon: GraduationCap,
    title: "Exams & Results",
    desc: "Schedule exams, enter marks, and publish results quickly.",
  },
  {
    icon: Wallet,
    title: "Fee Management",
    desc: "Monitor payments, dues, and receipts in real time.",
  },
  {
    icon: BookOpen,
    title: "Homework Tracking",
    desc: "Assign, review, and follow up on homework across classes.",
  },
  {
    icon: BusFront,
    title: "Transport & Logistics",
    desc: "Manage routes, vehicles, and driver assignments.",
  },
  {
    icon: Megaphone,
    title: "Announcements",
    desc: "Share notices instantly with staff, students, and parents.",
  },
  {
    icon: Briefcase,
    title: "Staff Management",
    desc: "Handle roles, departments, and attendance for staff.",
  },
];

const roles = [
  { icon: ShieldCheck, name: "Super Admin", desc: "Configure schools, users, and access." },
  { icon: School, name: "Principal", desc: "Monitor academics, fees, and attendance." },
  { icon: Briefcase, name: "Teacher", desc: "Run classes, assessments, and homework." },
  { icon: User, name: "Parent", desc: "Track a child's performance and payments." },
];

function RibbonsBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute -left-40 top-[-10%] h-72 w-96 -rotate-6 bg-[radial-gradient(circle_at_top,_rgba(0,0,0,0.06),_transparent_60%)] blur-3xl animate-[spin_32s_linear_infinite]" />
      <div className="absolute right-[-20%] top-1/3 h-80 w-72 rotate-6 bg-[conic-gradient(from_160deg,_rgba(0,0,0,0.06),_transparent_55%,_rgba(0,0,0,0.08))] blur-3xl animate-[spin_40s_linear_infinite_reverse]" />
      <div className="absolute inset-x-10 bottom-[-30%] h-64 bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.10),_transparent_65%)]" />
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <ClickSpark sparkColor="#111" sparkSize={10} sparkRadius={18} sparkCount={10} duration={450} extraScale={1.1}>
      <div className="min-h-screen bg-white text-slate-900">
        <div className="relative isolate overflow-hidden">
          <RibbonsBackground />
          <Noise />

          <nav className="sticky top-0 z-40 border-b border-black/5 bg-white/80 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black text-xs font-bold tracking-[0.18em] text-white">
                AP
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-semibold text-slate-900">A. P. College ERP</span>
                <span className="text-[11px] text-slate-500">Built for Junior Colleges</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/login")}
                className="text-slate-600 hover:text-slate-900"
              >
                Sign in
              </Button>
              <Button
                size="sm"
                onClick={() => navigate("/login")}
                className="gap-1 bg-black text-white hover:bg-slate-900"
              >
                Open dashboard
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          </nav>

          <main className="mx-auto max-w-6xl px-4 pb-20 pt-14 md:pt-20">
          <section className="grid items-center gap-10 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-16">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-black/[0.03] px-3 py-1 text-xs font-medium text-slate-700">
                <span className="flex h-1.5 w-5 items-center rounded-full bg-gradient-to-r from-slate-900 to-slate-500" />
                Live, production-ready platform for A. P. Colleges
              </div>
              <div className="space-y-4">
                <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                  One ERP for every{" "}
                  <span className="bg-gradient-to-r from-black via-slate-700 to-slate-500 bg-clip-text text-transparent">
                    Junior College
                  </span>
                  .
                </h1>
                <p className="max-w-xl text-pretty text-sm text-slate-300 sm:text-base">
                  Daily work for headmasters, teachers, and clerks in one place—attendance, exams, fees, transport, and
                  communication connected to the same real-time data.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  size="lg"
                  onClick={() => navigate("/login")}
                  className="w-full gap-2 bg-black text-white hover:bg-slate-900 sm:w-auto transition-transform duration-200 hover:-translate-y-0.5"
                >
                  Access platform
                  <ChevronRight className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() =>
                    document.getElementById("features")?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }
                  className="w-full border-slate-300 bg-white/70 text-slate-800 hover:bg-white sm:w-auto transition-transform duration-200 hover:-translate-y-0.5"
                >
                  View core modules
                </Button>
              </div>

              <dl className="grid max-w-xl grid-cols-2 gap-5 text-xs text-slate-300 sm:text-sm">
                <div>
                  <dt className="text-slate-500">Live modules</dt>
                  <dd className="mt-1 text-base font-semibold text-slate-900">8+</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Supported roles</dt>
                  <dd className="mt-1 text-base font-semibold text-slate-900">Super admin, staff, parents</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Attendance & exams</dt>
                  <dd className="mt-1 text-base font-semibold text-slate-900">Daily + term-wise</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Deployment focus</dt>
                  <dd className="mt-1 text-base font-semibold text-slate-900">Production-first</dd>
                </div>
              </dl>
            </div>

            <div className="relative">
              <div className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-black/5 blur-3xl" />
              <div className="pointer-events-none absolute -right-6 bottom-0 h-24 w-24 rounded-full bg-black/10 blur-3xl" />
              <div className="relative overflow-hidden rounded-2xl border border-black/10 bg-white/90 shadow-[0_24px_55px_rgba(15,23,42,0.18)] transition-transform duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between border-b border-black/5 px-4 py-3 text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Live district snapshot
                  </div>
                  <div className="flex items-center gap-1 rounded-full border border-black/10 px-2 py-0.5 font-mono text-[10px] text-slate-500">
                    <LayoutDashboard className="h-3 w-3" />
                    ap-college-erp
                  </div>
                </div>

                <div className="space-y-4 bg-gradient-to-b from-white via-slate-50 to-slate-100 px-4 pb-5 pt-4">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {features.slice(0, 4).map((item) => (
                      <div
                        key={item.title}
                        className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_45px_rgba(15,23,42,0.16)]"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900/5 text-slate-900">
                          <item.icon className="h-4 w-4" />
                        </div>
                        <p className="text-[11px] font-medium text-slate-900">{item.title}</p>
                        <p className="line-clamp-2 text-[10px] text-slate-500">{item.desc}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-[11px] text-slate-700">
                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md">
                      <p className="text-[10px] text-slate-500">Today&apos;s attendance</p>
                      <p className="mt-1 text-sm font-semibold text-emerald-600">94%</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md">
                      <p className="text-[10px] text-slate-500">Pending fees</p>
                      <p className="mt-1 text-sm font-semibold text-amber-600">On track</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md">
                      <p className="text-[10px] text-slate-500">Announcements</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">No delays</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-dashed border-slate-300 bg-white/80 px-3 py-2 text-[11px] text-slate-700">
                    <span>Role-based logins for admins, staff, and parents.</span>
                    <span className="rounded-full bg-black text-[10px] text-white px-2 py-0.5">
                      Secure access
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="features" className="mt-20 space-y-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Core modules</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900 sm:text-2xl">
                  Everything an A. P. College office runs on.
                </h2>
              </div>
              <p className="max-w-md text-xs text-slate-600 sm:text-sm">
                Built for real workflows: admissions, daily roll calls, mark entry, fee follow-up, bus routes, and
                notices—no spreadsheets, no duplicate entry.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="group flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_20px_65px_rgba(15,23,42,0.16)]"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900/5 text-slate-900 group-hover:bg-slate-900/10">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">{feature.title}</h3>
                  <p className="text-xs text-slate-600">{feature.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-20 grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Who uses it</p>
              <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">
                Clear access for every role in school.
              </h2>
              <p className="max-w-xl text-sm text-slate-600">
                Each user type sees only what they need: school configuration for admins, daily tasks for teachers, and
                simple, transparent tracking for parents.
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {roles.map((role) => (
                  <div
                    key={role.name}
                    className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_14px_45px_rgba(15,23,42,0.08)] transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_20px_65px_rgba(15,23,42,0.16)]"
                  >
                    <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900/5 text-slate-900">
                      <role.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{role.name}</p>
                      <p className="text-xs text-slate-600">{role.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border border-black/10 bg-gradient-to-br from-white via-slate-50 to-slate-200 px-6 py-6 shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-700">Designed for deployment</p>
              <h3 className="text-lg font-semibold text-slate-900">What a typical school day looks like.</h3>
              <ul className="space-y-3 text-xs text-slate-700">
                <li className="flex gap-2">
                  <span className="mt-[5px] h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>Morning: class-wise attendance and yesterday&apos;s absentees flagged automatically.</span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-[5px] h-1.5 w-1.5 rounded-full bg-slate-900" />
                  <span>Day: teachers enter homework and marks; office updates fee receipts and transport changes.</span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-[5px] h-1.5 w-1.5 rounded-full bg-slate-500" />
                  <span>Evening: principals review dashboards; parents see attendance, results, and dues.</span>
                </li>
              </ul>
            </div>
          </section>

          <section className="mt-20 rounded-2xl border border-black/10 bg-gradient-to-r from-black via-slate-900 to-slate-800 px-6 py-8 text-slate-50 md:px-10 md:py-10 shadow-[0_26px_70px_rgba(15,23,42,0.35)]">
            <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold sm:text-2xl">Ready to onboard your first school?</h2>
                <p className="mt-2 max-w-xl text-sm text-slate-200">
                  Use your existing admin credentials to sign in. New schools can be provisioned by the district
                  operator—no extra software or hardware required at the school.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  onClick={() => navigate("/login")}
                  className="w-full bg-white text-slate-900 hover:bg-slate-100 sm:w-auto transition-transform duration-200 hover:-translate-y-0.5"
                >
                  Sign in to A. P. College ERP
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t border-black/5 bg-black py-6 text-xs text-slate-400">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 px-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-[10px] font-semibold text-black">
                AP
              </div>
              <span className="font-medium text-slate-200">A. P. College ERP</span>
            </div>
            <p className="text-[11px] text-slate-500">
              © {new Date().getFullYear()} A. P. College ERP. Purpose-built for Junior Colleges.
            </p>
          </div>
        </footer>
        </div>
      </div>
    </ClickSpark>
  );
}
