import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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




const PlanVacation = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
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
        title: t('toast.formError'),
        description: t('toast.fillRequired'),
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
          title: t('toast.planReady'),
          description: t('toast.planReadyDesc'),
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
        title: t('toast.planError'),
        description: t('toast.planErrorDesc'),
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
              {t('vacation.backToHome')}
            </Button>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-6">
                <Sparkles className="h-12 w-12 text-yellow-300" />
                <h1 className="text-4xl md:text-5xl font-bold">{t('vacation.title')}</h1>
              </div>
              <p className="text-xl opacity-90 max-w-3xl mx-auto">
                {t('vacation.description')}
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
                    {t('vacation.budget')} *
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
                    {t('vacation.budgetHelper')}
                  </p>
                </div>

                {/* Duration */}
                <div className="space-y-2">
                  <Label htmlFor="duration" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {t('vacation.duration')} *
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
                    {t('vacation.region')} *
                  </Label>
                  <Select value={formData.region} onValueChange={(value) => setFormData({...formData, region: value})}>
                    <SelectTrigger data-testid="select-region">
                      <SelectValue placeholder={t('common.selectRegion')} />
                    </SelectTrigger>
                    <SelectContent>
                      {t('vacation.regions', { returnObjects: true }).map((region: string, index: number) => (
                        <SelectItem key={index} value={region}>
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
                    {t('vacation.departureCity')} *
                  </Label>
                  <Input
                    id="departureCity"
                    placeholder={t('common.defaultCity')}
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
                  {t('vacation.travelStyle')} *
                </Label>
                <Select value={formData.travelStyle} onValueChange={(value) => setFormData({...formData, travelStyle: value})}>
                  <SelectTrigger data-testid="select-travel-style">
                    <SelectValue placeholder={t('common.selectTravelStyle')} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(t('vacation.travelStyles', { returnObjects: true })).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label as string}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Interests */}
              <div className="space-y-4">
                <Label className="text-base font-medium">
                  {t('vacation.interests')} ({t('common.optional')})
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t('vacation.interestsDesc')}
                </p>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {t('vacation.interestOptions', { returnObjects: true }).map((interest: string, index: number) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Checkbox
                        id={`interest-${index}`}
                        checked={formData.interests.includes(interest)}
                        onCheckedChange={(checked) => handleInterestChange(interest, checked as boolean)}
                        data-testid={`checkbox-${interest.toLowerCase().replace(/\s+/g, '-')}`}
                      />
                      <Label htmlFor={`interest-${index}`} className="text-sm font-normal cursor-pointer">
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
                      {t('vacation.generating')}
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      {t('vacation.generatePlan')}
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