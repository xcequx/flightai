# FlightAI Internationalization (i18n) Guide

## 📋 Table of Contents
- [Current System Overview](#current-system-overview)
- [System Architecture Analysis](#system-architecture-analysis)
- [Adding New Languages - Step by Step Guide](#adding-new-languages---step-by-step-guide)
- [Language Templates](#language-templates)
- [Locale-Aware Formatting](#locale-aware-formatting)
- [Best Practices](#best-practices)
- [Testing Multi-Language Support](#testing-multi-language-support)
- [Production Readiness Checklist](#production-readiness-checklist)
- [Troubleshooting](#troubleshooting)

## 🌍 Current System Overview

FlightAI currently supports **Polish (pl)** and **English (en)** with a robust internationalization system built on **react-i18next**. The system is production-ready and designed to easily accommodate additional languages.

### Supported Languages
- **🇵🇱 Polish (pl)** - Primary language, PLN currency
- **🇺🇸 English (en)** - Secondary language, USD currency
- **🇪🇸 Spanish (es)** - Template ready, EUR currency (prepared)

### Key Features
- ✅ Automatic language detection based on browser settings
- ✅ Manual language switching via UI
- ✅ Persistent language preference in localStorage
- ✅ Locale-aware formatting (currency, dates, numbers)
- ✅ Complete translation coverage across all components
- ✅ Dynamic currency adaptation based on language

## 🏗️ System Architecture Analysis

### Core Configuration (`src/i18n/index.ts`)
```typescript
// Current configuration supports easy expansion
const resources = {
  pl: { translation: pl },
  en: { translation: en }
  // Ready for: es, de, fr, etc.
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'pl',
    supportedLngs: ['pl', 'en'], // Easily expandable
    // ... other config
  });
```

### Translation Files Structure
```
src/locales/
├── pl.json      # Polish translations
├── en.json      # English translations
└── es.json      # Spanish template (ready)
```

### Formatting System (`src/utils/formatters.ts`)
The system includes sophisticated locale-aware formatting:
- **Currency**: PLN for Polish, USD for English, EUR for Spanish
- **Numbers**: Proper decimal separators and thousands separators
- **Dates**: Localized date formats
- **Relative Time**: "2 days ago" in appropriate language
- **Duration**: Flight duration formatting per locale

### Component Integration
All components use the `useTranslation` hook consistently:
```typescript
const { t, i18n } = useTranslation();
// Usage: t('nav.searchFlights')
```

## 🚀 Adding New Languages - Step by Step Guide

### Step 1: Create Translation File
```bash
# Copy template and rename
cp src/locales/es.json src/locales/[language_code].json
```

**Example for German:**
```bash
cp src/locales/es.json src/locales/de.json
```

### Step 2: Update i18n Configuration
Edit `src/i18n/index.ts`:

```typescript
// Import new language
import de from '../locales/de.json';

// Add to resources
const resources = {
  pl: { translation: pl },
  en: { translation: en },
  de: { translation: de }, // Add new language
};

// Add to supported languages
supportedLngs: ['pl', 'en', 'de'], // Add 'de'
```

### Step 3: Update Formatters (Optional)
Edit `src/utils/formatters.ts` if you need specific currency/formatting:

```typescript
export function getCurrentCurrency(): string {
  const language = i18n.resolvedLanguage || i18n.language || 'pl';
  switch(language) {
    case 'pl': return 'PLN';
    case 'en': return 'USD';
    case 'es': return 'EUR';
    case 'de': return 'EUR'; // Add new currency
    case 'fr': return 'EUR';
    default: return 'EUR';
  }
}

export function getCurrentLocale(): string {
  const language = i18n.resolvedLanguage || i18n.language || 'pl';
  switch(language) {
    case 'pl': return 'pl-PL';
    case 'en': return 'en-US';
    case 'es': return 'es-ES';
    case 'de': return 'de-DE'; // Add new locale
    case 'fr': return 'fr-FR';
    default: return 'en-US';
  }
}
```

### Step 4: Update Navigation Component
Edit `src/components/Navigation.tsx` to add language switcher option:

```typescript
// Add new language option in dropdown
<DropdownMenuItem 
  onClick={() => changeLanguage('de')}
  className={cn("cursor-pointer", currentLanguage === 'de' && "bg-accent")}
  data-testid="button-language-de"
>
  <span className="mr-3">🇩🇪</span>
  Deutsch
</DropdownMenuItem>
```

### Step 5: Translate Content
Translate all keys in your new language file. Use the Spanish template as reference for structure.

### Step 6: Test Implementation
1. Start the application: `bun run dev`
2. Test language switching in the navigation
3. Verify currency formatting changes
4. Check all pages for proper translations

## 📝 Language Templates

### Available Templates
- **Spanish (es.json)** - Complete template ready for use
- **German (de.json)** - Copy from Spanish template
- **French (fr.json)** - Copy from Spanish template

### Template Structure
Each language file follows this structure:
```json
{
  "nav": {
    "brand": "FlightAI",
    "searchFlights": "...",
    // ... navigation items
  },
  "hero": {
    "title": "...",
    "subtitle": "...",
    // ... hero section
  },
  "search": {
    // ... search functionality
  },
  "results": {
    // ... results page
  },
  "vacation": {
    // ... vacation planner
  },
  "common": {
    // ... common terms
  },
  "toast": {
    // ... notifications
  }
}
```

### Key Translation Guidelines
1. **Keep placeholders**: Maintain `{{variable}}` syntax
2. **Preserve HTML**: Keep HTML tags intact
3. **Cultural adaptation**: Adapt examples and references to local context
4. **Currency symbols**: Update in `currency` fields
5. **Flag emojis**: Use appropriate country flags in navigation

## 💰 Locale-Aware Formatting

### Currency Formatting
The system automatically adapts currency based on language:
- **Polish**: 2,500 zł
- **English**: $2,500.00
- **Spanish**: €2.500,00
- **German**: 2.500,00 €

### Date Formatting
- **Polish**: 24 grudnia 2023
- **English**: December 24, 2023
- **Spanish**: 24 de diciembre de 2023
- **German**: 24. Dezember 2023

### Number Formatting
Different locales use different decimal separators:
- **English**: 1,234.56
- **German**: 1.234,56
- **Spanish**: 1.234,56

## 🎯 Best Practices

### Translation Keys
- Use nested structure: `nav.searchFlights`
- Keep keys descriptive: `search.errorOriginRequired`
- Group related content: All navigation under `nav`

### Content Guidelines
- **Consistent tone**: Maintain professional, helpful tone
- **Context awareness**: Consider cultural context
- **Length considerations**: Account for text expansion/contraction
- **Technical terms**: Decide whether to translate or keep in English

### Component Usage
```typescript
// ✅ Good - using translation key
const { t } = useTranslation();
<Button>{t('search.searchButton')}</Button>

// ❌ Bad - hardcoded text
<Button>Search Flights</Button>
```

## 🧪 Testing Multi-Language Support

### Manual Testing Checklist
- [ ] Language switching works from navigation
- [ ] All pages display translated content
- [ ] Currency symbols update correctly
- [ ] Date formats change appropriately
- [ ] Number formatting follows locale rules
- [ ] Language preference persists after refresh
- [ ] Fallback to primary language works

### Test Scenarios
1. **Fresh browser**: Test language detection
2. **Language switching**: Test all language combinations
3. **Page refresh**: Verify persistence
4. **Missing translations**: Verify fallback behavior

### Browser Testing
Test on different browsers to ensure:
- Language detection works
- localStorage persistence functions
- Formatting displays correctly

## ✅ Production Readiness Checklist

### System Requirements
- [x] All components use `useTranslation` hook
- [x] Translation keys are consistently structured
- [x] Locale-aware formatting implemented
- [x] Language switching UI in place
- [x] Persistent language preference
- [x] Proper fallback language configured

### Content Requirements
- [x] Polish translations complete
- [x] English translations complete
- [x] Spanish template ready
- [ ] Additional languages as needed

### Performance Considerations
- [x] Languages loaded on-demand
- [x] No unnecessary re-renders on language change
- [x] Formatting functions optimized

### SEO Considerations
- [x] `lang` attribute updated on language change
- [x] Consistent URL structure per language
- [x] Proper meta tags for each language

## 🛠️ Troubleshooting

### Common Issues

#### Translation Not Showing
```typescript
// Check if key exists in translation file
console.log(t('your.key', { defaultValue: 'Fallback text' }));
```

#### Currency Not Updating
```typescript
// Verify language is properly detected
console.log(i18n.resolvedLanguage);
console.log(getCurrentCurrency());
```

#### Language Not Persisting
Check localStorage for language preference:
```javascript
localStorage.getItem('flightai-language');
```

### Debug Mode
Enable debug mode in development:
```typescript
// In src/i18n/index.ts
debug: process.env.NODE_ENV === 'development',
```

## 🌟 Future Enhancements

### Planned Features
- **RTL Support**: For Arabic, Hebrew languages
- **Pluralization**: Advanced plural rules for complex languages
- **Context-aware translations**: Different translations based on context
- **Professional translations**: Integration with translation services

### Recommended Languages to Add Next
1. **German (de)** - Large European market
2. **French (fr)** - International market
3. **Italian (it)** - European market
4. **Portuguese (pt)** - Brazilian market
5. **Japanese (ja)** - Asian market

---

## 📞 Support

For questions about internationalization:
- Check this documentation first
- Review the Spanish template file
- Test with existing Polish/English implementation
- Verify formatting functions in `src/utils/formatters.ts`

The FlightAI i18n system is production-ready and designed for easy expansion. Adding new languages should take 30-60 minutes per language once translations are available.