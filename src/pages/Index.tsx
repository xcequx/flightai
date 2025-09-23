import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plane, MapPin, Calendar, Settings, Sparkles, Globe, Zap, Heart, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchBuilder } from "@/components/search/SearchBuilder";
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (searchParams: any) => {
    setIsSearching(true);
    
    // Generate mock search ID
    const searchId = Math.random().toString(36).substring(2, 15);
    
    toast({
      title: "Wyszukiwanie rozpoczęte",
      description: "Przekierowuję do strony z wynikami...",
    });

    // Simulate brief delay then redirect
    setTimeout(() => {
      setIsSearching(false);
      navigate(`/results/${searchId}`, {
        state: searchParams.realFlightData ? { realFlightData: searchParams.realFlightData } : undefined,
      });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Enhanced Hero Section */}
      <section className="relative overflow-hidden hero-gradient text-white min-h-[70vh] flex items-center">
        <div className="hero-background"></div>
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative container mx-auto px-4 py-20 z-10">
          <div className="max-w-5xl mx-auto text-center">
            <div className="flex items-center justify-center gap-4 mb-8 bounce-in">
              <div className="relative">
                <Plane className="h-16 w-16 text-white pulse-glow" />
                <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-yellow-300 animate-pulse" />
              </div>
              <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                FlightAI
              </h1>
            </div>
            <h2 className="text-3xl md:text-4xl mb-6 opacity-95 slide-in-up">
              Inteligentny wyszukiwacz lotów z przesiadkami
            </h2>
            <p className="text-xl md:text-2xl opacity-85 max-w-3xl mx-auto leading-relaxed fade-in-delayed">
              Znajdź najtańsze opcje podróży z wielodniowymi przesiadkami. 
              Odkryj nowe miasta po drodze i zaoszczędź pieniądze dzięki AI.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4 fade-in-delayed">
              <Button 
                size="lg" 
                className="btn-primary-enhanced px-8 py-4 text-lg font-semibold"
                onClick={() => document.getElementById('search-section')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <Search className="mr-2 h-5 w-5" />
                Szukaj Lotów
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="px-8 py-4 text-lg font-semibold border-white/30 text-white hover:bg-white/10"
                onClick={() => navigate('/plan-vacation')}
              >
                <Sparkles className="mr-2 h-5 w-5" />
                AI Zaplanuj Wakacje
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Search Section */}
      <section id="search-section" className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="floating-card glow-effect bg-card rounded-3xl shadow-2xl border border-white/10 p-10">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="bg-primary/10 rounded-full p-3">
                  <MapPin className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Zaplanuj swoją podróż
                </h3>
              </div>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Skorzystaj z zaawansowanych algorytmów AI, aby znaleźć idealne połączenia lotnicze z przesiadkami
              </p>
            </div>
            
            <SearchBuilder onSearch={handleSearch} isLoading={isSearching} />
          </div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Dlaczego FlightAI?
              </span>
            </h3>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Najnowocześniejsze technologie AI w służbie Twojej idealnej podróży
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="floating-card glass-card text-center p-8 rounded-2xl border border-white/10">
              <div className="bg-gradient-to-r from-primary to-blue-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Plane className="h-10 w-10 text-white" />
              </div>
              <h4 className="text-xl font-bold mb-4 text-foreground">Inteligentne przesiadki</h4>
              <p className="text-muted-foreground leading-relaxed">
                AI analizuje tysiące kombinacji lotów, znajdując optymalne przesiadki z czasem na zwiedzanie
              </p>
            </div>
            
            <div className="floating-card glass-card text-center p-8 rounded-2xl border border-white/10">
              <div className="bg-gradient-to-r from-accent to-orange-500 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Zap className="h-10 w-10 text-white" />
              </div>
              <h4 className="text-xl font-bold mb-4 text-foreground">Błyskawiczne wyszukiwanie</h4>
              <p className="text-muted-foreground leading-relaxed">
                Zaawansowane algorytmy przetwarzają dane z wielu linii lotniczych w czasie rzeczywistym
              </p>
            </div>
            
            <div className="floating-card glass-card text-center p-8 rounded-2xl border border-white/10">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Globe className="h-10 w-10 text-white" />
              </div>
              <h4 className="text-xl font-bold mb-4 text-foreground">Globalne połączenia</h4>
              <p className="text-muted-foreground leading-relaxed">
                Dostęp do lotów z całego świata, włącznie z regionalnymi liniami i niższymi kosztami
              </p>
            </div>
            
            <div className="floating-card glass-card text-center p-8 rounded-2xl border border-white/10">
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Heart className="h-10 w-10 text-white" />
              </div>
              <h4 className="text-xl font-bold mb-4 text-foreground">Personalizowane doradztwo</h4>
              <p className="text-muted-foreground leading-relaxed">
                AI uczy się Twoich preferencji i proponuje najlepsze opcje dopasowane do Twojego stylu podróżowania
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* New AI Vacation Planning Teaser */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="floating-card glow-effect bg-gradient-to-r from-primary/10 to-accent/10 rounded-3xl p-12 border border-primary/20">
            <Sparkles className="h-16 w-16 mx-auto mb-6 text-primary bounce-in" />
            <h3 className="text-3xl md:text-4xl font-bold mb-6">
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Nadchodząca funkcja: AI Zaplanuj Wakacje
              </span>
            </h3>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Podaj swój budżet i region świata, a nasza sztuczna inteligencja znajdzie dla Ciebie 
              idealne połączenie lotów, hotelów i atrakcji turystycznych.
            </p>
            <Button 
              size="lg" 
              className="btn-primary-enhanced px-8 py-4 text-lg font-semibold"
              onClick={() => navigate('/plan-vacation')}
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Spróbuj AI Planner (Wkrótce)
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;