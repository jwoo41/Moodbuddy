import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "./pages/not-found";
import Dashboard from "./pages/dashboard";
import Sleep from "./pages/sleep";
import Medication from "./pages/medication";
import Mood from "./pages/mood";
import Journal from "./pages/journal";
import Header from "@/components/layout/header";
import MobileNav from "@/components/layout/mobile-nav";

function Router() {
  return (
    <div className="min-h-screen bg-mindflow-neutral-50 dark:bg-background">
      <Header />
      <main className="pb-20 md:pb-8">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/sleep" component={Sleep} />
          <Route path="/medication" component={Medication} />
          <Route path="/mood" component={Mood} />
          <Route path="/journal" component={Journal} />
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
