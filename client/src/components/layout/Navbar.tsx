import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Bell, LogOut, User } from 'lucide-react';
import { getInitials, formatDate } from '@/lib/utils';
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/constants';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

interface Notice { noticeId: string; title: string; content: string; createdAt: string; }

export const Navbar: React.FC = () => {
  const { profile, role, logout } = useAuth();
  const navigate = useNavigate();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'notices'), orderBy('createdAt', 'desc'), limit(10));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => d.data() as Notice);
      setNotices(list);
      const lastSeen = localStorage.getItem('lastSeenNotice');
      const newCount = lastSeen ? list.filter(n => n.createdAt > lastSeen).length : list.length;
      setUnread(Math.min(newCount, 9));
    }, () => { /* silent fail */ });
    return unsub;
  }, []);

  const handleBellOpen = (o: boolean) => {
    setOpen(o);
    if (o && notices.length > 0) {
      localStorage.setItem('lastSeenNotice', notices[0].createdAt);
      setUnread(0);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
      <div className="md:hidden w-10" />
      <div className="flex-1" />
      <div className="flex items-center gap-3">
        {/* Real-time Notification Bell */}
        <Popover open={open} onOpenChange={handleBellOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-bold">
                  {unread}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h4 className="font-semibold text-sm">Notices</h4>
              <Link to="/communication" onClick={() => setOpen(false)} className="text-xs text-primary hover:underline">View all</Link>
            </div>
            <div className="divide-y max-h-72 overflow-y-auto">
              {notices.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No notices</p>
              ) : notices.map(n => (
                <div key={n.noticeId} className="px-4 py-3 hover:bg-muted/50 transition-colors">
                  <p className="text-sm font-medium truncate">{n.title}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{n.content}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{formatDate(n.createdAt)}</p>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 h-auto py-1.5 px-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.photoUrl} />
                <AvatarFallback className="text-xs">{getInitials(profile?.name || 'U')}</AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-medium leading-none">{profile?.name || 'User'}</span>
                {role && (
                  <Badge className={`mt-1 text-xs ${ROLE_COLORS[role]}`} variant="outline">
                    {ROLE_LABELS[role]}
                  </Badge>
                )}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>
              <div className="font-medium">{profile?.name}</div>
              <div className="text-xs text-muted-foreground">{profile?.email}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <User className="mr-2 h-4 w-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
