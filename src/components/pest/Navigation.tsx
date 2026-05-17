import React from 'react';
import { Home, Camera, Map, Clock, BookOpen, Phone, Menu, X, Bug, LogOut, Settings, ChevronDown, User, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import type { FarmerProfile, User as AuthUser } from '@/lib/auth';

export type TabId = 'home' | 'scan' | 'map' | 'history' | 'resources';

interface NavigationProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onEmergencyClick: () => void;
  onSignInClick: () => void;
  onProfileClick: () => void;
  onLogout: () => void;
  user: AuthUser | null;
  profile: FarmerProfile | null;
}

const NAV_ITEMS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'home', label: 'Home', icon: <Home className="w-5 h-5" /> },
  { id: 'scan', label: 'Check Crops', icon: <Camera className="w-5 h-5" /> },
  { id: 'map', label: 'Detection Map', icon: <Map className="w-5 h-5" /> },
  { id: 'history', label: 'My Reports', icon: <Clock className="w-5 h-5" /> },
  { id: 'resources', label: 'Learn', icon: <BookOpen className="w-5 h-5" /> },
];

const Navigation: React.FC<NavigationProps> = ({
  activeTab, onTabChange, onEmergencyClick, onSignInClick, onProfileClick, onLogout, user, profile
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const userMenuRef = React.useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();

  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const initials = (profile?.full_name || user?.email || 'User')
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-green-100 dark:border-slate-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onTabChange('home')}>
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-emerald-400 rounded-xl flex items-center justify-center shadow-lg shadow-green-200">
              <Bug className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">PestGuard</h1>
              <p className="text-[10px] text-green-600 font-medium -mt-0.5 tracking-wide">ZIMBABWE</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center gap-2 px-3 py-2.5 md:px-4 md:py-2 rounded-lg text-sm font-medium transition-all duration-200 min-h-[44px] ${
                  activeTab === item.id
                    ? 'bg-green-50 text-green-700 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {item.icon}
                <span className="hidden lg:inline">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={onEmergencyClick}
              className="flex items-center justify-center p-2 sm:px-3 sm:py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-sm font-medium transition-all border border-red-200 min-w-[44px] min-h-[44px] dark:bg-red-900/20 dark:hover:bg-red-800 dark:text-red-200 dark:border-red-800"
            >
              <Phone className="w-5 h-5" />
              <span className="hidden sm:inline ml-1">Emergency</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex items-center justify-center p-2 sm:px-3 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all border border-slate-200 min-w-[44px] min-h-[44px] dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 dark:border-slate-700"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors min-h-[44px]"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    {initials}
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-sm font-medium text-gray-900 leading-tight">{profile?.full_name || user?.email || 'User'}</p>
                    <p className="text-[10px] text-gray-500 leading-tight">{profile?.province || user.email}</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 hidden lg:block transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl border border-gray-200 shadow-xl py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="font-medium text-gray-900 text-sm">{profile?.full_name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                      {profile?.farm_name && (
                        <p className="text-xs text-green-600 mt-0.5">{profile.farm_name}</p>
                      )}
                    </div>
                    <button
                      onClick={() => { setUserMenuOpen(false); onProfileClick(); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-gray-400" />
                      Edit Profile
                    </button>
                    <button
                      onClick={() => { setUserMenuOpen(false); onTabChange('history'); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Clock className="w-4 h-4 text-gray-400" />
                      My Reports
                    </button>
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button
                        onClick={() => { setUserMenuOpen(false); onLogout(); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onSignInClick}
                className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-all shadow-sm min-h-[44px]"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 text-gray-600 hover:bg-gray-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-green-100 bg-white/95 backdrop-blur-md">
          <nav className="px-3 sm:px-4 py-3 space-y-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-lg text-sm font-medium transition-all min-h-[48px] ${
                  activeTab === item.id
                    ? 'bg-green-50 text-green-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
            {user && (
              <>
                <div className="border-t border-gray-100 pt-2 mt-2">
                  <button
                    onClick={() => { setMobileMenuOpen(false); onProfileClick(); }}
                    className="flex items-center gap-3 w-full px-4 py-3.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 min-h-[48px]"
                  >
                    <Settings className="w-5 h-5" />
                    Edit Profile
                  </button>
                  <button
                    onClick={() => { setMobileMenuOpen(false); onLogout(); }}
                    className="flex items-center gap-3 w-full px-4 py-3.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 min-h-[48px]"
                  >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navigation;
