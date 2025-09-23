import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Plane, MapPin, Calendar, Settings, Sparkles, Globe, Zap, Heart, Search, 
  Users, Award, CheckCircle, Star, TrendingUp, Clock, Shield, ArrowRight,
  BarChart3, DollarSign, Target, Compass, Map, Phone, Mail, Check, Quote
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SearchBuilder } from "@/components/search/SearchBuilder";
import { Navigation } from "@/components/Navigation";
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
    <div className="min-h-screen bg-background">
      {/* Professional Navigation */}
      <Navigation />
      {/* Professional Hero Section with Travel Imagery */}
      <section className="relative overflow-hidden min-h-[85vh] flex items-center hero-professional">
        {/* Professional Background with Travel Theme */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/80 to-accent/70" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.1%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] animate-float" />
        </div>
        
        {/* Hero Content */}
        <div className="relative container mx-auto px-4 py-24 z-10 text-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              {/* Trust Indicators */}
              <div className="flex items-center justify-center gap-8 mb-8 text-white/80 text-sm">
                <div className="flex items-center gap-2" data-testid="text-trust-indicator-customers">
                  <Users className="h-4 w-4" />
                  <span>500,000+ Zadowolonych Klientów</span>
                </div>
                <div className="flex items-center gap-2" data-testid="text-trust-indicator-savings">
                  <TrendingUp className="h-4 w-4" />
                  <span>Średnie Oszczędności: 1,200 zł</span>
                </div>
                <div className="flex items-center gap-2" data-testid="text-trust-indicator-coverage">
                  <Globe className="h-4 w-4" />
                  <span>200+ Krajów Świata</span>
                </div>
              </div>
              
              {/* Main Headlines */}
              <div className="mb-8">
                <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-white to-accent-foreground bg-clip-text text-transparent slide-in-up">
                  FlightAI
                </h1>
                <h2 className="text-2xl md:text-4xl font-semibold mb-6 text-white/95">
                  Najinteligentniejsza Platforma Wyszukiwania Lotów
                </h2>
                <p className="text-lg md:text-xl max-w-4xl mx-auto leading-relaxed text-white/90 mb-8">
                  Znajdź najtańsze opcje podróży z wielodniowymi przesiadkami dzięki sztucznej inteligencji. 
                  Odkrywaj nowe miasta po drodze i oszczędzaj nawet <span className="font-bold text-accent">1000+ złotych</span> na każdej podróży.
                </p>
              </div>
              
              {/* Hero CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                <Button 
                  size="lg" 
                  className="bg-white text-primary hover:bg-white/90 px-8 py-4 text-lg font-semibold shadow-xl"
                  onClick={() => document.getElementById('search-section')?.scrollIntoView({ behavior: 'smooth' })}
                  data-testid="button-hero-search"
                >
                  <Search className="mr-2 h-5 w-5" />
                  Znajdź Najtańsze Loty
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-2 border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold backdrop-blur-sm"
                  onClick={() => navigate('/plan-vacation')}
                  data-testid="button-hero-ai-planner"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  AI Zaplanuj Wakacje
                </Button>
              </div>
              
              {/* Key Benefits Preview */}
              <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20" data-testid="card-hero-benefit-savings">
                  <DollarSign className="h-8 w-8 mx-auto mb-3 text-accent" />
                  <h3 className="font-semibold mb-2">Oszczędzaj Więcej</h3>
                  <p className="text-sm text-white/80">Przeciętnie 1,200 zł oszczędności na każdej podróży</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20" data-testid="card-hero-benefit-ai">
                  <Zap className="h-8 w-8 mx-auto mb-3 text-accent" />
                  <h3 className="font-semibold mb-2">AI Wyszukiwanie</h3>
                  <p className="text-sm text-white/80">Inteligentne algorytmy znajdą najlepsze połączenia</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20" data-testid="card-hero-benefit-explore">
                  <Map className="h-8 w-8 mx-auto mb-3 text-accent" />
                  <h3 className="font-semibold mb-2">Zwiedzaj Więcej</h3>
                  <p className="text-sm text-white/80">Odkryj nowe miasta podczas przesiadek</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Statistics Bar */}
      <section className="bg-white dark:bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div data-testid="stat-searches">
              <div className="text-2xl md:text-3xl font-bold text-primary mb-1">2M+</div>
              <div className="text-sm text-muted-foreground">Wyszukiwań Miesięcznie</div>
            </div>
            <div data-testid="stat-savings">
              <div className="text-2xl md:text-3xl font-bold text-success mb-1">1,200 zł</div>
              <div className="text-sm text-muted-foreground">Średnie Oszczędności</div>
            </div>
            <div data-testid="stat-countries">
              <div className="text-2xl md:text-3xl font-bold text-accent mb-1">200+</div>
              <div className="text-sm text-muted-foreground">Krajów Objętych</div>
            </div>
            <div data-testid="stat-satisfaction">
              <div className="text-2xl md:text-3xl font-bold text-warning mb-1">4.9/5</div>
              <div className="text-sm text-muted-foreground">Ocena Klientów</div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Professional Search Section */}
      <section id="search-section" className="bg-gradient-to-b from-muted/30 to-background py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-3 bg-primary/10 rounded-full px-6 py-2 mb-6">
                <Target className="h-5 w-5 text-primary" />
                <span className="text-primary font-medium">Inteligentne Wyszukiwanie</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Znajdź Swoje <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Idealne Loty</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Zaawansowane algorytmy AI przeszukują miliony kombinacji lotów, aby znaleźć Ci najlepsze opcje 
                podróży z przesiadkami, które pozwolą Ci odkrywać nowe miejsca i oszczędzać pieniądze.
              </p>
            </div>
            
            {/* Professional Search Card */}
            <div className="bg-white dark:bg-card rounded-3xl shadow-2xl border border-border p-8 md:p-12 relative overflow-hidden">
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full -translate-y-16 translate-x-16" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-accent/10 to-transparent rounded-full translate-y-12 -translate-x-12" />
              
              <div className="relative z-10">
                <SearchBuilder onSearch={handleSearch} isLoading={isSearching} />
              </div>
            </div>
            
            {/* Search Tips */}
            <div className="mt-8 grid md:grid-cols-3 gap-6 text-center">
              <div className="flex items-center justify-center gap-3 text-muted-foreground">
                <Clock className="h-5 w-5 text-primary" />
                <span className="text-sm">Wyszukiwanie trwa ~30 sekund</span>
              </div>
              <div className="flex items-center justify-center gap-3 text-muted-foreground">
                <Shield className="h-5 w-5 text-success" />
                <span className="text-sm">100% bezpłatne wyszukiwanie</span>
              </div>
              <div className="flex items-center justify-center gap-3 text-muted-foreground">
                <CheckCircle className="h-5 w-5 text-accent" />
                <span className="text-sm">Bez ukrytych kosztów</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Professional Features Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-6 py-2 mb-6">
                <Award className="h-5 w-5 text-primary" />
                <span className="text-primary font-medium">Dlaczego Nas Wybierają</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Najlepsze <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Rozwiązania Podróżnicze</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Łączymy najnowocześniejsze technologie AI z wieloletnim doświadczeniem w branży turystycznej
              </p>
            </div>
            
            {/* Enhanced Feature Cards */}
            <div className="grid lg:grid-cols-2 gap-12 mb-20">
              {/* Primary Feature - AI Intelligence */}
              <Card className="relative overflow-hidden border-2 border-primary/20 hover:border-primary/40 transition-all duration-300 group">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-r from-primary to-blue-600 rounded-xl p-4 shadow-lg group-hover:shadow-xl transition-shadow">
                      <Zap className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl mb-2">Sztuczna Inteligencja AI</CardTitle>
                      <CardDescription className="text-base">
                        Najinteligentniejsze algorytmy w branży
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    Nasze algorytmy AI analizują miliony kombinacji lotów w czasie rzeczywistym, 
                    uwzględniając ceny, czas podróży, wygodę i możliwości zwiedzania podczas przesiadek.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-success" />
                      <span className="text-sm">Analiza 50M+ opcji lotów dziennie</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-success" />
                      <span className="text-sm">Uczenie maszynowe z preferencji użytkowników</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-success" />
                      <span className="text-sm">Predykcja cen i rekomendacje terminów</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Primary Feature - Smart Stopovers */}
              <Card className="relative overflow-hidden border-2 border-accent/20 hover:border-accent/40 transition-all duration-300 group">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-r from-accent to-orange-500 rounded-xl p-4 shadow-lg group-hover:shadow-xl transition-shadow">
                      <MapPin className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl mb-2">Inteligentne Przesiadki</CardTitle>
                      <CardDescription className="text-base">
                        Odkrywaj nowe miasta podczas podróży
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    Znajdź loty z długimi przesiadkami w fascynujących miastach. 
                    Zamiast czekać na lotnisku, zwiedzaj nowe miejsca i płać mniej za bilety.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-success" />
                      <span className="text-sm">Przesiadki 6-72 godziny w 500+ miastach</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-success" />
                      <span className="text-sm">Rekomendacje atrakcji i hoteli na przesiadki</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-success" />
                      <span className="text-sm">Oszczędności do 60% na kosztach podróży</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Secondary Features Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card className="text-center hover:shadow-lg transition-all duration-300 group">
                <CardContent className="pt-8 pb-6">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-shadow">
                    <Globe className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-3">Globalne Pokrycie</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    200+ krajów, 5000+ lotnisk, współpraca z 800+ liniami lotniczymi na całym świecie
                  </p>
                </CardContent>
              </Card>
              
              <Card className="text-center hover:shadow-lg transition-all duration-300 group">
                <CardContent className="pt-8 pb-6">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-shadow">
                    <Heart className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-3">Personalizacja</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    AI dostosowuje się do Twoich preferencji, pamiętając ulubione linie i destynacje
                  </p>
                </CardContent>
              </Card>
              
              <Card className="text-center hover:shadow-lg transition-all duration-300 group">
                <CardContent className="pt-8 pb-6">
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-shadow">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-3">Bezpieczeństwo</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Szyfrowane połączenia, bezpieczne płatności i ochrona danych osobowych
                  </p>
                </CardContent>
              </Card>
              
              <Card className="text-center hover:shadow-lg transition-all duration-300 group">
                <CardContent className="pt-8 pb-6">
                  <div className="bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-shadow">
                    <Clock className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-3">24/7 Wsparcie</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Całodobowe wsparcie klienta w języku polskim przez ekspertów podróżniczych
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
      
      {/* Social Proof Section - Testimonials */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-success/10 rounded-full px-6 py-2 mb-6">
                <Star className="h-5 w-5 text-success" />
                <span className="text-success font-medium">Opinie Klientów</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ponad <span className="text-success">500,000</span> Zadowolonych Podróżników
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Dołącz do tysięcy klientów, którzy już oszczędzili miliony złotych na podróżach
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {/* Testimonial 1 */}
              <Card className="relative">
                <CardContent className="pt-6">
                  <Quote className="h-8 w-8 text-primary/30 mb-4" />
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    "Zaoszczędziłam 1,400 zł na locie do Tokio! 2 dni w Helsinkach podczas przesiadki były niesamowite."
                  </p>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground">AK</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold text-sm">Anna Kowalska</div>
                      <div className="text-muted-foreground text-xs">Warszawa</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              {/* Testimonial 2 */}
              <Card className="relative">
                <CardContent className="pt-6">
                  <Quote className="h-8 w-8 text-primary/30 mb-4" />
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    "Niesamowite! Lot do Bali z 20-godzinną przesiadką w Dubaju. Zwiedziliśmy miasto i zapłaciliśmy 800 zł mniej."
                  </p>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-accent text-accent-foreground">MW</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold text-sm">Marcin Wiśniewski</div>
                      <div className="text-muted-foreground text-xs">Kraków</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              {/* Testimonial 3 */}
              <Card className="relative">
                <CardContent className="pt-6">
                  <Quote className="h-8 w-8 text-primary/30 mb-4" />
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    "FlightAI to rewolucja! Plan podróży po 3 krajach w cenie zwykłego lotu. Polecam wszystkim!"
                  </p>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-success text-success-foreground">KN</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold text-sm">Katarzyna Nowak</div>
                      <div className="text-muted-foreground text-xs">Gdańsk</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
      
      {/* AI Vacation Planning CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-accent text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8">
              <div className="inline-flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 mb-6">
                <Sparkles className="h-6 w-6" />
                <span className="font-semibold">Nowość: AI Vacation Planner</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Pozwól AI Zaplanować <br />Twoją Idealną Podróż
              </h2>
              <p className="text-xl text-white/90 mb-8 leading-relaxed max-w-3xl mx-auto">
                Podaj budżet, preferencje i destynację marzeń. Nasza sztuczna inteligencja stworzy 
                kompletny plan podróży: loty z przesiadkami, hotele, atrakcje i lokalne doświadczenia.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 mb-10">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <Compass className="h-8 w-8 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Personalizacja</h3>
                <p className="text-sm text-white/80">AI dobiera podróż do Twoich zainteresowań</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <DollarSign className="h-8 w-8 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Optymalizacja Budżetu</h3>
                <p className="text-sm text-white/80">Maksymalne wykorzystanie każdej złotówki</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <Map className="h-8 w-8 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Kompleksowy Plan</h3>
                <p className="text-sm text-white/80">Od lotu po ostatni dzień zwiedzania</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                size="lg" 
                className="bg-white text-primary hover:bg-white/90 px-8 py-4 text-lg font-semibold shadow-xl"
                onClick={() => navigate('/plan-vacation')}
                data-testid="button-ai-vacation-planner"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Zaplanuj Wakacje z AI
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-2 border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold backdrop-blur-sm"
                onClick={() => document.getElementById('search-section')?.scrollIntoView({ behavior: 'smooth' })}
                data-testid="button-search-flights-secondary"
              >
                Lub Szukaj Lotów Ręcznie
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer Section */}
      <footer className="bg-background border-t py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8 mb-12">
              {/* Brand Column */}
              <div className="md:col-span-2">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-primary rounded-lg p-2">
                    <Plane className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <span className="text-2xl font-bold">FlightAI</span>
                </div>
                <p className="text-muted-foreground mb-6 leading-relaxed max-w-md">
                  Najinteligentniejsza platforma wyszukiwania lotów z przesiadkami. 
                  Odkrywaj świat i oszczędzaj pieniądze dzięki sztucznej inteligencji.
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>hello@flightai.com</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>+48 123 456 789</span>
                  </div>
                </div>
              </div>
              
              {/* Quick Links */}
              <div>
                <h3 className="font-semibold mb-4">Szybkie Linki</h3>
                <div className="space-y-3 text-sm">
                  <div><a href="/" className="text-muted-foreground hover:text-primary transition-colors">Wyszukaj Loty</a></div>
                  <div><a href="/plan-vacation" className="text-muted-foreground hover:text-primary transition-colors">AI Planner</a></div>
                  <div><a href="/about" className="text-muted-foreground hover:text-primary transition-colors">O Nas</a></div>
                  <div><a href="/contact" className="text-muted-foreground hover:text-primary transition-colors">Kontakt</a></div>
                </div>
              </div>
              
              {/* Support */}
              <div>
                <h3 className="font-semibold mb-4">Wsparcie</h3>
                <div className="space-y-3 text-sm">
                  <div><a href="/help" className="text-muted-foreground hover:text-primary transition-colors">Centrum Pomocy</a></div>
                  <div><a href="/faq" className="text-muted-foreground hover:text-primary transition-colors">FAQ</a></div>
                  <div><a href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">Prywatność</a></div>
                  <div><a href="/terms" className="text-muted-foreground hover:text-primary transition-colors">Regulamin</a></div>
                </div>
              </div>
            </div>
            
            {/* Bottom Bar */}
            <div className="pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                © 2024 FlightAI. Wszelkie prawa zastrzeżone.
              </div>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <span>Wykonane z ❤️ w Polsce</span>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span>Bezpieczne płatności SSL</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;