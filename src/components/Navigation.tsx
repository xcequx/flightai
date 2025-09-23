import { useState } from "react";
import { Link } from "react-router-dom";
import { Plane, Menu, X, Phone, Mail, Info, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white/95 dark:bg-background/95 backdrop-blur-md border-b border-border sticky top-0 z-50 shadow-sm nav-professional">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            data-testid="link-home-logo"
          >
            <div className="bg-primary rounded-lg p-2 shadow-md">
              <Plane className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              FlightAI
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Wyszukaj Loty</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                      <li className="row-span-3">
                        <NavigationMenuLink asChild>
                          <Link
                            className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-primary/20 to-primary/10 p-6 no-underline outline-none focus:shadow-md"
                            to="/"
                            data-testid="link-flight-search"
                          >
                            <Plane className="h-6 w-6 mb-2" />
                            <div className="mb-2 mt-4 text-lg font-medium">
                              Inteligentny Wyszukiwacz
                            </div>
                            <p className="text-sm leading-tight text-muted-foreground">
                              Znajdź najtańsze opcje podróży z wielodniowymi przesiadkami używając AI
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      <ListItem href="/" title="Wyszukiwarka Lotów">
                        Znajdź loty z przesiadkami i zaoszczędź pieniądze
                      </ListItem>
                      <ListItem href="/" title="Multi-City Trips">
                        Odwiedź wiele miast w jednej podróży
                      </ListItem>
                      <ListItem href="/" title="Flexible Dates">
                        Elastyczne daty dla najlepszych cen
                      </ListItem>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger>AI Planner</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                      <ListItem 
                        title="Zaplanuj Wakacje" 
                        href="/plan-vacation"
                        icon={<Sparkles className="h-4 w-4" />}
                      >
                        AI zaplanuje Ci idealną podróż na podstawie budżetu i preferencji
                      </ListItem>
                      <ListItem title="Smart Recommendations" href="/">
                        Personalizowane rekomendacje destynacji
                      </ListItem>
                      <ListItem title="Budget Optimizer" href="/">
                        Optymalizuj koszty podróży z AI
                      </ListItem>
                      <ListItem title="Weather-Based Planning" href="/">
                        Planuj na podstawie prognozy pogody
                      </ListItem>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Link to="/about" data-testid="link-about">
                    <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                      O Nas
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Link to="/contact" data-testid="link-contact">
                    <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                      Kontakt
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* CTA Button - Desktop */}
          <div className="hidden md:flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => document.getElementById('search-section')?.scrollIntoView({ behavior: 'smooth' })}
              data-testid="button-search-desktop"
            >
              Szukaj Lotów
            </Button>
            <Button 
              size="sm"
              className="bg-primary hover:bg-primary/90"
              onClick={() => window.location.href = '/plan-vacation'}
              data-testid="button-ai-planner-desktop"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              AI Planner
            </Button>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" data-testid="button-mobile-menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col h-full">
                  {/* Mobile Logo */}
                  <div className="flex items-center gap-3 pb-6 border-b">
                    <div className="bg-primary rounded-lg p-2">
                      <Plane className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <span className="text-lg font-bold">FlightAI</span>
                  </div>

                  {/* Mobile Navigation Links */}
                  <div className="flex flex-col gap-4 py-6 flex-1">
                    <Link 
                      to="/" 
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                      onClick={() => setIsOpen(false)}
                      data-testid="link-home-mobile"
                    >
                      <Plane className="h-5 w-5 text-primary" />
                      <span className="font-medium">Wyszukaj Loty</span>
                    </Link>

                    <Link 
                      to="/plan-vacation" 
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                      onClick={() => setIsOpen(false)}
                      data-testid="link-ai-planner-mobile"
                    >
                      <Sparkles className="h-5 w-5 text-primary" />
                      <span className="font-medium">AI Planner</span>
                    </Link>

                    <Link 
                      to="/about" 
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                      onClick={() => setIsOpen(false)}
                      data-testid="link-about-mobile"
                    >
                      <Info className="h-5 w-5 text-primary" />
                      <span className="font-medium">O Nas</span>
                    </Link>

                    <Link 
                      to="/contact" 
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                      onClick={() => setIsOpen(false)}
                      data-testid="link-contact-mobile"
                    >
                      <Phone className="h-5 w-5 text-primary" />
                      <span className="font-medium">Kontakt</span>
                    </Link>

                    <div className="border-t pt-4 mt-4">
                      <div className="space-y-3">
                        <Button 
                          className="w-full justify-start" 
                          onClick={() => {
                            setIsOpen(false);
                            document.getElementById('search-section')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          data-testid="button-search-mobile"
                        >
                          <Plane className="h-4 w-4 mr-2" />
                          Szukaj Lotów
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                          onClick={() => {
                            setIsOpen(false);
                            window.location.href = '/plan-vacation';
                          }}
                          data-testid="button-ai-planner-mobile"
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          AI Planner
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Contact Info */}
                  <div className="pt-6 border-t text-sm text-muted-foreground">
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="h-4 w-4" />
                      <span>hello@flightai.com</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>+48 123 456 789</span>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}

const ListItem = ({ 
  className, 
  title, 
  children, 
  href,
  icon,
  ...props 
}: {
  className?: string;
  title: string;
  children: React.ReactNode;
  href: string;
  icon?: React.ReactNode;
}) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          to={href}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="flex items-center gap-2 text-sm font-medium leading-none">
            {icon}
            {title}
          </div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
};