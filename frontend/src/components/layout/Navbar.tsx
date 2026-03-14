import { Menu, User, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Navbar({ toggleSidebar }: { toggleSidebar: () => void }) {
  const { currentUser, role } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 w-full glass border-b px-6 flex h-16 items-center justify-between">
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="md:hidden p-2 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition">
          <Menu className="w-5 h-5" />
        </button>
        <span className="font-semibold text-lg md:hidden">ERP Platform</span>
      </div>
      
      <div className="flex items-center gap-4">
        <button className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition relative">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-1.5 right-2 w-2 h-2 bg-destructive rounded-full"></span>
        </button>
        <div className="flex items-center gap-2 pl-4 border-l">
          <button 
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg px-2 py-1 transition"
          >
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold overflow-hidden">
              {currentUser?.photoURL ? (
                <img src={currentUser.photoURL} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4" />
              )}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium leading-none">{currentUser?.displayName || 'User'}</p>
              <p className="text-xs text-muted-foreground capitalize">{role || 'student'}</p>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
