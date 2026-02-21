import { StrictMode, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter, createRoute, createRootRoute, Outlet } from '@tanstack/react-router';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import Layout from './components/Layout';
import FeedPage from './pages/FeedPage';
import ProfilePage from './pages/ProfilePage';
import VideoDetailPage from './pages/VideoDetailPage';
import MessagingPage from './pages/MessagingPage';
import VidlesPage from './pages/VidlesPage';
import ErrorBoundary from './components/ErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Root component with proper naming for React Hooks
function RootComponent() {
  useEffect(() => {
    console.log('App component mounted');
  }, []);

  console.log('App component rendering');

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

// Root route with Layout wrapper
const rootRoute = createRootRoute({
  component: RootComponent,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: FeedPage,
});

const vidlesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/vidles',
  component: VidlesPage,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile/$userId',
  component: ProfilePage,
});

const videoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/video/$videoId',
  component: VideoDetailPage,
});

const messagesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/messages',
  component: MessagingPage,
});

// Catch-all route for 404
const notFoundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '*',
  component: () => {
    console.log('404 page rendering');
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Page Not Found</h2>
          <p className="text-muted-foreground">The page you're looking for doesn't exist</p>
        </div>
      </div>
    );
  },
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  vidlesRoute,
  profileRoute,
  videoRoute,
  messagesRoute,
  notFoundRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <StrictMode>
      <ErrorBoundary>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
            <Toaster />
          </QueryClientProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </StrictMode>
  );
}
