import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import Index from "./pages/Index";
import Results from "./pages/Results";
import PlanVacation from "./pages/PlanVacation";
import VacationResults from "./pages/VacationResults";
import NotFound from "./pages/NotFound";
import "./i18n";

const queryClient = new QueryClient();

const AppContent = () => {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    // Update page title using localized strings
    document.title = t('meta.title');

    // Update meta description using localized strings
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', t('meta.description'));
    
    // Update Open Graph meta tags for better social media sharing
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', t('meta.title'));
    
    let ogDescription = document.querySelector('meta[property="og:description"]');
    if (!ogDescription) {
      ogDescription = document.createElement('meta');
      ogDescription.setAttribute('property', 'og:description');
      document.head.appendChild(ogDescription);
    }
    ogDescription.setAttribute('content', t('meta.description'));
    
    let ogLocale = document.querySelector('meta[property="og:locale"]');
    if (!ogLocale) {
      ogLocale = document.createElement('meta');
      ogLocale.setAttribute('property', 'og:locale');
      document.head.appendChild(ogLocale);
    }
    const currentLang = i18n.resolvedLanguage?.split('-')[0] || 'pl';
    ogLocale.setAttribute('content', currentLang === 'pl' ? 'pl_PL' : 'en_US');
  }, [i18n.resolvedLanguage, t]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/results/:searchId" element={<Results />} />
        <Route path="/plan-vacation" element={<PlanVacation />} />
        <Route path="/vacation-results" element={<VacationResults />} />
        <Route path="/" element={<Index />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppContent />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
