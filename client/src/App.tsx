import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "./pages/not-found";
import Landing from "./pages/landing";
import Home from "./pages/home";
import Sleep from "./pages/sleep";
import Exercise from "./pages/exercise";
import Medication from "./pages/medication";
import Mood from "./pages/mood";
import Journal from "./pages/journal";
import Chat from "./pages/chat";
import GamificationPage from "./pages/gamification";
import Header from "@/components/layout/header";
import MobileNav from "@/components/layout/mobile-nav";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show landing page if not authenticated or still loading
  if (isLoading || !isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route component={Landing} />
      </Switch>
    );
  }

  // Show authenticated app with header and navigation
  return (
    <div className="min-h-screen bg-moodbuddy-neutral-50 dark:bg-background">
      <Header />
      <main className="pb-20 md:pb-8">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/sleep" component={Sleep} />
          <Route path="/exercise" component={Exercise} />
          <Route path="/medication" component={Medication} />
          <Route path="/mood" component={Mood} />
          <Route path="/journal" component={Journal} />
          <Route path="/chat" component={Chat} />
          <Route path="/progress" component={GamificationPage} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <MobileNav />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
