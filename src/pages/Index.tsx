import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plane, MapPin, Calendar, Settings } from "lucide-react";
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
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-primary to-accent/80 text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Plane className="h-12 w-12 text-white" />
              <h1 className="text-5xl font-bold">Lovable</h1>
            </div>
            <h2 className="text-2xl mb-4 opacity-90">
              Inteligentny wyszukiwacz lotów z przesiadkami
            </h2>
            <p className="text-lg opacity-80 max-w-2xl mx-auto">
              Znajdź najtańsze opcje podróży z wielodniowymi przesiadkami. 
              Odkryj nowe miasta po drodze i zaoszczędź pieniądze.
            </p>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card rounded-2xl shadow-lg border p-8">
            <div className="flex items-center gap-3 mb-6">
              <MapPin className="h-6 w-6 text-primary" />
              <h3 className="text-2xl font-semibold text-card-foreground">
                Zaplanuj swoją podróż
              </h3>
            </div>
            
            <SearchBuilder onSearch={handleSearch} isLoading={isSearching} />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12 text-foreground">
            Dlaczego warto wybrać Lovable?
          </h3>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Plane className="h-8 w-8 text-primary" />
              </div>
              <h4 className="text-xl font-semibold mb-3">Inteligentne przesiadki</h4>
              <p className="text-muted-foreground">
                Algorytm znajduje optymalne kombinacje lotów z kilkudniowymi przesiadkami
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-accent/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Settings className="h-8 w-8 text-accent-foreground" />
              </div>
              <h4 className="text-xl font-semibold mb-3">Zaawansowane filtry</h4>
              <p className="text-muted-foreground">
                Dostosuj wyszukiwanie według ceny, czasu podróży i poziomu ryzyka
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-success/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-success" />
              </div>
              <h4 className="text-xl font-semibold mb-3">Elastyczne daty</h4>
              <p className="text-muted-foreground">
                Znajdź najlepsze oferty w elastycznych przedziałach czasowych
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;