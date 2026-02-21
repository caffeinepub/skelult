import { useState } from 'react';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Home, Upload, MessageSquare, User, Moon, Sun, Film } from 'lucide-react';
import { useTheme } from 'next-themes';
import LoginButton from './LoginButton';
import VideoUploadModal from './VideoUploadModal';
import { useInternetIdentity } from '../hooks/useInternetIdentity';

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const { identity } = useInternetIdentity();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const isAuthenticated = !!identity;

  const handleUploadClick = () => {
    if (!isAuthenticated) {
      navigate({ to: '/' });
      return;
    }
    setUploadModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => navigate({ to: '/' })}
          >
            <img 
              src="/assets/generated/skelult-logo.dim_200x60.png" 
              alt="SkelUlt Logo" 
              className="h-8 w-auto group-hover:scale-105 transition-transform"
            />
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-2">
            <Button
              variant={currentPath === '/' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => navigate({ to: '/' })}
              className="rounded-full"
            >
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>

            <Button
              variant={currentPath === '/vidles' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => navigate({ to: '/vidles' })}
              className="rounded-full"
            >
              <Film className="h-4 w-4 mr-2" />
              Vidles
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleUploadClick}
              className="rounded-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>

            {isAuthenticated && (
              <>
                <Button
                  variant={currentPath === '/messages' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => navigate({ to: '/messages' })}
                  className="rounded-full"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Messages
                </Button>

                <Button
                  variant={currentPath.startsWith('/profile') ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => navigate({ to: '/profile/$userId', params: { userId: identity.getPrincipal().toString() } })}
                  className="rounded-full"
                >
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </Button>
              </>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="rounded-full"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            <LoginButton />
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-muted/30 py-6 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} SkelUlt. Built with ❤️ using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>

      {/* Upload Modal */}
      <VideoUploadModal open={uploadModalOpen} onOpenChange={setUploadModalOpen} />
    </div>
  );
}
