import { ReactNode } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Home, User, Upload, Moon, Sun, MessageCircle } from 'lucide-react';
import { useTheme } from 'next-themes';
import LoginButton from './LoginButton';
import { Button } from '@/components/ui/button';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useState } from 'react';
import VideoUploadModal from './VideoUploadModal';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { theme, setTheme } = useTheme();
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const isAuthenticated = !!identity;

  const handleLogoClick = () => {
    navigate({ to: '/' });
  };

  const handleProfileClick = () => {
    if (identity) {
      navigate({ to: '/profile/$userId', params: { userId: identity.getPrincipal().toString() } });
    }
  };

  const handleMessagesClick = () => {
    navigate({ to: '/messages' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <button 
            onClick={handleLogoClick}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <img 
              src="/assets/generated/skelult-logo.dim_256x256.png" 
              alt="SkelUlt" 
              className="h-10 w-10 rounded-xl"
            />
            <span className="text-2xl font-bold text-gradient hidden sm:inline">
              SkelUlt
            </span>
          </button>

          {/* Navigation */}
          <nav className="flex items-center gap-2 sm:gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon" className="rounded-full hover:neon-glow">
                <Home className="h-5 w-5" />
              </Button>
            </Link>

            {isAuthenticated && (
              <>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full hover:neon-glow-cyan"
                  onClick={() => setUploadModalOpen(true)}
                >
                  <Upload className="h-5 w-5" />
                </Button>

                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full hover:neon-glow-pink"
                  onClick={handleMessagesClick}
                  title="SkelMsg"
                >
                  <MessageCircle className="h-5 w-5" />
                </Button>

                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full hover:neon-glow-green"
                  onClick={handleProfileClick}
                >
                  <User className="h-5 w-5" />
                </Button>
              </>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            <LoginButton />
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-card/50 backdrop-blur">
        <div className="container px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} SkelUlt. All rights reserved.</p>
            <p>
              Built with <span className="text-primary">♥</span> using{' '}
              <a
                href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                caffeine.ai
              </a>
            </p>
          </div>
        </div>
      </footer>

      {/* Upload Modal */}
      {isAuthenticated && (
        <VideoUploadModal open={uploadModalOpen} onOpenChange={setUploadModalOpen} />
      )}
    </div>
  );
}
