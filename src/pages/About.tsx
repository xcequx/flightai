import { useTranslation } from "react-i18next";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Plane, Users, Award, Globe } from "lucide-react";

const About = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4" data-testid="about-title">
              {t('about.title', 'O nas')}
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto" data-testid="about-subtitle">
              {t('about.subtitle', 'Odkrywaj świat z inteligentnym wyszukiwaczem lotów')}
            </p>
          </div>

          {/* Mission Section */}
          <Card className="mb-8">
            <CardContent className="p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4" data-testid="mission-title">
                {t('about.mission.title', 'Nasza Misja')}
              </h2>
              <p className="text-gray-700 leading-relaxed" data-testid="mission-description">
                {t('about.mission.description', 
                  'FlightAI to rewolucyjny wyszukiwacz lotów wykorzystujący sztuczną inteligencję do znajdowania najlepszych połączeń lotniczych z wielodniowymi przystankami. Pomagamy podróżnikom oszczędzać pieniądze i jednocześnie odkrywać nowe miejsca podczas podróży.'
                )}
              </p>
            </CardContent>
          </Card>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <Plane className="h-10 w-10 text-sky-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2" data-testid="feature-smart-search">
                  {t('about.features.smartSearch', 'Inteligentne Wyszukiwanie')}
                </h3>
                <p className="text-gray-600">
                  {t('about.features.smartSearchDesc', 
                    'Nasze algorytmy AI analizują miliony kombinacji lotów, aby znaleźć najlepsze trasy z przystankami.'
                  )}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <Globe className="h-10 w-10 text-sky-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2" data-testid="feature-stopovers">
                  {t('about.features.stopovers', 'Przystanki Strategiczne')}
                </h3>
                <p className="text-gray-600">
                  {t('about.features.stopoversDesc', 
                    'Znajdź loty z 2-3 dniowymi przystankami w fascynujących miastach - oszczędzaj i odkrywaj!'
                  )}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <Award className="h-10 w-10 text-sky-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2" data-testid="feature-savings">
                  {t('about.features.savings', 'Maksymalne Oszczędności')}
                </h3>
                <p className="text-gray-600">
                  {t('about.features.savingsDesc', 
                    'Średnio 25-40% oszczędności w porównaniu do bezpośrednich lotów dzięki inteligentnym przystankom.'
                  )}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <Users className="h-10 w-10 text-sky-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2" data-testid="feature-support">
                  {t('about.features.support', 'Wsparcie 24/7')}
                </h3>
                <p className="text-gray-600">
                  {t('about.features.supportDesc', 
                    'Nasz zespek ekspertów ds. podróży jest dostępny całą dobę, aby pomóc Ci w planowaniu.'
                  )}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Stats Section */}
          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-semibold text-center text-gray-900 mb-8" data-testid="stats-title">
                {t('about.stats.title', 'FlightAI w liczbach')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div>
                  <div className="text-3xl font-bold text-sky-600 mb-2" data-testid="stats-users">500K+</div>
                  <div className="text-gray-600">{t('about.stats.users', 'Zadowolonych użytkowników')}</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-sky-600 mb-2" data-testid="stats-savings">€50M+</div>
                  <div className="text-gray-600">{t('about.stats.savings', 'Oszczędności dla podróżnych')}</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-sky-600 mb-2" data-testid="stats-destinations">200+</div>
                  <div className="text-gray-600">{t('about.stats.destinations', 'Destynacji na całym świecie')}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default About;