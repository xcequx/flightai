import { useTranslation } from "react-i18next";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, MapPin, Phone, MessageCircle } from "lucide-react";

const Contact = () => {
  const { t } = useTranslation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log("Contact form submitted");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4" data-testid="contact-title">
              {t('contact.title', 'Kontakt')}
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto" data-testid="contact-subtitle">
              {t('contact.subtitle', 'Masz pytania? Skontaktuj się z nami!')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2" data-testid="form-title">
                  <MessageCircle className="h-5 w-5" />
                  {t('contact.form.title', 'Napisz do nas')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name" data-testid="label-name">
                      {t('contact.form.name', 'Imię i nazwisko')}
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder={t('contact.form.namePlaceholder', 'Twoje imię i nazwisko')}
                      required
                      data-testid="input-name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email" data-testid="label-email">
                      {t('contact.form.email', 'Email')}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder={t('contact.form.emailPlaceholder', 'twoj@email.com')}
                      required
                      data-testid="input-email"
                    />
                  </div>

                  <div>
                    <Label htmlFor="subject" data-testid="label-subject">
                      {t('contact.form.subject', 'Temat')}
                    </Label>
                    <Input
                      id="subject"
                      type="text"
                      placeholder={t('contact.form.subjectPlaceholder', 'Na jaki temat chcesz napisać?')}
                      required
                      data-testid="input-subject"
                    />
                  </div>

                  <div>
                    <Label htmlFor="message" data-testid="label-message">
                      {t('contact.form.message', 'Wiadomość')}
                    </Label>
                    <Textarea
                      id="message"
                      placeholder={t('contact.form.messagePlaceholder', 'Opisz swoje pytanie lub sugestię...')}
                      rows={5}
                      required
                      data-testid="textarea-message"
                    />
                  </div>

                  <Button type="submit" className="w-full" data-testid="button-submit">
                    {t('contact.form.submit', 'Wyślij wiadomość')}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-sky-600 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1" data-testid="email-title">
                        {t('contact.info.email', 'Email')}
                      </h3>
                      <p className="text-gray-600" data-testid="email-address">
                        kontakt@flightai.pl
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {t('contact.info.emailDesc', 'Odpowiadamy w ciągu 24h')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-sky-600 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1" data-testid="phone-title">
                        {t('contact.info.phone', 'Telefon')}
                      </h3>
                      <p className="text-gray-600" data-testid="phone-number">
                        +48 22 123 45 67
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {t('contact.info.phoneDesc', 'Pon-Pt 9:00-18:00')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-sky-600 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1" data-testid="address-title">
                        {t('contact.info.address', 'Adres')}
                      </h3>
                      <p className="text-gray-600" data-testid="address-details">
                        ul. Przykładowa 123<br />
                        00-001 Warszawa<br />
                        Polska
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* FAQ Link */}
              <Card className="bg-sky-50 border-sky-200">
                <CardContent className="p-6 text-center">
                  <h3 className="font-semibold mb-2" data-testid="faq-title">
                    {t('contact.faq.title', 'Często zadawane pytania')}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {t('contact.faq.desc', 'Sprawdź odpowiedzi na najczęstsze pytania')}
                  </p>
                  <Button variant="outline" data-testid="button-faq">
                    {t('contact.faq.button', 'Zobacz FAQ')}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;