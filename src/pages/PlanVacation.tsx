import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, Plane, MapPin, Calendar, DollarSign, Users, ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface VacationFormData {
  budget: string;
  region: string;
  duration: string;
  travelStyle: string;
  interests: string[];
  departureCity: string;
}

const INTEREST_OPTIONS = [
  "Historia i kultura", "Sztuka i muzea", "Przyroda i krajobraz", "Przygoda i sport", 
  "Jedzenie i kuchnia", "Życie nocne", "Architektura", "Plaże i relaks", 
  "Zakupy", "Fotografia", "Festiwale i wydarzenia", "Wellness i spa"
];

const TRAVEL_STYLES = [
  { value: "budget", label: "Budget - maksymalne oszczędności" },
  { value: "mid-range", label: "Średni - balans cena/komfort" },
  { value: "luxury", label: "Luksusowy - najwyższy komfort" },
  { value: "adventure", label: "Przygodowy - aktywny wypoczynek" },
  { value: "cultural", label: "Kulturalny - historia i tradycje" },
  { value: "relaxation", label: "Relaksacyjny - odpoczynek i wellness" }
];

const REGIONS = [
  "Europa Zachodnia", "Europa Środkowa", "Europa Południowa", "Skandynavia",
  "Azja Południowo-Wschodnia", "Azja Wschodnia", "Bliski Wschód",
  "Ameryka Północna", "Ameryka Środkowa", "Ameryka Południowa",
  "Afryka Północna", "Afryka Wschodnia", "Afryka Południowa",
  "Oceania", "Karaiby", "Rosja i Azja Centralna"
];

const PlanVacation = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<VacationFormData>({
    budget: "",
    region: "",
    duration: "",
    travelStyle: "",
    interests: [],
    departureCity: ""
  });

  const handleInterestChange = (interest: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      interests: checked 
        ? [...prev.interests, interest]
        : prev.interests.filter(i => i !== interest)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.budget || !formData.region || !formData.duration || 
        !formData.travelStyle || !formData.departureCity) {
      toast({
        title: "Błąd formularza",
        description: "Wypełnij wszystkie wymagane pola",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/vacation/plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Plan wakacji gotowy!",
          description: "AI wygenerował spersonalizowany plan podróży dla Ciebie",
        });
        // Navigate to results page with the plan data
        navigate('/vacation-results', { 
          state: { 
            planData: data.data,
            formData 
          } 
        });
      } else {
        throw new Error(data.error || 'Failed to generate vacation plan');
      }
    } catch (error) {
      console.error('Error generating vacation plan:', error);
      toast({
        title: "Błąd generowania planu",
        description: "Nie udało się wygenerować planu wakacji. Spróbuj ponownie.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <section className="bg-gradient-to-r from-primary to-accent/80 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="mb-6 text-white hover:bg-white/10"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Powrót do wyszukiwania lotów
            </Button>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-6">
                <Sparkles className="h-12 w-12 text-yellow-300" />
                <h1 className="text-4xl md:text-5xl font-bold">AI Zaplanuj Wakacje</h1>
              </div>
              <p className="text-xl opacity-90 max-w-3xl mx-auto">
                Podaj swoje preferencje, a sztuczna inteligencja znajdzie dla Ciebie idealne 
                połączenie lotów, hoteli i atrakcji dopasowane do Twojego budżetu
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Card className="floating-card glow-effect bg-card rounded-3xl shadow-2xl border border-white/10 p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Budget */}
                <div className="space-y-2">
                  <Label htmlFor="budget" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Budżet całkowity (PLN) *
                  </Label>
                  <Input
                    id="budget"
                    type="number"
                    min="500"
                    step="100"
                    placeholder="5000"
                    value={formData.budget}
                    onChange={(e) => setFormData({...formData, budget: e.target.value})}
                    className="text-lg"
                    data-testid="input-budget"
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Obejmuje loty, hotele, wyżywienie i atrakcje
                  </p>
                </div>

                {/* Duration */}
                <div className="space-y-2">
                  <Label htmlFor="duration" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Długość podróży (dni) *
                  </Label>
                  <Input
                    id="duration"
                    type="number"
                    min="3"
                    max="30"
                    placeholder="7"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: e.target.value})}
                    className="text-lg"
                    data-testid="input-duration"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Region */}
                <div className="space-y-2">
                  <Label htmlFor="region" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Region świata *
                  </Label>
                  <Select value={formData.region} onValueChange={(value) => setFormData({...formData, region: value})}>
                    <SelectTrigger data-testid="select-region">
                      <SelectValue placeholder="Wybierz region..." />
                    </SelectTrigger>
                    <SelectContent>
                      {REGIONS.map(region => (
                        <SelectItem key={region} value={region}>
                          {region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Departure City */}
                <div className="space-y-2">
                  <Label htmlFor="departureCity" className="flex items-center gap-2">
                    <Plane className="h-4 w-4" />
                    Miasto wylotu *
                  </Label>
                  <Input
                    id="departureCity"
                    placeholder="Warszawa"
                    value={formData.departureCity}
                    onChange={(e) => setFormData({...formData, departureCity: e.target.value})}
                    className="text-lg"
                    data-testid="input-departure-city"
                    required
                  />
                </div>
              </div>

              {/* Travel Style */}
              <div className="space-y-2">
                <Label htmlFor="travelStyle" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Styl podróżowania *
                </Label>
                <Select value={formData.travelStyle} onValueChange={(value) => setFormData({...formData, travelStyle: value})}>
                  <SelectTrigger data-testid="select-travel-style">
                    <SelectValue placeholder="Wybierz styl podróżowania..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TRAVEL_STYLES.map(style => (
                      <SelectItem key={style.value} value={style.value}>
                        {style.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Interests */}
              <div className="space-y-4">
                <Label className="text-base font-medium">
                  Zainteresowania (opcjonalne)
                </Label>
                <p className="text-sm text-muted-foreground">
                  Wybierz to, co Cię najbardziej interesuje podczas podróży
                </p>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {INTEREST_OPTIONS.map(interest => (
                    <div key={interest} className="flex items-center space-x-2">
                      <Checkbox
                        id={interest}
                        checked={formData.interests.includes(interest)}
                        onCheckedChange={(checked) => handleInterestChange(interest, checked as boolean)}
                        data-testid={`checkbox-${interest.toLowerCase().replace(/\s+/g, '-')}`}
                      />
                      <Label htmlFor={interest} className="text-sm font-normal cursor-pointer">
                        {interest}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <div className="text-center pt-6">
                <Button 
                  type="submit" 
                  size="lg"
                  disabled={isLoading}
                  className="btn-primary-enhanced px-12 py-4 text-lg font-semibold"
                  data-testid="button-generate-plan"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      AI generuje plan...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Wygeneruj Plan Wakacji
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default PlanVacation;