
import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./hooks/useAuth";


// Layout components
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AccidentForm from "./pages/AccidentForm";
import WitnessAnalysis from "./pages/WitnessAnalysis";
import AccidentSummary from "./pages/AccidentSummary";
import CauseTree from "./pages/CauseTree";
import Account from "./pages/Account";
import NotFound from "./pages/not-found";
import TestSupabase from "./pages/TestSupabase";
import AutoTest from "./pages/AutoTest";

function Router() {
  const [location] = useLocation();
  const isAuthPage = ["/login", "/register"].includes(location);

  return (
    <div className="min-h-screen flex flex-col bg-light-gray">
      {!isAuthPage && <Header />}
      <main className={isAuthPage ? "flex-1" : "flex-1"}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/accident/new" component={AccidentForm} />
          <Route path="/accident/:id/edit" component={AccidentForm} />
          <Route path="/accident/:id/witness-analysis" component={WitnessAnalysis} />
          <Route path="/accident/:id/summary" component={AccidentSummary} />
          <Route path="/accident/:id/cause-tree" component={CauseTree} />
          <Route path="/account" component={Account} />
          <Route path="/test-supabase" component={TestSupabase} />
          <Route path="/auto-test" component={AutoTest} />

          <Route component={NotFound} />
        </Switch>
      </main>
      {!isAuthPage && <Footer />}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
