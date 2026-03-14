import { Link, useLocation } from 'react-router-dom';
import { Home, Users, BookOpen, UserCheck, CreditCard, FileText, Settings, X, GraduationCap, Briefcase, MessageSquare, BarChart3, Truck, UserCircle, UserPlus, Link as LinkIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useEffect, useRef } from 'react';

const adminRoles = ["admin", "super_admin", "principal"];
const teacherRoles = [...adminRoles, "teacher", "staff"];
const allRoles = [...teacherRoles, "student", "parent"];

const items = [
  { text: "Dashboard", href: "/", icon: Home, roles: allRoles },
  { text: "My Profile", href: "/profile", icon: UserCircle, roles: allRoles },
  { text: "Parent Dashboard", href: "/parent-dashboard", icon: Users, roles: ["parent"] },
  { text: "Students", href: "/students", icon: Users, roles: teacherRoles },
  { text: "Create Student Account", href: "/students/create-account", icon: UserPlus, roles: teacherRoles },
  { text: "Link Student to Parent", href: "/students/link-parent", icon: LinkIcon, roles: teacherRoles },
  { text: "Staff", href: "/staff", icon: Briefcase, roles: adminRoles },
  { text: "Academics", href: "/academics", icon: BookOpen, roles: teacherRoles },
  { text: "Attendance", href: "/attendance", icon: UserCheck, roles: allRoles },
  { text: "Fees", href: "/fees", icon: CreditCard, roles: [...adminRoles, "parent", "student"] },
  { text: "Exams", href: "/exams", icon: FileText, roles: allRoles },
  { text: "Homework", href: "/homework", icon: GraduationCap, roles: allRoles },
  { text: "Logistics", href: "/logistics", icon: Truck, roles: adminRoles },
  { text: "Communication", href: "/communication", icon: MessageSquare, roles: allRoles },
  { text: "Reports", href: "/reports", icon: BarChart3, roles: adminRoles },
  { text: "Settings", href: "/settings", icon: Settings, roles: ["super_admin"] },
];

export default function Sidebar({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (val: boolean) => void }) {
  const { role } = useAuth();
  const location = useLocation();
  const sidebarRef = useRef<HTMLElement>(null);
  const currentRole = role || 'student';

  const filteredItems = items.filter(item => item.roles.includes(currentRole));

  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar) return;

    const handleWheel = (e: WheelEvent) => {
      // Prevent page scroll when hovering over sidebar
      const target = e.target as HTMLElement;
      if (sidebar.contains(target)) {
        e.stopPropagation();
      }
    };

    // Add event listener to capture wheel events
    document.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      document.removeEventListener('wheel', handleWheel);
    };
  }, []);

  return (
    <aside 
      ref={sidebarRef}
      className={`fixed inset-y-0 left-0 z-50 w-64 glass border-r transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-screen overflow-hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
    >
      <div className="flex items-center justify-between px-6 h-16 border-b border-border/50 flex-shrink-0">
        <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">School ERP</span>
        <button onClick={() => setIsOpen(false)} className="md:hidden p-2">
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>
      <div className="py-6 px-4 space-y-1 overflow-y-auto h-[calc(100vh-4rem)] overscroll-contain">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          return (
            <Link 
              key={item.text}
              to={item.href}
              onClick={() => setIsOpen(false)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10 hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.text}
            </Link>
          )
        })}
      </div>
    </aside>
  );
}
