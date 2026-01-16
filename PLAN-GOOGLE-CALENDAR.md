# Plan implementacji Google Calendar API w Koinonia

## Spis treści
1. [Podsumowanie analizy istniejącego kodu](#1-podsumowanie-analizy-istniejącego-kodu)
2. [Odpowiedzi na pytania](#2-odpowiedzi-na-pytania)
3. [Decyzje architektoniczne](#3-decyzje-architektoniczne)
4. [Schemat bazy danych](#4-schemat-bazy-danych)
5. [Plan implementacji - Fazy](#5-plan-implementacji---fazy)
6. [Lista plików](#6-lista-plików)
7. [Ryzyka i mitygacja](#7-ryzyka-i-mitygacja)
8. [Pytania do Ciebie](#8-pytania-do-ciebie)

---

## 1. Podsumowanie analizy istniejącego kodu

### Znalezione komponenty ICS/Calendar:

#### A) Endpointy API (do zastąpienia/zachowania jako fallback):
| Plik | Endpoint | Opis |
|------|----------|------|
| `app/api/calendar/personal/[token]/route.ts` | `GET /api/calendar/personal/[token]` | ICS feed osobisty - pokazuje eventy gdzie user jest przypisany |
| `app/api/calendar/public/[churchSubdomain]/[campusId]/route.ts` | `GET /api/calendar/public/[subdomain]/[campusId]` | ICS feed publiczny dla campusu |

#### B) UI Components:
| Plik | Opis |
|------|------|
| `app/dashboard/calendar-integration/page.tsx` | Strona główna integracji |
| `app/dashboard/calendar-integration/calendar-integration-page/CalendarIntegrationPageClient.tsx` | Główny komponent klienta |
| `app/dashboard/calendar-integration/calendar-integration-page/PersonalCalendarCard.tsx` | Karta osobistego kalendarza |
| `app/dashboard/calendar-integration/calendar-integration-page/PublicCalendarsCard.tsx` | Karta publicznych kalendarzy campusów |
| `app/dashboard/calendar-integration/calendar-integration-page/HelpCard.tsx` | Karta pomocy |
| `app/dashboard/calendar-integration/calendar-integration-page/useCalendarIntegrationState.ts` | Hook stanu |
| `app/dashboard/calendar-integration/actions.ts` | Server actions (tokeny) |

#### C) Tabele bazy danych:
| Tabela | Opis |
|--------|------|
| `calendar_tokens` | Tokeny do ICS feed (profile_id, church_id, token) |
| `events` | Wydarzenia (title, description, start_time, end_time, visibility, status, location_id) |
| `event_campuses` | Junction: wydarzenia ↔ campusy |
| `event_invitations` | Zaproszenia do ukrytych wydarzeń |
| `event_positions` | Pozycje wolontariackie |
| `event_assignments` | Przypisania wolontariuszy |
| `campuses` | Campusy kościoła |
| `profile_campuses` | Junction: profile ↔ campusy |
| `locations` | Lokalizacje |

#### D) Nawigacja:
- Calendar Integration dostępne z **UserDropdown** w sidebarze (menu użytkownika)
- Ścieżka: `/dashboard/calendar-integration`

---

## 2. Odpowiedzi na pytania

### Q1: Czy mamy już stronę ustawień użytkownika?
**TAK** - Profil użytkownika znajduje się w `/dashboard/profile` z zakładkami:
- `personal` - dane osobowe
- `password` - zmiana hasła
- `notifications` - preferencje powiadomień (tylko leaders+)
- `language` - język
- `appearance` - motyw
- `privacy` - prywatność
- `account` - konto i kościół

**Rekomendacja:** Nową integrację Google Calendar umieścimy w:
- **Opcja A:** Nowa zakładka `integrations` w profilu
- **Opcja B:** Rozbudowa istniejącej strony `/dashboard/calendar-integration`

**Wybieram Opcję B** - rozbudowa istniejącej strony, bo:
- Użytkownicy już znają tę lokalizację
- Logicznie łączy się z istniejącą funkcjonalnością ICS
- Nie wymaga zmian w nawigacji profilu

### Q2: Struktura tabeli events
```typescript
interface Event {
  id: string
  church_id: string          // Multi-tenant isolation
  title: string
  description: string | null
  event_type: 'service' | 'rehearsal' | 'meeting' | 'special_event' | 'other'
  location_id: string | null
  responsible_person_id: string | null
  start_time: string         // TIMESTAMPTZ
  end_time: string           // TIMESTAMPTZ
  is_all_day: boolean
  status: 'draft' | 'published' | 'cancelled'
  visibility: 'members' | 'volunteers' | 'leaders' | 'hidden'
  created_by: string
  created_at: string
  updated_at: string
  // Relations:
  campuses?: Campus[]        // via event_campuses
  location?: Location
}
```

### Q3: System kolejkowania zadań
**NIE** - Aplikacja nie używa żadnego systemu kolejkowania (Inngest, Trigger.dev, QStash).

**Rekomendacja:** Synchronizacja w kodzie aplikacji (Opcja B z zadania):
- Wywoływanie `googleCalendarSync.syncEvent()` po operacjach CRUD na eventach
- Prostsze do implementacji i debugowania
- Nie wymaga dodatkowej infrastruktury

### Q4: Projekt Google Cloud Console
**Nieznane** - potrzebuję potwierdzenia czy jest już skonfigurowany.

### Q5: Informacje w Google Calendar
**Rekomendacja mapowania:**
| Pole Koinonia | Pole Google Calendar |
|---------------|---------------------|
| `title` | `summary` |
| `description` | `description` |
| `location.name + location.address` | `location` |
| `start_time` | `start.dateTime` lub `start.date` (all-day) |
| `end_time` | `end.dateTime` lub `end.date` (all-day) |
| `event_type` | Prefix w tytule? np. "[Nabożeństwo]" lub kolor |
| Campus info | Część description |
| Rola usera (dla personal) | Część description |

---

## 3. Decyzje architektoniczne

### 3.1 Strategia synchronizacji
**Wybór: Synchronizacja w kodzie aplikacji**

Powody:
1. Brak istniejącej infrastruktury kolejkowania
2. Prostsze debugowanie
3. Natychmiastowa synchronizacja (UX)
4. Możliwość późniejszego dodania kolejki jeśli skala tego wymaga

Implementacja:
```typescript
// W server actions dla eventów
await createEvent(eventData);
await googleCalendarSyncService.onEventCreated(eventId);

await updateEvent(eventId, eventData);
await googleCalendarSyncService.onEventUpdated(eventId);

await deleteEvent(eventId);
await googleCalendarSyncService.onEventDeleted(eventId);
```

### 3.2 Strategia dla istniejącego ICS
**Wybór: Zachowaj jako fallback**

Powody:
1. Użytkownicy mogą już korzystać z ICS
2. ICS działa z każdą aplikacją kalendarza (nie tylko Google)
3. Minimalne ryzyko dla istniejących użytkowników

Plan:
- Zachowaj endpointy `/api/calendar/personal/` i `/api/calendar/public/`
- Na stronie integracji: 2 sekcje - "Google Calendar (rekomendowane)" i "Inne kalendarze (ICS)"
- ICS oznacz jako "legacy" w dokumentacji wewnętrznej

### 3.3 Struktura kalendarzy Google
```
User's Google Account
├── "[Church Name] - Wszystkie wydarzenia" (church calendar)
├── "[Church Name] - Campus A" (campus calendar)
├── "[Church Name] - Campus B" (campus calendar)
└── "[Church Name] - Moje służby" (personal calendar)
```

### 3.4 Szyfrowanie tokenów
**Wybór: AES-256-GCM** (jak w zadaniu)

Potrzebne zmienne środowiskowe:
```
ENCRYPTION_KEY=<64 hex chars>
GOOGLE_CLIENT_ID=<from GCP>
GOOGLE_CLIENT_SECRET=<from GCP>
```

---

## 4. Schemat bazy danych

### 4.1 Nowa migracja: `add_google_calendar_integration.sql`

```sql
-- =====================================================
-- Google Calendar Integration Tables
-- =====================================================

-- 1. Główna tabela połączeń
CREATE TABLE google_calendar_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,

  -- Google account info
  google_email TEXT NOT NULL,
  google_user_id TEXT,

  -- OAuth tokens (ENCRYPTED)
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,

  -- Created calendar IDs in user's Google account
  church_calendar_google_id TEXT,
  personal_calendar_google_id TEXT,

  -- Sync preferences
  sync_church_calendar BOOLEAN DEFAULT true,
  sync_personal_calendar BOOLEAN DEFAULT true,

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  last_sync_error TEXT,
  requires_reauth BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(profile_id)
);

-- 2. Synchronizacja kalendarzy campusów
CREATE TABLE google_calendar_campus_calendars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES google_calendar_connections(id) ON DELETE CASCADE,
  campus_id UUID NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,

  google_calendar_id TEXT NOT NULL,
  sync_enabled BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(connection_id, campus_id)
);

-- 3. Mapowanie eventów Koinonia → Google
CREATE TABLE google_calendar_synced_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source in Koinonia
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,

  -- Target in Google Calendar
  connection_id UUID NOT NULL REFERENCES google_calendar_connections(id) ON DELETE CASCADE,
  calendar_type TEXT NOT NULL CHECK (calendar_type IN ('church', 'campus', 'personal')),
  campus_id UUID REFERENCES campuses(id) ON DELETE CASCADE,

  -- Google Calendar identifiers
  google_calendar_id TEXT NOT NULL,
  google_event_id TEXT NOT NULL,

  -- Sync tracking
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  event_hash TEXT, -- For change detection

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(event_id, connection_id, calendar_type, COALESCE(campus_id, '00000000-0000-0000-0000-000000000000'::uuid))
);

-- =====================================================
-- Indexes
-- =====================================================
CREATE INDEX idx_gc_conn_profile ON google_calendar_connections(profile_id);
CREATE INDEX idx_gc_conn_church ON google_calendar_connections(church_id);
CREATE INDEX idx_gc_conn_active ON google_calendar_connections(is_active) WHERE is_active = true;

CREATE INDEX idx_gc_campus_connection ON google_calendar_campus_calendars(connection_id);
CREATE INDEX idx_gc_campus_campus ON google_calendar_campus_calendars(campus_id);

CREATE INDEX idx_gc_synced_event ON google_calendar_synced_events(event_id);
CREATE INDEX idx_gc_synced_connection ON google_calendar_synced_events(connection_id);
CREATE INDEX idx_gc_synced_google_event ON google_calendar_synced_events(google_event_id);

-- =====================================================
-- RLS Policies
-- =====================================================
ALTER TABLE google_calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_calendar_campus_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_calendar_synced_events ENABLE ROW LEVEL SECURITY;

-- Connections: users manage their own
CREATE POLICY "Users can view own gc connection"
  ON google_calendar_connections FOR SELECT
  USING (profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own gc connection"
  ON google_calendar_connections FOR INSERT
  WITH CHECK (profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own gc connection"
  ON google_calendar_connections FOR UPDATE
  USING (profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own gc connection"
  ON google_calendar_connections FOR DELETE
  USING (profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Campus calendars: via connection ownership
CREATE POLICY "Users can manage own campus calendars"
  ON google_calendar_campus_calendars FOR ALL
  USING (
    connection_id IN (
      SELECT id FROM google_calendar_connections
      WHERE profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- Synced events: via connection ownership
CREATE POLICY "Users can view own synced events"
  ON google_calendar_synced_events FOR ALL
  USING (
    connection_id IN (
      SELECT id FROM google_calendar_connections
      WHERE profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- =====================================================
-- Updated_at trigger
-- =====================================================
CREATE OR REPLACE FUNCTION update_gc_connection_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER gc_connection_updated_at
  BEFORE UPDATE ON google_calendar_connections
  FOR EACH ROW EXECUTE FUNCTION update_gc_connection_updated_at();
```

---

## 5. Plan implementacji - Fazy

### FAZA 1: Fundamenty (infrastruktura)
**Cel:** Podstawowa infrastruktura bez UI

| # | Zadanie | Pliki |
|---|---------|-------|
| 1.1 | Migracja bazy danych | `supabase/migrations/XXXXXX_add_google_calendar_integration.sql` |
| 1.2 | Regeneracja typów Supabase | `types/supabase.ts` |
| 1.3 | Moduł szyfrowania | `lib/encryption.ts` |
| 1.4 | Typy TypeScript | `lib/google-calendar/types.ts` |
| 1.5 | Google API client factory | `lib/google-calendar/client.ts` |
| 1.6 | Token manager (refresh logic) | `lib/google-calendar/token-manager.ts` |

**Weryfikacja:** Unit testy dla szyfrowania i token managera

---

### FAZA 2: OAuth Flow
**Cel:** Użytkownik może połączyć/odłączyć konto Google

| # | Zadanie | Pliki |
|---|---------|-------|
| 2.1 | Authorize endpoint | `app/api/integrations/google-calendar/authorize/route.ts` |
| 2.2 | Callback endpoint | `app/api/integrations/google-calendar/callback/route.ts` |
| 2.3 | Disconnect endpoint | `app/api/integrations/google-calendar/disconnect/route.ts` |
| 2.4 | Status endpoint | `app/api/integrations/google-calendar/status/route.ts` |
| 2.5 | React hook | `lib/hooks/useGoogleCalendarConnection.ts` |

**Weryfikacja:** Manual test - połącz, sprawdź w bazie, odłącz

---

### FAZA 3: Calendar Management
**Cel:** Tworzenie/usuwanie kalendarzy w Google

| # | Zadanie | Pliki |
|---|---------|-------|
| 3.1 | Calendar manager service | `lib/google-calendar/calendar-manager.ts` |
| 3.2 | Preferences endpoint | `app/api/integrations/google-calendar/preferences/route.ts` |
| 3.3 | Integracja z OAuth callback (auto-create) | Modyfikacja callback |

**Weryfikacja:** Po połączeniu - sprawdź czy kalendarze pojawiły się w Google

---

### FAZA 4: Event Sync Service
**Cel:** Synchronizacja eventów Koinonia → Google

| # | Zadanie | Pliki |
|---|---------|-------|
| 4.1 | Sync service core | `lib/google-calendar/sync-service.ts` |
| 4.2 | Event mapper (Koinonia → Google format) | `lib/google-calendar/event-mapper.ts` |
| 4.3 | Hash generator (change detection) | `lib/google-calendar/utils.ts` |
| 4.4 | Integracja z event actions | Modyfikacja `app/dashboard/events/actions/*.ts` |
| 4.5 | Integracja z assignment actions | Modyfikacja akcji przypisań |

**Weryfikacja:** CRUD na eventach → sprawdź Google Calendar

---

### FAZA 5: UI
**Cel:** Pełny interfejs użytkownika

| # | Zadanie | Pliki |
|---|---------|-------|
| 5.1 | Google Calendar Card component | `app/dashboard/calendar-integration/components/GoogleCalendarCard.tsx` |
| 5.2 | Calendar Selector component | `app/dashboard/calendar-integration/components/CalendarSelector.tsx` |
| 5.3 | Connection Status component | `app/dashboard/calendar-integration/components/ConnectionStatus.tsx` |
| 5.4 | Modyfikacja głównej strony | `app/dashboard/calendar-integration/calendar-integration-page/CalendarIntegrationPageClient.tsx` |
| 5.5 | Tłumaczenia PL/EN | `messages/en/calendarIntegration.json`, `messages/pl/calendarIntegration.json` |
| 5.6 | Hook stanu rozszerzony | `app/dashboard/calendar-integration/calendar-integration-page/useCalendarIntegrationState.ts` |

**Weryfikacja:** E2E test całego flow

---

### FAZA 6: Error Handling & Edge Cases
**Cel:** Obsługa błędów i przypadków brzegowych

| # | Zadanie | Pliki |
|---|---------|-------|
| 6.1 | Token refresh middleware | Modyfikacja `token-manager.ts` |
| 6.2 | Reauth flow (gdy refresh token invalid) | UI + endpoint |
| 6.3 | Rate limiting handler | `lib/google-calendar/rate-limiter.ts` |
| 6.4 | Graceful degradation (Google down) | Error boundaries |
| 6.5 | Sync retry logic | `lib/google-calendar/sync-service.ts` |

---

### FAZA 7: Testing & Cleanup
**Cel:** Testy i dokumentacja

| # | Zadanie | Pliki |
|---|---------|-------|
| 7.1 | Unit tests | `__tests__/google-calendar/*.test.ts` |
| 7.2 | Integration tests | `__tests__/google-calendar/integration/*.test.ts` |
| 7.3 | Dokumentacja API | `docs/google-calendar-integration.md` |
| 7.4 | Oznacz ICS jako legacy w UI | Modyfikacja PersonalCalendarCard, PublicCalendarsCard |

---

## 6. Lista plików

### Nowe pliki do utworzenia:

```
lib/
├── encryption.ts                                    # AES-256-GCM encryption
├── google-calendar/
│   ├── types.ts                                     # TypeScript types
│   ├── client.ts                                    # Google API client factory
│   ├── token-manager.ts                             # Token refresh logic
│   ├── calendar-manager.ts                          # Create/delete calendars
│   ├── sync-service.ts                              # Event sync logic
│   ├── event-mapper.ts                              # Koinonia → Google format
│   ├── rate-limiter.ts                              # Rate limit handling
│   └── utils.ts                                     # Hash, helpers
├── hooks/
│   └── useGoogleCalendarConnection.ts               # React hook

app/api/integrations/google-calendar/
├── authorize/route.ts                               # Start OAuth
├── callback/route.ts                                # OAuth callback
├── disconnect/route.ts                              # Disconnect
├── status/route.ts                                  # Get status
├── preferences/route.ts                             # Save preferences
└── sync/route.ts                                    # Manual sync trigger

app/dashboard/calendar-integration/components/
├── GoogleCalendarCard.tsx                           # Main card
├── CalendarSelector.tsx                             # Calendar checkboxes
└── ConnectionStatus.tsx                             # Status display

supabase/migrations/
└── XXXXXX_add_google_calendar_integration.sql       # New tables

messages/
├── en/calendarIntegration.json                      # English translations
└── pl/calendarIntegration.json                      # Polish translations

__tests__/google-calendar/
├── encryption.test.ts
├── token-manager.test.ts
├── sync-service.test.ts
└── integration/
    └── oauth-flow.test.ts
```

### Pliki do modyfikacji:

```
app/dashboard/calendar-integration/
├── calendar-integration-page/
│   ├── CalendarIntegrationPageClient.tsx            # Dodaj sekcję Google
│   ├── useCalendarIntegrationState.ts               # Rozszerz o Google state
│   ├── PersonalCalendarCard.tsx                     # Oznacz jako "Inne kalendarze"
│   └── PublicCalendarsCard.tsx                      # Oznacz jako "Inne kalendarze"

app/dashboard/events/actions/
├── events.ts                                        # Dodaj sync calls
└── assignments.ts                                   # Dodaj sync calls (jeśli istnieje)

.env.local                                           # Dodaj nowe zmienne
.env.example                                         # Dokumentacja zmiennych
```

### Pliki do usunięcia:
**Brak** - zachowujemy ICS jako fallback

---

## 7. Ryzyka i mitygacja

| Ryzyko | Prawdopodobieństwo | Wpływ | Mitygacja |
|--------|-------------------|-------|-----------|
| **Google API rate limits** | Średnie | Średni | Exponential backoff, batch operations |
| **Token expiry race condition** | Niskie | Wysoki | Mutex/lock na refresh, retry logic |
| **User deletes calendar in Google** | Średnie | Średni | Graceful handling, recreate option |
| **Encryption key rotation** | Niskie | Wysoki | Dokumentacja procedury, backup |
| **Duża liczba eventów do sync** | Niskie | Średni | Pagination, async processing |
| **OAuth popup blocked** | Średnie | Niski | Instrukcje dla użytkownika |
| **Google API downtime** | Niskie | Średni | Graceful degradation, queue for later |
| **Migracja psuje dane** | Niskie | Wysoki | Backup przed migracją, test na staging |

### Plan awaryjny:
1. Jeśli Google Calendar API nie działa → użytkownik może wrócić do ICS
2. Jeśli synchronizacja się "zacina" → endpoint do manual resync
3. Jeśli token invalid → UI pokazuje "Połącz ponownie"

---

## 8. Pytania do Ciebie

### Krytyczne (blokujące implementację):

1. **Google Cloud Console** - Czy masz już skonfigurowany projekt GCP z:
   - OAuth 2.0 Client ID (typ: Web application)
   - Włączonym Google Calendar API
   - Ustawionym redirect URI: `https://[your-domain]/api/integrations/google-calendar/callback`

   Jeśli nie, mogę dać instrukcje krok po kroku.

2. **Środowisko produkcyjne** - Jaka jest domena produkcyjna? Potrzebuję do:
   - Konfiguracji redirect URI w GCP
   - Generowania prawidłowych URL w callbacku

3. **ENCRYPTION_KEY** - Czy mam wygenerować klucz i dodać do `.env.example`? (NIE commitować prawdziwego klucza!)

### Decyzje projektowe:

4. **Nazwy kalendarzy** - Zaproponowałem format `"[Nazwa kościoła] - Typ"`. Czy OK, czy wolisz inny format?

5. **Kolor kalendarzy** - Czy chcesz żeby kalendarze w Google miały kolory campusów z Koinonia? Google ma ograniczoną paletę (24 kolory).

6. **Event description** - Co dokładnie powinno być w opisie eventu w Google Calendar?
   - Opis z Koinonia ✓
   - Lokalizacja (adres) ✓
   - Link do eventu w Koinonia?
   - Lista campusów?
   - Dla kalendarza osobistego: rola usera?

7. **Scope kalendarzy** - Czy zaproponowany podział jest OK?
   - Kalendarz kościoła = wydarzenia z `visibility='members'` (publiczne)
   - Kalendarz campusu = wydarzenia danego campusu (niezależnie od visibility?)
   - Kalendarz osobisty = tylko gdzie user jest przypisany

### Nice to have:

8. **Automatyczne włączanie kalendarzy campusów** - Gdy user jest przypisany do campusów (via `profile_campuses`), czy automatycznie włączyć sync tych campusów? Czy zostawić wszystko wyłączone na start?

9. **Powiadomienia w Google** - Czy eventy powinny mieć domyślne przypomnienie w Google (np. 30 min przed)?

---

## Następne kroki

Po Twojej akceptacji planu i odpowiedziach na pytania:

1. ✅ Zatwierdzenie planu
2. ⏳ Utworzenie migracji bazy danych
3. ⏳ Implementacja Fazy 1 (Fundamenty)
4. ⏳ Test na lokalnym środowisku
5. ⏳ Kontynuacja kolejnych faz...

**Szacowany czas implementacji:** 8-12h pracy (zależnie od odpowiedzi na pytania i ewentualnych komplikacji)

---

*Plan utworzony: 2026-01-16*
*Status: Oczekuje na akceptację*
