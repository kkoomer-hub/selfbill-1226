import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

export default function Layout({ children, currentPageName }) {
  const navigate = useNavigate();

  const [userInfo, setUserInfo] = React.useState(null);

  const [isAuthChecking, setIsAuthChecking] = React.useState(true);

  useEffect(() => {
    let mounted = true;

    // Helper to handle auth state
    const handleAuth = async (user) => {
        if (!mounted) return;
        
        if (user) {
            // Check if this session has been verified (visited login page in this tab)
            const isVerified = sessionStorage.getItem('sb-session-verified') === 'true';
            const publicPages = ['Login', 'AcceptInvite'];
            const currentPath = window.location.pathname;
            const isPublic = publicPages.some(page => currentPath.includes(page)) || currentPath === '/';

            if (!isVerified && !isPublic) {
                console.log("Session not verified in this tab, redirecting to Login");
                setIsAuthChecking(false);
                navigate('/Login');
                return;
            }

            try {
                // Check actual DB role to be sure
                const memberships = await base44.entities.BuildingMember.filter({
                  user_email: user.email,
                  role: 'representative'
                });
                
                if (!mounted) return;

                // If user manages ANY building, they are a Representative
                const confirmedRole = memberships.length > 0 ? 'representative' : (user.user_metadata?.role || 'representative');
                
                setUserInfo({ ...user, role: confirmedRole });
            } catch (e) {
                if (!mounted) return;
                // Fallback if DB check fails
                setUserInfo({ ...user, role: user.user_metadata?.role || 'representative' });
            }
        } else {
            setUserInfo(null);
            // If not logged in and not on public pages, redirect
            const publicPages = ['Login', 'AcceptInvite']; 
            // We use window.location.pathname to avoid dependency on prop
            const currentPath = window.location.pathname;
            const isPublic = publicPages.some(page => currentPath.includes(page)) || currentPath === '/';
            
            if (!isPublic) {
               // Double check if we are really on a private page before collecting
               navigate('/Login');
            }
        }
        setIsAuthChecking(false);
    };

    // 1. Subscribe to changes
    const { data: { subscription } } = base44.supabase.auth.onAuthStateChange((event, session) => {
      // console.log(`Layout Auth Event: ${event}`);
      handleAuth(session?.user);
    });

    // 2. Initial check (in case event is missed or delayed)
    base44.supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user && isAuthChecking) {
             handleAuth(session.user);
        } else if (!session && isAuthChecking) {
             handleAuth(null);
        }
    });

    // 3. Safety timeout - if nothing happens in 3 seconds, stop loading
    const timer = setTimeout(() => {
        if (mounted && isAuthChecking) {
             console.warn("Auth check timed out, forcing render");
             setIsAuthChecking(false);
        }
    }, 3000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, [navigate]); // Removed currentPageName to prevent re-subscription loops

  // Show nothing or loading while checking auth to prevent redirect loops/flashes
  if (isAuthChecking) {
      return <div className="min-h-screen bg-[#F8F8F4]" />; // Empty background matches theme
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <style>{`
        :root {
          --color-primary: #2F6F4F;
          --color-primary-light: #A8C3A0;
          --color-primary-dark: #1E5A3A;
          --color-background: #F8F8F4;
          --color-surface: #FFFFFF;
          --color-text-main: #222222;
          --color-text-sub: #666666;
          --color-border: #E5E5E5;
          --color-success: #1E7C4F;
          --color-danger: #F45B5B;
          --color-danger-light: #F45B5B;
        }
        
        body {
          font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Noto Sans KR', 'Segoe UI', sans-serif;
          background-color: var(--color-background);
        }
        
        /* Primary Green System */
        .bg-primary { background-color: var(--color-primary); }
        .bg-primary-light { background-color: var(--color-primary-light); }
        .text-primary { color: var(--color-primary); }
        .text-primary-light { color: var(--color-primary-light); }
        .border-primary { border-color: var(--color-primary); }
        
        /* Legacy blue classes mapped to green */
        .bg-blue-50 { background-color: #EDF5F0; }
        .bg-blue-100 { background-color: #D4E8DD; }
        .bg-blue-600 { background-color: var(--color-primary); }
        .bg-blue-700 { background-color: var(--color-primary-dark); }
        .text-blue-600 { color: var(--color-primary); }
        .text-blue-700 { color: var(--color-primary-dark); }
        .border-blue-100 { border-color: #D4E8DD; }
        .border-blue-200 { border-color: #B9D9C6; }
        .border-blue-500 { border-color: var(--color-primary); }
        
        /* Success/Danger */
        .bg-green-50 { background-color: #E8F5ED; }
        .bg-green-100 { background-color: #C3E6CE; }
        .bg-green-600 { background-color: var(--color-success); }
        .bg-green-700 { background-color: #176941; }
        .text-green-600 { color: var(--color-success); }
        .text-green-700 { color: #176941; }
        .border-green-100 { border-color: #C3E6CE; }
        
        .bg-red-50 { background-color: #FEF2F2; }
        .bg-red-100 { background-color: #FECACA; }
        .bg-red-500 { background-color: var(--color-danger); }
        .text-red-500 { color: var(--color-danger); }
        .text-red-600 { color: var(--color-danger); }
        .border-red-100 { border-color: #FECACA; }
        
        /* Supporting colors */
        .bg-yellow-50 { background-color: #FEFCE8; }
        .bg-yellow-100 { background-color: #FEF3C7; }
        .text-yellow-600 { color: #CA8A04; }
        .text-yellow-700 { color: #A16207; }
        .border-yellow-100 { border-color: #FEF3C7; }
        
        .bg-purple-100 { background-color: #f3e8ff; }
        .text-purple-600 { color: #9333ea; }
        .text-purple-700 { color: #7e22ce; }
        
        .bg-orange-100 { background-color: #ffedd5; }
        .text-orange-600 { color: #ea580c; }
        
        .bg-indigo-50 { background-color: #EEF2FF; }
        .bg-indigo-100 { background-color: #e0e7ff; }
        .text-indigo-600 { color: #4f46e5; }
        
        .bg-emerald-100 { background-color: #d1fae5; }
        .text-emerald-600 { color: #059669; }
        
        .bg-rose-100 { background-color: #ffe4e6; }
        .text-rose-600 { color: #e11d48; }
        
        .bg-teal-100 { background-color: #ccfbf1; }
        .text-teal-600 { color: #0d9488; }
        
        .bg-violet-100 { background-color: #ede9fe; }
        .text-violet-600 { color: #7c3aed; }
        
        .bg-cyan-100 { background-color: #cffafe; }
        .text-cyan-600 { color: #0891b2; }
        
        .bg-lime-100 { background-color: #ecfccb; }
        .text-lime-600 { color: #65a30d; }
        
        .bg-amber-100 { background-color: #fef3c7; }
        .text-amber-600 { color: #d97706; }
        
        .bg-slate-100 { background-color: #f1f5f9; }
        .text-slate-600 { color: #475569; }
        
        /* Button styles */
        .btn-primary {
          background-color: var(--color-primary);
          color: white;
          border-radius: 999px;
          font-weight: 600;
          min-height: 44px;
        }
        .btn-primary:hover {
          background-color: var(--color-primary-dark);
        }
        
        /* Card styles */
        .card-rounded {
          border-radius: 20px;
        }
      `}</style>
      {children}
      
      {/* User Role Badge */}
      {userInfo && currentPageName !== 'Login' && currentPageName !== 'Onboarding' && (
        <div className="fixed top-4 right-4 z-50 bg-white/90 backdrop-blur border border-slate-200 shadow-sm px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-top-4">
          <div className={`w-2 h-2 rounded-full ${userInfo.role === 'representative' ? 'bg-green-500' : 'bg-blue-500'}`} />
          <span className="text-slate-600">
            {userInfo.role === 'representative' ? '관리자(대표자)' : '입주자'} 모드
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-400 text-xs">{userInfo.email}</span>
        </div>
      )}
    </div>
  );
}
