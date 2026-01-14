-- Seed Legal Documents v1
-- Initial legal documents for Koinonia in English and Polish
-- Company details are placeholders to be filled in before production launch

-- ============================================================================
-- TERMS OF SERVICE - ENGLISH
-- ============================================================================

INSERT INTO legal_documents (
  document_type, version, language, title, content, summary, effective_date, is_current
) VALUES (
  'terms_of_service', 1, 'en',
  'Terms of Service',
  '# Terms of Service

**Effective Date:** January 13, 2026
**Last Updated:** January 13, 2026

## 1. Introduction

Welcome to Koinonia ("Service"), a church management platform operated by **{{COMPANY_NAME}}** ("Company", "we", "us", or "our"), a company registered in Poland.

By accessing or using our Service, you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our Service.

## 2. Service Description

Koinonia is a Software-as-a-Service (SaaS) platform designed to help churches and religious organizations manage:

- Member profiles and directory
- Event scheduling and volunteer coordination
- Ministry team management
- Communication and notifications
- Forms and surveys
- Worship planning (songs and setlists)

## 3. Eligibility and Account Registration

### 3.1 Age Requirements
You must be at least 16 years old to create an account. If you are under 18, you must have parental consent.

### 3.2 Account Creation
When creating an account, you agree to:
- Provide accurate, current, and complete information
- Maintain and update your information as needed
- Keep your password secure and confidential
- Notify us immediately of any unauthorized account access
- Accept responsibility for all activities under your account

### 3.3 Church Organization Accounts
If you create a church organization on Koinonia, you represent that:
- You are authorized to act on behalf of the church
- The church consents to the processing of its members'' data as described in our Privacy Policy

## 4. Acceptable Use

### 4.1 You Agree To:
- Use the Service only for lawful purposes
- Respect the privacy and data of other users
- Comply with all applicable laws and regulations
- Use the Service only for legitimate church and religious organization activities

### 4.2 You Agree Not To:
- Share your account credentials with others
- Attempt to gain unauthorized access to the Service or its systems
- Upload malicious code, viruses, or harmful content
- Use the Service to harass, discriminate, or harm others
- Collect personal data of other users without authorization
- Use the Service for commercial purposes unrelated to church activities
- Violate any applicable data protection laws

## 5. User Content

### 5.1 Your Content
You retain ownership of content you upload to the Service. By uploading content, you grant us a limited license to store, display, and process that content as necessary to provide the Service.

### 5.2 Prohibited Content
You may not upload content that:
- Infringes intellectual property rights
- Contains personal data of individuals without their consent
- Is defamatory, hateful, or discriminatory
- Violates any applicable laws

## 6. Intellectual Property

### 6.1 Our Rights
The Service, including its software, design, logos, and documentation, is owned by or licensed to the Company. You may not copy, modify, distribute, or create derivative works without our written permission.

### 6.2 Feedback
If you provide feedback or suggestions about the Service, we may use them without obligation to you.

## 7. Service Availability

### 7.1 No Guarantee
We strive to maintain high availability but do not guarantee uninterrupted access. The Service may be temporarily unavailable due to:
- Scheduled maintenance
- Technical issues
- Circumstances beyond our control

### 7.2 Modifications
We may modify, suspend, or discontinue any aspect of the Service at any time with reasonable notice.

## 8. Fees and Payment

### 8.1 Free and Paid Plans
The Service may offer free and paid subscription plans. Current pricing is available on our website.

### 8.2 Changes to Pricing
We may change pricing with 30 days'' notice. Continued use after the notice period constitutes acceptance.

## 9. Termination

### 9.1 By You
You may terminate your account at any time through the Service settings or by contacting us.

### 9.2 By Us
We may suspend or terminate your account if you:
- Violate these Terms
- Engage in fraudulent or illegal activity
- Fail to pay applicable fees

### 9.3 Effect of Termination
Upon termination:
- Your access to the Service will cease
- Your data may be deleted after a retention period (see Privacy Policy)
- Provisions that should survive termination will remain in effect

## 10. Limitation of Liability

### 10.1 Disclaimer
THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.

### 10.2 Limitation
TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR:
- Indirect, incidental, special, or consequential damages
- Loss of data, profits, or business opportunities
- Damages exceeding the fees paid by you in the 12 months preceding the claim

### 10.3 Exceptions
Some jurisdictions do not allow limitation of certain damages. In such cases, limitations apply to the extent permitted.

## 11. Indemnification

You agree to indemnify and hold harmless the Company from any claims, damages, or expenses arising from:
- Your use of the Service
- Your violation of these Terms
- Your violation of any third-party rights

## 12. Dispute Resolution

### 12.1 Governing Law
These Terms are governed by the laws of Poland.

### 12.2 Jurisdiction
Any disputes shall be resolved by the courts of Poland, without prejudice to consumer protection rights under EU law.

## 13. Changes to Terms

We may update these Terms from time to time. We will notify you of material changes via:
- Email to your registered address
- Notice within the Service

Continued use after changes constitutes acceptance.

## 14. Contact Information

For questions about these Terms, please contact us:

**{{COMPANY_NAME}}**
{{COMPANY_ADDRESS}}
Email: {{CONTACT_EMAIL}}

## 15. Severability

If any provision of these Terms is found unenforceable, the remaining provisions will continue in effect.

---

*These Terms of Service were last updated on January 13, 2026.*',
  'Terms governing use of the Koinonia church management platform',
  '2026-01-13',
  true
);

-- ============================================================================
-- TERMS OF SERVICE - POLISH
-- ============================================================================

INSERT INTO legal_documents (
  document_type, version, language, title, content, summary, effective_date, is_current
) VALUES (
  'terms_of_service', 1, 'pl',
  'Regulamin Usługi',
  '# Regulamin Usługi

**Data wejścia w życie:** 13 stycznia 2026
**Ostatnia aktualizacja:** 13 stycznia 2026

## 1. Wprowadzenie

Witamy w Koinonia ("Usługa"), platformie do zarządzania kościołem obsługiwanej przez **{{COMPANY_NAME}}** ("Firma", "my", "nas" lub "nasz"), spółkę zarejestrowaną w Polsce.

Korzystając z naszej Usługi, zgadzasz się na warunki niniejszego Regulaminu ("Regulamin"). Jeśli nie zgadzasz się z Regulaminem, prosimy o niekorzystanie z Usługi.

## 2. Opis Usługi

Koinonia to platforma typu Software-as-a-Service (SaaS) zaprojektowana, aby pomóc kościołom i organizacjom religijnym w zarządzaniu:

- Profilami członków i katalogiem
- Harmonogramem wydarzeń i koordynacją wolontariuszy
- Zarządzaniem zespołami służby
- Komunikacją i powiadomieniami
- Formularzami i ankietami
- Planowaniem nabożeństw (pieśni i playlisty)

## 3. Uprawnienia i Rejestracja Konta

### 3.1 Wymagania wiekowe
Aby utworzyć konto, musisz mieć co najmniej 16 lat. Jeśli masz mniej niż 18 lat, wymagana jest zgoda rodzica.

### 3.2 Tworzenie konta
Tworząc konto, zgadzasz się:
- Podać dokładne, aktualne i kompletne informacje
- Utrzymywać i aktualizować swoje informacje w razie potrzeby
- Chronić swoje hasło i zachować je w tajemnicy
- Natychmiast powiadomić nas o nieautoryzowanym dostępie do konta
- Przyjąć odpowiedzialność za wszystkie działania na swoim koncie

### 3.3 Konta organizacji kościelnych
Jeśli tworzysz organizację kościelną w Koinonia, oświadczasz, że:
- Jesteś upoważniony do działania w imieniu kościoła
- Kościół wyraża zgodę na przetwarzanie danych swoich członków zgodnie z naszą Polityką Prywatności

## 4. Dopuszczalne Użytkowanie

### 4.1 Zgadzasz się:
- Używać Usługi wyłącznie w celach zgodnych z prawem
- Szanować prywatność i dane innych użytkowników
- Przestrzegać wszystkich obowiązujących przepisów prawa
- Używać Usługi wyłącznie do działalności kościelnej i organizacji religijnych

### 4.2 Nie wolno ci:
- Udostępniać swoich danych logowania innym osobom
- Próbować uzyskać nieautoryzowany dostęp do Usługi lub jej systemów
- Przesyłać złośliwego kodu, wirusów lub szkodliwych treści
- Używać Usługi do nękania, dyskryminacji lub krzywdzenia innych
- Zbierać danych osobowych innych użytkowników bez upoważnienia
- Używać Usługi do celów komercyjnych niezwiązanych z działalnością kościelną
- Naruszać obowiązujących przepisów o ochronie danych

## 5. Treści Użytkownika

### 5.1 Twoje treści
Zachowujesz własność treści przesyłanych do Usługi. Przesyłając treści, udzielasz nam ograniczonej licencji na ich przechowywanie, wyświetlanie i przetwarzanie w zakresie niezbędnym do świadczenia Usługi.

### 5.2 Zabronione treści
Nie wolno przesyłać treści, które:
- Naruszają prawa własności intelektualnej
- Zawierają dane osobowe osób bez ich zgody
- Są zniesławiające, nienawistne lub dyskryminujące
- Naruszają obowiązujące przepisy prawa

## 6. Własność Intelektualna

### 6.1 Nasze prawa
Usługa, w tym oprogramowanie, projekt, logo i dokumentacja, jest własnością Firmy lub jest przez nią licencjonowana. Nie wolno kopiować, modyfikować, rozpowszechniać ani tworzyć dzieł pochodnych bez naszej pisemnej zgody.

### 6.2 Opinie
Jeśli przekażesz opinie lub sugestie dotyczące Usługi, możemy je wykorzystać bez zobowiązań wobec ciebie.

## 7. Dostępność Usługi

### 7.1 Brak gwarancji
Dążymy do utrzymania wysokiej dostępności, ale nie gwarantujemy nieprzerwanego dostępu. Usługa może być tymczasowo niedostępna z powodu:
- Planowanych prac konserwacyjnych
- Problemów technicznych
- Okoliczności pozostających poza naszą kontrolą

### 7.2 Modyfikacje
Możemy modyfikować, zawieszać lub zaprzestać świadczenia dowolnego aspektu Usługi w dowolnym momencie z odpowiednim wyprzedzeniem.

## 8. Opłaty i Płatności

### 8.1 Plany bezpłatne i płatne
Usługa może oferować bezpłatne i płatne plany subskrypcji. Aktualne ceny są dostępne na naszej stronie internetowej.

### 8.2 Zmiany cen
Możemy zmienić ceny z 30-dniowym wyprzedzeniem. Dalsze korzystanie po okresie wypowiedzenia oznacza akceptację.

## 9. Rozwiązanie Umowy

### 9.1 Przez ciebie
Możesz rozwiązać swoje konto w dowolnym momencie poprzez ustawienia Usługi lub kontaktując się z nami.

### 9.2 Przez nas
Możemy zawiesić lub rozwiązać twoje konto, jeśli:
- Naruszysz niniejszy Regulamin
- Podejmiesz oszukańczą lub nielegalną działalność
- Nie zapłacisz należnych opłat

### 9.3 Skutki rozwiązania
Po rozwiązaniu:
- Twój dostęp do Usługi zostanie zakończony
- Twoje dane mogą zostać usunięte po okresie przechowywania (patrz Polityka Prywatności)
- Postanowienia, które powinny przetrwać rozwiązanie, pozostają w mocy

## 10. Ograniczenie Odpowiedzialności

### 10.1 Wyłączenie odpowiedzialności
USŁUGA JEST ŚWIADCZONA "W STANIE, W JAKIM JEST" BEZ JAKICHKOLWIEK GWARANCJI, WYRAŹNYCH LUB DOROZUMIANYCH.

### 10.2 Ograniczenie
W MAKSYMALNYM ZAKRESIE DOZWOLONYM PRZEZ PRAWO, NIE PONOSIMY ODPOWIEDZIALNOŚCI ZA:
- Szkody pośrednie, przypadkowe, specjalne lub wynikowe
- Utratę danych, zysków lub możliwości biznesowych
- Szkody przekraczające opłaty zapłacone przez ciebie w ciągu 12 miesięcy poprzedzających roszczenie

### 10.3 Wyjątki
Niektóre jurysdykcje nie zezwalają na ograniczenie niektórych szkód. W takich przypadkach ograniczenia mają zastosowanie w dozwolonym zakresie.

## 11. Zwolnienie z Odpowiedzialności

Zgadzasz się zwolnić i chronić Firmę przed wszelkimi roszczeniami, szkodami lub wydatkami wynikającymi z:
- Twojego korzystania z Usługi
- Twojego naruszenia niniejszego Regulaminu
- Twojego naruszenia praw osób trzecich

## 12. Rozstrzyganie Sporów

### 12.1 Prawo właściwe
Niniejszy Regulamin podlega prawu polskiemu.

### 12.2 Jurysdykcja
Wszelkie spory będą rozstrzygane przez sądy polskie, bez uszczerbku dla praw konsumentów wynikających z prawa UE.

## 13. Zmiany Regulaminu

Możemy od czasu do czasu aktualizować niniejszy Regulamin. Powiadomimy cię o istotnych zmianach za pośrednictwem:
- E-maila na zarejestrowany adres
- Powiadomienia w Usłudze

Dalsze korzystanie po zmianach oznacza akceptację.

## 14. Dane Kontaktowe

W przypadku pytań dotyczących niniejszego Regulaminu, prosimy o kontakt:

**{{COMPANY_NAME}}**
{{COMPANY_ADDRESS}}
Email: {{CONTACT_EMAIL}}

## 15. Rozdzielność

Jeśli jakiekolwiek postanowienie niniejszego Regulaminu zostanie uznane za niewykonalne, pozostałe postanowienia pozostają w mocy.

---

*Niniejszy Regulamin został ostatnio zaktualizowany 13 stycznia 2026 r.*',
  'Regulamin korzystania z platformy zarządzania kościołem Koinonia',
  '2026-01-13',
  true
);

-- ============================================================================
-- PRIVACY POLICY - ENGLISH
-- ============================================================================

INSERT INTO legal_documents (
  document_type, version, language, title, content, summary, effective_date, is_current
) VALUES (
  'privacy_policy', 1, 'en',
  'Privacy Policy',
  '# Privacy Policy

**Effective Date:** January 13, 2026
**Last Updated:** January 13, 2026

## 1. Introduction

**{{COMPANY_NAME}}** ("Company", "we", "us", or "our") operates the Koinonia church management platform ("Service"). This Privacy Policy explains how we collect, use, disclose, and safeguard your personal data in accordance with the General Data Protection Regulation (GDPR) and Polish data protection laws.

## 2. Data Controller Information

**Data Controller:**
{{COMPANY_NAME}}
{{COMPANY_ADDRESS}}
NIP: {{COMPANY_NIP}}

**Contact for Data Protection Inquiries:**
Email: {{CONTACT_EMAIL}}

## 3. Personal Data We Collect

### 3.1 Account Data
When you create an account, we collect:
- First name and last name
- Email address
- Password (stored securely hashed)

### 3.2 Profile Data
You may optionally provide:
- Phone number
- Date of birth
- Gender (male/female)
- Profile photo (avatar)
- Biography
- Emergency contact information
- Skills
- Baptism status and date

### 3.3 Church Membership Data
When you join a church organization:
- Church affiliation
- Campus assignment
- Ministry memberships and roles
- Event assignments and participation history
- Volunteer availability and unavailability periods

### 3.4 User-Generated Content
- Form submissions and survey responses
- Task comments and notes
- Custom field values (as defined by your church)
- Song arrangements and setlists

### 3.5 Technical Data
We automatically collect:
- IP address
- Browser type and version (user agent)
- Device information
- Session identifiers (for form analytics)
- Push notification tokens (if enabled)
- Calendar integration tokens (if enabled)

### 3.6 Communication Data
- Notification history
- Email interaction tokens

## 4. Legal Bases for Processing

We process your personal data based on the following legal grounds under Article 6 of GDPR:

| Purpose | Legal Basis | GDPR Article |
|---------|-------------|--------------|
| Account creation and authentication | Contract performance | Art. 6(1)(b) |
| Providing the Service | Contract performance | Art. 6(1)(b) |
| Sending service notifications | Legitimate interest | Art. 6(1)(f) |
| Marketing communications | Consent | Art. 6(1)(a) |
| Analytics and service improvement | Legitimate interest | Art. 6(1)(f) |
| Compliance with legal obligations | Legal obligation | Art. 6(1)(c) |

### 4.1 Special Category Data
Certain data we process may be considered special category data under Article 9 GDPR:
- Religious affiliation (church membership, baptism status)

We process this data based on:
- Your explicit consent (Art. 9(2)(a))
- Processing by a religious organization for its members (Art. 9(2)(d))

## 5. How We Use Your Data

We use your personal data to:
- Create and manage your account
- Provide access to your church''s Koinonia platform
- Enable event scheduling and volunteer coordination
- Send notifications about events, assignments, and updates
- Process form submissions
- Enable worship planning features
- Provide customer support
- Analyze and improve our Service
- Comply with legal obligations

## 6. Data Sharing

### 6.1 Within Your Church Organization
When you join a church on Koinonia, church administrators can access:
- Your name and email
- Your phone number (if provided)
- Your ministry assignments and roles
- Your event participation and volunteer history
- Your form submissions (for that church)
- Custom field values

**Important:** Your church is the data controller for this shared data. See Section 11 for more information.

### 6.2 Sub-Processors
We use the following third-party service providers to operate our Service:

| Sub-Processor | Purpose | Location | GDPR Compliance |
|---------------|---------|----------|-----------------|
| Supabase Inc. | Database, Authentication, File Storage | EU (Frankfurt, Germany) | Standard Contractual Clauses |
| Resend Inc. | Transactional Email Delivery | EU | Data Processing Agreement |
| Google Firebase (FCM) | Push Notifications | EU | Standard Contractual Clauses |
| Upstash Inc. | Rate Limiting | EU | Data Processing Agreement |
| Vercel Inc. | Web Hosting | EU (Frankfurt, Germany) | Data Processing Agreement |

### 6.3 Legal Requirements
We may disclose your data when required by:
- Court orders or legal process
- Law enforcement requests
- Protection of our legal rights
- Emergency situations involving potential harm

## 7. International Data Transfers

Your data is primarily processed within the European Union. All our sub-processors either:
- Process data within the EU, or
- Have appropriate safeguards in place (Standard Contractual Clauses)

## 8. Data Retention

We retain your data according to the following schedule:

| Data Type | Retention Period |
|-----------|-----------------|
| Account data | Until account deletion + 30 days |
| Profile data | Until account deletion |
| Church membership data | Until you leave the church or account deletion |
| Form submissions | As determined by church administrator |
| Consent records | 7 years (legal requirement) |
| Technical logs | 90 days |
| Data export files | 7 days after generation |

### 8.1 After Account Deletion
When you delete your account:
- Personal data is anonymized (not fully deleted) to preserve church records
- Consent records are retained for legal compliance
- You can no longer log in or access the Service

## 9. Your Rights Under GDPR

You have the following rights regarding your personal data:

### 9.1 Right of Access (Art. 15)
You can request a copy of all personal data we hold about you.

### 9.2 Right to Rectification (Art. 16)
You can correct inaccurate or incomplete personal data through your profile settings or by contacting us.

### 9.3 Right to Erasure (Art. 17)
You can request deletion of your personal data. Note: Some data may be retained for legal compliance (see Section 8).

### 9.4 Right to Restriction (Art. 18)
You can request that we limit processing of your data in certain circumstances.

### 9.5 Right to Data Portability (Art. 20)
You can download your personal data in a machine-readable format (JSON) through your profile settings.

### 9.6 Right to Object (Art. 21)
You can object to processing based on legitimate interests.

### 9.7 Right to Withdraw Consent (Art. 7)
You can withdraw consent at any time for processing based on consent.

### 9.8 How to Exercise Your Rights
- **Self-service:** Use the Privacy section in your profile settings
- **Contact us:** Email {{CONTACT_EMAIL}}
- **Response time:** Within 30 days of your request

## 10. Cookies and Tracking

### 10.1 Essential Cookies
We use essential cookies for:
- Authentication (session management)
- Security (CSRF protection)
- Language preferences

### 10.2 Analytics
We collect limited analytics data:
- Form interaction events (opens, field focus, submissions)
- Link clicks on church link pages

We do not use third-party tracking cookies or advertising trackers.

## 11. Church Organizations as Data Controllers

### 11.1 Koinonia''s Role
Koinonia acts as a **data processor** on behalf of church organizations. Churches are the **data controllers** for member data within their organization.

### 11.2 Church Administrator Responsibilities
Church administrators are responsible for:
- Ensuring lawful basis for processing member data
- Informing members about data processing
- Responding to data subject requests from their members
- Complying with data protection laws applicable to their church

### 11.3 Data Processing Agreement
When a church creates an organization on Koinonia, they enter into a Data Processing Agreement with us that governs how we process data on their behalf.

## 12. Children''s Privacy

Our Service is not directed to children under 16. We do not knowingly collect personal data from children under 16. If you believe we have collected such data, please contact us immediately.

## 13. Security Measures

We implement appropriate technical and organizational measures to protect your data:

- Encryption in transit (TLS 1.3)
- Encryption at rest (AES-256)
- Row-Level Security for data isolation
- Regular security assessments
- Access controls and authentication
- Secure password hashing (bcrypt)

## 14. Changes to This Policy

We may update this Privacy Policy periodically. We will notify you of material changes via:
- Email notification
- In-app notice requiring re-acceptance

The current version is always available at our website.

## 15. Complaints

If you believe your data protection rights have been violated, you have the right to lodge a complaint with:

**Polish Data Protection Authority (UODO)**
Urząd Ochrony Danych Osobowych
ul. Stawki 2
00-193 Warszawa
Website: https://uodo.gov.pl

## 16. Contact Us

For any questions about this Privacy Policy or your personal data:

**{{COMPANY_NAME}}**
{{COMPANY_ADDRESS}}
Email: {{CONTACT_EMAIL}}

---

*This Privacy Policy was last updated on January 13, 2026.*',
  'How we collect, use, and protect your personal data',
  '2026-01-13',
  true
);

-- ============================================================================
-- PRIVACY POLICY - POLISH
-- ============================================================================

INSERT INTO legal_documents (
  document_type, version, language, title, content, summary, effective_date, is_current
) VALUES (
  'privacy_policy', 1, 'pl',
  'Polityka Prywatności',
  '# Polityka Prywatności

**Data wejścia w życie:** 13 stycznia 2026
**Ostatnia aktualizacja:** 13 stycznia 2026

## 1. Wprowadzenie

**{{COMPANY_NAME}}** ("Firma", "my", "nas" lub "nasz") obsługuje platformę do zarządzania kościołem Koinonia ("Usługa"). Niniejsza Polityka Prywatności wyjaśnia, w jaki sposób gromadzimy, wykorzystujemy, ujawniamy i chronimy Twoje dane osobowe zgodnie z Ogólnym Rozporządzeniem o Ochronie Danych (RODO) oraz polskimi przepisami o ochronie danych.

## 2. Informacje o Administratorze Danych

**Administrator Danych:**
{{COMPANY_NAME}}
{{COMPANY_ADDRESS}}
NIP: {{COMPANY_NIP}}

**Kontakt w sprawach ochrony danych:**
Email: {{CONTACT_EMAIL}}

## 3. Dane Osobowe, Które Gromadzimy

### 3.1 Dane Konta
Podczas tworzenia konta gromadzimy:
- Imię i nazwisko
- Adres e-mail
- Hasło (przechowywane w bezpiecznej formie zahashowanej)

### 3.2 Dane Profilu
Możesz opcjonalnie podać:
- Numer telefonu
- Datę urodzenia
- Płeć (mężczyzna/kobieta)
- Zdjęcie profilowe (avatar)
- Biografię
- Informacje o kontakcie awaryjnym
- Umiejętności
- Status i datę chrztu

### 3.3 Dane Członkostwa w Kościele
Gdy dołączasz do organizacji kościelnej:
- Przynależność do kościoła
- Przypisanie do kampusu
- Członkostwa w służbach i role
- Przypisania do wydarzeń i historia uczestnictwa
- Dostępność i okresy niedostępności wolontariusza

### 3.4 Treści Generowane przez Użytkownika
- Odpowiedzi na formularze i ankiety
- Komentarze i notatki do zadań
- Wartości pól niestandardowych (zdefiniowane przez Twój kościół)
- Aranżacje pieśni i playlisty

### 3.5 Dane Techniczne
Automatycznie gromadzimy:
- Adres IP
- Typ i wersję przeglądarki (user agent)
- Informacje o urządzeniu
- Identyfikatory sesji (dla analityki formularzy)
- Tokeny powiadomień push (jeśli włączone)
- Tokeny integracji z kalendarzem (jeśli włączone)

### 3.6 Dane Komunikacyjne
- Historia powiadomień
- Tokeny interakcji e-mail

## 4. Podstawy Prawne Przetwarzania

Przetwarzamy Twoje dane osobowe na następujących podstawach prawnych zgodnie z art. 6 RODO:

| Cel | Podstawa prawna | Artykuł RODO |
|-----|-----------------|--------------|
| Tworzenie i uwierzytelnianie konta | Wykonanie umowy | Art. 6(1)(b) |
| Świadczenie Usługi | Wykonanie umowy | Art. 6(1)(b) |
| Wysyłanie powiadomień o usłudze | Prawnie uzasadniony interes | Art. 6(1)(f) |
| Komunikacja marketingowa | Zgoda | Art. 6(1)(a) |
| Analityka i ulepszanie usługi | Prawnie uzasadniony interes | Art. 6(1)(f) |
| Zgodność z obowiązkami prawnymi | Obowiązek prawny | Art. 6(1)(c) |

### 4.1 Dane Szczególnych Kategorii
Niektóre dane, które przetwarzamy, mogą być uważane za dane szczególnych kategorii zgodnie z art. 9 RODO:
- Przynależność religijna (członkostwo w kościele, status chrztu)

Przetwarzamy te dane na podstawie:
- Twojej wyraźnej zgody (art. 9(2)(a))
- Przetwarzania przez organizację religijną dla jej członków (art. 9(2)(d))

## 5. Jak Wykorzystujemy Twoje Dane

Wykorzystujemy Twoje dane osobowe do:
- Tworzenia i zarządzania Twoim kontem
- Zapewnienia dostępu do platformy Koinonia Twojego kościoła
- Umożliwienia planowania wydarzeń i koordynacji wolontariuszy
- Wysyłania powiadomień o wydarzeniach, przypisaniach i aktualizacjach
- Przetwarzania odpowiedzi na formularze
- Umożliwienia funkcji planowania nabożeństw
- Zapewnienia obsługi klienta
- Analizowania i ulepszania naszej Usługi
- Zgodności z obowiązkami prawnymi

## 6. Udostępnianie Danych

### 6.1 W Ramach Twojej Organizacji Kościelnej
Gdy dołączasz do kościoła w Koinonia, administratorzy kościoła mają dostęp do:
- Twojego imienia i adresu e-mail
- Twojego numeru telefonu (jeśli podany)
- Twoich przypisań do służb i ról
- Twojego uczestnictwa w wydarzeniach i historii wolontariatu
- Twoich odpowiedzi na formularze (dla tego kościoła)
- Wartości pól niestandardowych

**Ważne:** Twój kościół jest administratorem danych dla tych udostępnionych danych. Zobacz Sekcję 11 po więcej informacji.

### 6.2 Podwykonawcy Przetwarzania
Korzystamy z następujących dostawców usług zewnętrznych do obsługi naszej Usługi:

| Podwykonawca | Cel | Lokalizacja | Zgodność z RODO |
|--------------|-----|-------------|-----------------|
| Supabase Inc. | Baza danych, Uwierzytelnianie, Przechowywanie plików | UE (Frankfurt, Niemcy) | Standardowe Klauzule Umowne |
| Resend Inc. | Dostarczanie e-maili transakcyjnych | UE | Umowa Powierzenia Przetwarzania |
| Google Firebase (FCM) | Powiadomienia Push | UE | Standardowe Klauzule Umowne |
| Upstash Inc. | Ograniczanie szybkości | UE | Umowa Powierzenia Przetwarzania |
| Vercel Inc. | Hosting stron internetowych | UE (Frankfurt, Niemcy) | Umowa Powierzenia Przetwarzania |

### 6.3 Wymogi Prawne
Możemy ujawnić Twoje dane, gdy jest to wymagane przez:
- Nakazy sądowe lub procedury prawne
- Żądania organów ścigania
- Ochronę naszych praw
- Sytuacje awaryjne z potencjalną szkodą

## 7. Międzynarodowe Przekazywanie Danych

Twoje dane są przetwarzane głównie w Unii Europejskiej. Wszyscy nasi podwykonawcy albo:
- Przetwarzają dane w UE, albo
- Posiadają odpowiednie zabezpieczenia (Standardowe Klauzule Umowne)

## 8. Przechowywanie Danych

Przechowujemy Twoje dane zgodnie z następującym harmonogramem:

| Typ danych | Okres przechowywania |
|------------|---------------------|
| Dane konta | Do usunięcia konta + 30 dni |
| Dane profilu | Do usunięcia konta |
| Dane członkostwa w kościele | Do opuszczenia kościoła lub usunięcia konta |
| Odpowiedzi na formularze | Według określenia administratora kościoła |
| Rejestry zgód | 7 lat (wymóg prawny) |
| Logi techniczne | 90 dni |
| Pliki eksportu danych | 7 dni po wygenerowaniu |

### 8.1 Po Usunięciu Konta
Gdy usuniesz swoje konto:
- Dane osobowe są anonimizowane (nie całkowicie usuwane) w celu zachowania zapisów kościoła
- Rejestry zgód są zachowywane dla zgodności prawnej
- Nie możesz już się zalogować ani uzyskać dostępu do Usługi

## 9. Twoje Prawa na Mocy RODO

Masz następujące prawa dotyczące Twoich danych osobowych:

### 9.1 Prawo Dostępu (art. 15)
Możesz zażądać kopii wszystkich danych osobowych, które posiadamy na Twój temat.

### 9.2 Prawo do Sprostowania (art. 16)
Możesz poprawić niedokładne lub niekompletne dane osobowe poprzez ustawienia profilu lub kontaktując się z nami.

### 9.3 Prawo do Usunięcia (art. 17)
Możesz zażądać usunięcia Twoich danych osobowych. Uwaga: Niektóre dane mogą być zachowane dla zgodności prawnej (zobacz Sekcję 8).

### 9.4 Prawo do Ograniczenia (art. 18)
Możesz zażądać ograniczenia przetwarzania Twoich danych w określonych okolicznościach.

### 9.5 Prawo do Przenoszenia Danych (art. 20)
Możesz pobrać swoje dane osobowe w formacie nadającym się do odczytu maszynowego (JSON) poprzez ustawienia profilu.

### 9.6 Prawo do Sprzeciwu (art. 21)
Możesz sprzeciwić się przetwarzaniu opartemu na prawnie uzasadnionych interesach.

### 9.7 Prawo do Wycofania Zgody (art. 7)
Możesz wycofać zgodę w dowolnym momencie dla przetwarzania opartego na zgodzie.

### 9.8 Jak Wykonać Swoje Prawa
- **Samoobsługa:** Użyj sekcji Prywatność w ustawieniach profilu
- **Kontakt z nami:** Email {{CONTACT_EMAIL}}
- **Czas odpowiedzi:** W ciągu 30 dni od Twojego żądania

## 10. Pliki Cookie i Śledzenie

### 10.1 Niezbędne Pliki Cookie
Używamy niezbędnych plików cookie do:
- Uwierzytelniania (zarządzanie sesją)
- Bezpieczeństwa (ochrona CSRF)
- Preferencji językowych

### 10.2 Analityka
Gromadzimy ograniczone dane analityczne:
- Zdarzenia interakcji z formularzami (otwarcia, fokus pól, wysłania)
- Kliknięcia linków na stronach linków kościoła

Nie używamy plików cookie śledzących stron trzecich ani trackerów reklamowych.

## 11. Organizacje Kościelne jako Administratorzy Danych

### 11.1 Rola Koinonia
Koinonia działa jako **podmiot przetwarzający** w imieniu organizacji kościelnych. Kościoły są **administratorami danych** dla danych członków w ramach ich organizacji.

### 11.2 Obowiązki Administratorów Kościoła
Administratorzy kościoła są odpowiedzialni za:
- Zapewnienie podstawy prawnej do przetwarzania danych członków
- Informowanie członków o przetwarzaniu danych
- Odpowiadanie na żądania osób, których dane dotyczą, od ich członków
- Zgodność z przepisami o ochronie danych mającymi zastosowanie do ich kościoła

### 11.3 Umowa Powierzenia Przetwarzania
Gdy kościół tworzy organizację w Koinonia, zawiera z nami Umowę Powierzenia Przetwarzania, która reguluje sposób przetwarzania przez nas danych w ich imieniu.

## 12. Prywatność Dzieci

Nasza Usługa nie jest skierowana do dzieci poniżej 16 roku życia. Nie gromadzimy świadomie danych osobowych dzieci poniżej 16 lat. Jeśli uważasz, że zebraliśmy takie dane, prosimy o natychmiastowy kontakt.

## 13. Środki Bezpieczeństwa

Wdrażamy odpowiednie środki techniczne i organizacyjne w celu ochrony Twoich danych:

- Szyfrowanie podczas przesyłania (TLS 1.3)
- Szyfrowanie w spoczynku (AES-256)
- Bezpieczeństwo na poziomie wiersza dla izolacji danych
- Regularne oceny bezpieczeństwa
- Kontrola dostępu i uwierzytelnianie
- Bezpieczne hashowanie haseł (bcrypt)

## 14. Zmiany Niniejszej Polityki

Możemy okresowo aktualizować niniejszą Politykę Prywatności. Powiadomimy Cię o istotnych zmianach za pośrednictwem:
- Powiadomienia e-mail
- Powiadomienia w aplikacji wymagającego ponownej akceptacji

Aktualna wersja jest zawsze dostępna na naszej stronie internetowej.

## 15. Skargi

Jeśli uważasz, że Twoje prawa do ochrony danych zostały naruszone, masz prawo złożyć skargę do:

**Urząd Ochrony Danych Osobowych (UODO)**
ul. Stawki 2
00-193 Warszawa
Strona internetowa: https://uodo.gov.pl

## 16. Kontakt

W przypadku pytań dotyczących niniejszej Polityki Prywatności lub Twoich danych osobowych:

**{{COMPANY_NAME}}**
{{COMPANY_ADDRESS}}
Email: {{CONTACT_EMAIL}}

---

*Niniejsza Polityka Prywatności została ostatnio zaktualizowana 13 stycznia 2026 r.*',
  'W jaki sposób gromadzimy, wykorzystujemy i chronimy Twoje dane osobowe',
  '2026-01-13',
  true
);

-- ============================================================================
-- DATA PROCESSING AGREEMENT - ENGLISH
-- ============================================================================

INSERT INTO legal_documents (
  document_type, version, language, title, content, summary, effective_date, is_current
) VALUES (
  'dpa', 1, 'en',
  'Data Processing Agreement',
  '# Data Processing Agreement

**Effective Date:** January 13, 2026

This Data Processing Agreement ("DPA") forms part of the agreement between your church organization ("Controller", "Church", "you") and **{{COMPANY_NAME}}** ("Processor", "Koinonia", "we", "us") for the use of the Koinonia church management platform ("Service").

## 1. Definitions

- **Personal Data**: Any information relating to an identified or identifiable natural person as defined in Article 4 of GDPR.
- **Processing**: Any operation performed on Personal Data as defined in Article 4 of GDPR.
- **Data Subject**: An identified or identifiable natural person whose Personal Data is processed.
- **Sub-Processor**: Any third party engaged by the Processor to process Personal Data.

## 2. Roles and Responsibilities

### 2.1 Controller (Your Church)
As the Controller, your church:
- Determines the purposes and means of processing member Personal Data
- Is responsible for ensuring lawful basis for collecting member data
- Must inform Data Subjects about the processing of their data
- Is responsible for responding to Data Subject requests from your members

### 2.2 Processor (Koinonia)
As the Processor, Koinonia:
- Processes Personal Data only on your documented instructions
- Implements appropriate technical and organizational security measures
- Assists you in fulfilling your obligations to Data Subjects
- Maintains records of processing activities

## 3. Subject Matter and Duration

### 3.1 Subject Matter
This DPA covers the processing of Personal Data of your church members through the Koinonia platform for the purposes of:
- Member profile management
- Event scheduling and volunteer coordination
- Ministry team management
- Communication and notifications
- Form and survey data collection
- Worship planning

### 3.2 Duration
This DPA remains in effect for the duration of your use of the Service.

## 4. Types of Personal Data Processed

Categories of Personal Data processed include:
- **Identity Data**: Names, profile photos
- **Contact Data**: Email addresses, phone numbers
- **Demographic Data**: Date of birth, gender
- **Religious Data**: Baptism status, church membership
- **Participation Data**: Event attendance, ministry involvement, volunteer assignments
- **User-Generated Content**: Form responses, notes, comments

## 5. Categories of Data Subjects

- Church members
- Church staff and volunteers
- Event attendees
- Form respondents

## 6. Processor Obligations

### 6.1 Processing Instructions
We will:
- Process Personal Data only according to your documented instructions
- Inform you if we believe an instruction infringes GDPR
- Not process Personal Data for our own purposes

### 6.2 Confidentiality
We will:
- Ensure personnel authorized to process Personal Data are bound by confidentiality obligations
- Limit access to Personal Data to personnel who need it

### 6.3 Security Measures
We implement the following security measures:
- Encryption in transit (TLS 1.3) and at rest (AES-256)
- Row-Level Security for data isolation between churches
- Regular security assessments and penetration testing
- Access controls and authentication mechanisms
- Secure data centers in the European Union
- Regular backups with encryption

### 6.4 Sub-Processors
We engage the following Sub-Processors:

| Sub-Processor | Purpose | Location |
|---------------|---------|----------|
| Supabase Inc. | Database, Auth, Storage | EU (Frankfurt) |
| Resend Inc. | Email Delivery | EU |
| Google Firebase | Push Notifications | EU |
| Upstash Inc. | Rate Limiting | EU |
| Vercel Inc. | Web Hosting | EU |

We will:
- Notify you before adding or replacing Sub-Processors
- Ensure Sub-Processors are bound by equivalent data protection obligations
- Remain liable for Sub-Processor compliance

### 6.5 Data Subject Rights
We will assist you in responding to Data Subject requests for:
- Access to Personal Data
- Rectification of Personal Data
- Erasure of Personal Data
- Restriction of processing
- Data portability
- Objection to processing

### 6.6 Security Incidents
In the event of a Personal Data breach, we will:
- Notify you without undue delay (within 72 hours of becoming aware)
- Provide information about the nature and scope of the breach
- Assist in your notification to supervisory authorities and Data Subjects

### 6.7 Data Protection Impact Assessments
We will provide reasonable assistance for Data Protection Impact Assessments required for your processing activities.

### 6.8 Audits
You may:
- Request information to demonstrate our compliance with this DPA
- Conduct audits (at reasonable intervals, with reasonable notice)
- Request third-party audit reports

## 7. Data Retention and Deletion

### 7.1 During the Agreement
We retain Personal Data for the duration of the Service agreement and as necessary to provide the Service.

### 7.2 Upon Termination
Upon termination of the Service:
- You may request export of your church''s data
- We will delete Personal Data within 30 days of your request
- We may retain anonymized data and consent records as required by law

### 7.3 Member Account Deletion
When a member deletes their account:
- Personal Data is anonymized (not fully deleted) to preserve church records
- Consent records are retained for legal compliance

## 8. Controller Obligations

As the Controller, you agree to:
- Ensure you have a lawful basis for processing member Personal Data
- Provide appropriate privacy notices to your members
- Respond to Data Subject requests from your members
- Notify us of any restrictions on processing
- Ensure the accuracy of Personal Data you provide
- Not use the Service to process special category data beyond religious affiliation

## 9. Liability

### 9.1 Each Party''s Liability
Each party is liable for damages caused by processing that infringes GDPR where it is responsible.

### 9.2 Indemnification
The Controller agrees to indemnify the Processor against claims arising from the Controller''s:
- Instructions that infringe GDPR
- Failure to fulfill Controller obligations under GDPR
- Processing of special category data

## 10. Governing Law

This DPA is governed by the laws of Poland. The courts of Poland have exclusive jurisdiction, without prejudice to Data Subject rights under GDPR.

## 11. Contact Information

**Processor Contact:**
{{COMPANY_NAME}}
{{COMPANY_ADDRESS}}
Email: {{CONTACT_EMAIL}}

## 12. Amendments

Amendments to this DPA must be in writing. We may update this DPA to reflect changes in law or our Sub-Processors with notice to you.

---

**By creating a church organization on Koinonia, you acknowledge that you have read, understood, and agree to be bound by this Data Processing Agreement.**

*This Data Processing Agreement was last updated on January 13, 2026.*',
  'Agreement governing how Koinonia processes data on behalf of your church',
  '2026-01-13',
  true
);

-- ============================================================================
-- DATA PROCESSING AGREEMENT - POLISH
-- ============================================================================

INSERT INTO legal_documents (
  document_type, version, language, title, content, summary, effective_date, is_current
) VALUES (
  'dpa', 1, 'pl',
  'Umowa Powierzenia Przetwarzania Danych',
  '# Umowa Powierzenia Przetwarzania Danych

**Data wejścia w życie:** 13 stycznia 2026

Niniejsza Umowa Powierzenia Przetwarzania Danych ("Umowa") stanowi część umowy między Twoją organizacją kościelną ("Administrator", "Kościół", "Ty") a **{{COMPANY_NAME}}** ("Podmiot Przetwarzający", "Koinonia", "my", "nas") dotyczącej korzystania z platformy zarządzania kościołem Koinonia ("Usługa").

## 1. Definicje

- **Dane Osobowe**: Wszelkie informacje dotyczące zidentyfikowanej lub możliwej do zidentyfikowania osoby fizycznej zgodnie z definicją w art. 4 RODO.
- **Przetwarzanie**: Każda operacja wykonywana na Danych Osobowych zgodnie z definicją w art. 4 RODO.
- **Osoba, której dane dotyczą**: Zidentyfikowana lub możliwa do zidentyfikowania osoba fizyczna, której Dane Osobowe są przetwarzane.
- **Podwykonawca przetwarzania**: Każda strona trzecia zaangażowana przez Podmiot Przetwarzający do przetwarzania Danych Osobowych.

## 2. Role i Odpowiedzialności

### 2.1 Administrator (Twój Kościół)
Jako Administrator, Twój kościół:
- Określa cele i sposoby przetwarzania Danych Osobowych członków
- Jest odpowiedzialny za zapewnienie podstawy prawnej do zbierania danych członków
- Musi informować Osoby, których dane dotyczą, o przetwarzaniu ich danych
- Jest odpowiedzialny za odpowiadanie na żądania Osób, których dane dotyczą, od swoich członków

### 2.2 Podmiot Przetwarzający (Koinonia)
Jako Podmiot Przetwarzający, Koinonia:
- Przetwarza Dane Osobowe wyłącznie na Twoje udokumentowane polecenia
- Wdraża odpowiednie techniczne i organizacyjne środki bezpieczeństwa
- Pomaga Ci w wypełnianiu Twoich obowiązków wobec Osób, których dane dotyczą
- Prowadzi rejestry czynności przetwarzania

## 3. Przedmiot i Czas Trwania

### 3.1 Przedmiot
Niniejsza Umowa obejmuje przetwarzanie Danych Osobowych członków Twojego kościoła za pośrednictwem platformy Koinonia w celach:
- Zarządzania profilami członków
- Planowania wydarzeń i koordynacji wolontariuszy
- Zarządzania zespołami służby
- Komunikacji i powiadomień
- Zbierania danych z formularzy i ankiet
- Planowania nabożeństw

### 3.2 Czas Trwania
Niniejsza Umowa obowiązuje przez okres korzystania z Usługi.

## 4. Rodzaje Przetwarzanych Danych Osobowych

Kategorie przetwarzanych Danych Osobowych obejmują:
- **Dane identyfikacyjne**: Imiona i nazwiska, zdjęcia profilowe
- **Dane kontaktowe**: Adresy e-mail, numery telefonów
- **Dane demograficzne**: Data urodzenia, płeć
- **Dane religijne**: Status chrztu, członkostwo w kościele
- **Dane o uczestnictwie**: Frekwencja na wydarzeniach, zaangażowanie w służby, przypisania wolontariuszy
- **Treści generowane przez użytkownika**: Odpowiedzi na formularze, notatki, komentarze

## 5. Kategorie Osób, Których Dane Dotyczą

- Członkowie kościoła
- Pracownicy i wolontariusze kościoła
- Uczestnicy wydarzeń
- Respondenci formularzy

## 6. Obowiązki Podmiotu Przetwarzającego

### 6.1 Instrukcje Przetwarzania
Będziemy:
- Przetwarzać Dane Osobowe wyłącznie zgodnie z Twoimi udokumentowanymi poleceniami
- Informować Cię, jeśli uważamy, że polecenie narusza RODO
- Nie przetwarzać Danych Osobowych dla własnych celów

### 6.2 Poufność
Będziemy:
- Zapewniać, że personel upoważniony do przetwarzania Danych Osobowych jest związany zobowiązaniami do zachowania poufności
- Ograniczać dostęp do Danych Osobowych do personelu, który tego potrzebuje

### 6.3 Środki Bezpieczeństwa
Wdrażamy następujące środki bezpieczeństwa:
- Szyfrowanie podczas przesyłania (TLS 1.3) i w spoczynku (AES-256)
- Bezpieczeństwo na poziomie wiersza dla izolacji danych między kościołami
- Regularne oceny bezpieczeństwa i testy penetracyjne
- Mechanizmy kontroli dostępu i uwierzytelniania
- Bezpieczne centra danych w Unii Europejskiej
- Regularne kopie zapasowe z szyfrowaniem

### 6.4 Podwykonawcy Przetwarzania
Angażujemy następujących Podwykonawców Przetwarzania:

| Podwykonawca | Cel | Lokalizacja |
|--------------|-----|-------------|
| Supabase Inc. | Baza danych, Uwierzytelnianie, Przechowywanie | UE (Frankfurt) |
| Resend Inc. | Dostarczanie e-maili | UE |
| Google Firebase | Powiadomienia Push | UE |
| Upstash Inc. | Ograniczanie szybkości | UE |
| Vercel Inc. | Hosting stron | UE |

Będziemy:
- Powiadamiać Cię przed dodaniem lub zastąpieniem Podwykonawców Przetwarzania
- Zapewniać, że Podwykonawcy Przetwarzania są związani równoważnymi obowiązkami ochrony danych
- Pozostawać odpowiedzialni za zgodność Podwykonawców Przetwarzania

### 6.5 Prawa Osób, Których Dane Dotyczą
Będziemy pomagać Ci w odpowiadaniu na żądania Osób, których dane dotyczą, w zakresie:
- Dostępu do Danych Osobowych
- Sprostowania Danych Osobowych
- Usunięcia Danych Osobowych
- Ograniczenia przetwarzania
- Przenoszenia danych
- Sprzeciwu wobec przetwarzania

### 6.6 Incydenty Bezpieczeństwa
W przypadku naruszenia ochrony Danych Osobowych będziemy:
- Powiadamiać Cię bez zbędnej zwłoki (w ciągu 72 godzin od powzięcia wiedzy)
- Dostarczać informacje o charakterze i zakresie naruszenia
- Pomagać w Twoim powiadomieniu organów nadzorczych i Osób, których dane dotyczą

### 6.7 Oceny Skutków dla Ochrony Danych
Zapewnimy rozsądną pomoc przy Ocenach Skutków dla Ochrony Danych wymaganych dla Twoich czynności przetwarzania.

### 6.8 Audyty
Możesz:
- Żądać informacji w celu wykazania naszej zgodności z niniejszą Umową
- Przeprowadzać audyty (w rozsądnych odstępach czasu, z rozsądnym wyprzedzeniem)
- Żądać raportów z audytów stron trzecich

## 7. Przechowywanie i Usuwanie Danych

### 7.1 W Trakcie Obowiązywania Umowy
Przechowujemy Dane Osobowe przez okres obowiązywania umowy o świadczenie Usługi i w zakresie niezbędnym do świadczenia Usługi.

### 7.2 Po Rozwiązaniu
Po rozwiązaniu Usługi:
- Możesz zażądać eksportu danych Twojego kościoła
- Usuniemy Dane Osobowe w ciągu 30 dni od Twojego żądania
- Możemy zachować zanonimizowane dane i rejestry zgód zgodnie z wymogami prawa

### 7.3 Usunięcie Konta Członka
Gdy członek usuwa swoje konto:
- Dane Osobowe są anonimizowane (nie całkowicie usuwane) w celu zachowania zapisów kościoła
- Rejestry zgód są zachowywane dla zgodności prawnej

## 8. Obowiązki Administratora

Jako Administrator zgadzasz się:
- Zapewnić, że masz podstawę prawną do przetwarzania Danych Osobowych członków
- Dostarczać odpowiednie informacje o prywatności swoim członkom
- Odpowiadać na żądania Osób, których dane dotyczą, od swoich członków
- Powiadamiać nas o wszelkich ograniczeniach w przetwarzaniu
- Zapewnić dokładność Danych Osobowych, które dostarczasz
- Nie używać Usługi do przetwarzania danych szczególnych kategorii wykraczających poza przynależność religijną

## 9. Odpowiedzialność

### 9.1 Odpowiedzialność Każdej ze Stron
Każda strona ponosi odpowiedzialność za szkody spowodowane przetwarzaniem naruszającym RODO, za które jest odpowiedzialna.

### 9.2 Zwolnienie z Odpowiedzialności
Administrator zgadza się zwolnić Podmiot Przetwarzający z roszczeń wynikających z:
- Poleceń Administratora naruszających RODO
- Niewywiązania się z obowiązków Administratora wynikających z RODO
- Przetwarzania danych szczególnych kategorii

## 10. Prawo Właściwe

Niniejsza Umowa podlega prawu polskiemu. Sądy polskie mają wyłączną jurysdykcję, bez uszczerbku dla praw Osób, których dane dotyczą, wynikających z RODO.

## 11. Dane Kontaktowe

**Kontakt do Podmiotu Przetwarzającego:**
{{COMPANY_NAME}}
{{COMPANY_ADDRESS}}
Email: {{CONTACT_EMAIL}}

## 12. Zmiany

Zmiany niniejszej Umowy muszą mieć formę pisemną. Możemy aktualizować niniejszą Umowę w celu odzwierciedlenia zmian w prawie lub naszych Podwykonawców Przetwarzania z powiadomieniem Ciebie.

---

**Tworząc organizację kościelną w Koinonia, potwierdzasz, że przeczytałeś, zrozumiałeś i zgadzasz się być związany niniejszą Umową Powierzenia Przetwarzania Danych.**

*Niniejsza Umowa Powierzenia Przetwarzania Danych została ostatnio zaktualizowana 13 stycznia 2026 r.*',
  'Umowa regulująca sposób przetwarzania danych przez Koinonia w imieniu Twojego kościoła',
  '2026-01-13',
  true
);

-- ============================================================================
-- CHURCH ADMIN TERMS - ENGLISH
-- ============================================================================

INSERT INTO legal_documents (
  document_type, version, language, title, content, summary, effective_date, is_current
) VALUES (
  'church_admin_terms', 1, 'en',
  'Church Administrator Terms',
  '# Church Administrator Terms

**Effective Date:** January 13, 2026

These Church Administrator Terms ("Admin Terms") supplement the Terms of Service and Data Processing Agreement and apply to you as an administrator of a church organization on the Koinonia platform.

## 1. Your Role as Data Controller

### 1.1 Controller Responsibilities
By creating or administering a church organization on Koinonia, you acknowledge that your church is the **Data Controller** for all Personal Data of your church members processed through the Service.

As Data Controller, your church is responsible for:
- Determining the purposes and means of processing member data
- Ensuring a lawful basis exists for collecting and processing member data
- Informing members about how their data will be processed
- Responding to data subject requests from your members
- Complying with applicable data protection laws

### 1.2 Koinonia''s Role
Koinonia acts as a **Data Processor** on your behalf. We process member data only according to your instructions and the Data Processing Agreement.

## 2. Authorization to Act

By creating or administering a church organization, you represent and warrant that:
- You are duly authorized to act on behalf of the church
- You have the authority to bind the church to these terms
- You have the authority to make decisions about member data processing
- The church leadership is aware of and consents to the use of Koinonia

## 3. Member Data Management

### 3.1 Data Collection
You are responsible for:
- Collecting member data lawfully and transparently
- Obtaining appropriate consent where required
- Informing members about data collection at the time of collection
- Collecting only data that is necessary for your church''s purposes

### 3.2 Data Accuracy
You agree to:
- Maintain accurate and up-to-date member records
- Correct inaccurate data promptly when notified
- Delete or anonymize data that is no longer needed

### 3.3 Member Rights
When members exercise their data protection rights, you are responsible for:
- Responding to access requests within 30 days
- Correcting or deleting data upon valid request
- Not retaliating against members who exercise their rights

## 4. Appropriate Use of Member Data

### 4.1 Permitted Uses
You may use member data only for:
- Church administration and operations
- Event planning and volunteer coordination
- Ministry management and communication
- Pastoral care and member support
- Other legitimate church activities

### 4.2 Prohibited Uses
You may NOT use member data for:
- Commercial purposes unrelated to church activities
- Political campaigning or lobbying
- Sharing with third parties without member consent
- Discriminatory purposes
- Any purpose that would violate member trust or applicable law

## 5. Security Responsibilities

### 5.1 Access Control
You are responsible for:
- Assigning appropriate roles to church staff and volunteers
- Limiting data access to those who need it
- Promptly removing access when no longer needed
- Training administrators on data protection responsibilities

### 5.2 Credential Security
You must:
- Keep your login credentials confidential
- Not share accounts among multiple people
- Use strong, unique passwords
- Report any suspected security breaches immediately

## 6. Data Sharing Within Your Church

### 6.1 What Members See
When members join your church, they can see:
- Church events and schedules
- Ministry information
- Other members (name only, by default)

### 6.2 What Administrators See
As an administrator, you can access:
- Member profiles (name, email, phone, etc.)
- Ministry assignments and roles
- Event participation and volunteer history
- Form submissions
- Custom field data

### 6.3 Transparency Requirement
You must inform members about what data administrators can access. Koinonia provides this information during the join process, but you may provide additional notice.

## 7. Member Departure

When a member leaves your church or deletes their account:
- Their personal data is anonymized
- Historical records (event participation, assignments) are retained with anonymized references
- You may not attempt to re-identify anonymized members

## 8. Compliance with Law

### 8.1 Data Protection Laws
You agree to comply with all applicable data protection laws, including:
- General Data Protection Regulation (GDPR)
- Polish Act on Personal Data Protection
- Any other applicable national or local laws

### 8.2 Other Laws
You also agree to comply with laws regarding:
- Anti-discrimination
- Child protection
- Employment (for church staff)
- Charitable organizations

## 9. Indemnification

You agree to indemnify and hold harmless {{COMPANY_NAME}} from any claims, damages, or expenses arising from:
- Your violation of these Admin Terms
- Your violation of data protection laws
- Unauthorized use of member data
- Failure to respond to data subject requests
- Any action by your church that infringes third-party rights

## 10. Termination

### 10.1 Your Termination Rights
You may delete your church organization at any time through the Service settings or by contacting us.

### 10.2 Our Termination Rights
We may suspend or terminate your church organization if you:
- Violate these Admin Terms
- Violate the Terms of Service or Data Processing Agreement
- Engage in illegal activity
- Misuse member data

### 10.3 Effect of Termination
Upon termination:
- Access to the Service ceases for all church members
- You may request data export before termination
- Data will be deleted or anonymized according to our retention policy

## 11. Changes to Admin Terms

We may update these Admin Terms from time to time. Material changes will be communicated via:
- Email to registered church administrators
- Notice within the Service

Continued use after changes constitutes acceptance.

## 12. Contact

For questions about these Admin Terms:

**{{COMPANY_NAME}}**
{{COMPANY_ADDRESS}}
Email: {{CONTACT_EMAIL}}

---

**By creating or administering a church organization on Koinonia, you acknowledge that you have read, understood, and agree to be bound by these Church Administrator Terms.**

*These Church Administrator Terms were last updated on January 13, 2026.*',
  'Terms for church administrators governing data controller responsibilities',
  '2026-01-13',
  true
);

-- ============================================================================
-- CHURCH ADMIN TERMS - POLISH
-- ============================================================================

INSERT INTO legal_documents (
  document_type, version, language, title, content, summary, effective_date, is_current
) VALUES (
  'church_admin_terms', 1, 'pl',
  'Warunki dla Administratorów Kościoła',
  '# Warunki dla Administratorów Kościoła

**Data wejścia w życie:** 13 stycznia 2026

Niniejsze Warunki dla Administratorów Kościoła ("Warunki Administratora") uzupełniają Regulamin Usługi i Umowę Powierzenia Przetwarzania Danych i mają zastosowanie do Ciebie jako administratora organizacji kościelnej na platformie Koinonia.

## 1. Twoja Rola jako Administratora Danych

### 1.1 Obowiązki Administratora
Tworząc lub zarządzając organizacją kościelną w Koinonia, potwierdzasz, że Twój kościół jest **Administratorem Danych** dla wszystkich Danych Osobowych członków Twojego kościoła przetwarzanych za pośrednictwem Usługi.

Jako Administrator Danych, Twój kościół jest odpowiedzialny za:
- Określanie celów i sposobów przetwarzania danych członków
- Zapewnienie podstawy prawnej do zbierania i przetwarzania danych członków
- Informowanie członków o tym, jak ich dane będą przetwarzane
- Odpowiadanie na żądania osób, których dane dotyczą, od Twoich członków
- Zgodność z obowiązującymi przepisami o ochronie danych

### 1.2 Rola Koinonia
Koinonia działa jako **Podmiot Przetwarzający** w Twoim imieniu. Przetwarzamy dane członków wyłącznie zgodnie z Twoimi poleceniami i Umową Powierzenia Przetwarzania Danych.

## 2. Upoważnienie do Działania

Tworząc lub zarządzając organizacją kościelną, oświadczasz i gwarantujesz, że:
- Jesteś należycie upoważniony do działania w imieniu kościoła
- Masz uprawnienia do związania kościoła niniejszymi warunkami
- Masz uprawnienia do podejmowania decyzji dotyczących przetwarzania danych członków
- Kierownictwo kościoła jest świadome i wyraża zgodę na korzystanie z Koinonia

## 3. Zarządzanie Danymi Członków

### 3.1 Zbieranie Danych
Jesteś odpowiedzialny za:
- Zbieranie danych członków zgodnie z prawem i w sposób przejrzysty
- Uzyskanie odpowiedniej zgody, gdy jest wymagana
- Informowanie członków o zbieraniu danych w momencie zbierania
- Zbieranie tylko danych niezbędnych dla celów Twojego kościoła

### 3.2 Dokładność Danych
Zgadzasz się:
- Utrzymywać dokładne i aktualne rejestry członków
- Niezwłocznie poprawiać niedokładne dane po powiadomieniu
- Usuwać lub anonimizować dane, które nie są już potrzebne

### 3.3 Prawa Członków
Gdy członkowie wykonują swoje prawa do ochrony danych, jesteś odpowiedzialny za:
- Odpowiadanie na żądania dostępu w ciągu 30 dni
- Poprawianie lub usuwanie danych na uzasadnione żądanie
- Niestosowanie represji wobec członków wykonujących swoje prawa

## 4. Właściwe Wykorzystanie Danych Członków

### 4.1 Dozwolone Użycie
Możesz wykorzystywać dane członków wyłącznie do:
- Administracji i działalności kościoła
- Planowania wydarzeń i koordynacji wolontariuszy
- Zarządzania służbami i komunikacji
- Opieki duszpasterskiej i wsparcia członków
- Innych uzasadnionych działań kościelnych

### 4.2 Zabronione Użycie
NIE możesz wykorzystywać danych członków do:
- Celów komercyjnych niezwiązanych z działalnością kościelną
- Kampanii politycznych lub lobbingu
- Udostępniania stronom trzecim bez zgody członka
- Celów dyskryminacyjnych
- Jakichkolwiek celów naruszających zaufanie członków lub obowiązujące prawo

## 5. Obowiązki Bezpieczeństwa

### 5.1 Kontrola Dostępu
Jesteś odpowiedzialny za:
- Przypisywanie odpowiednich ról pracownikom i wolontariuszom kościoła
- Ograniczanie dostępu do danych dla osób, które tego potrzebują
- Niezwłoczne odbieranie dostępu, gdy nie jest już potrzebny
- Szkolenie administratorów w zakresie obowiązków ochrony danych

### 5.2 Bezpieczeństwo Danych Logowania
Musisz:
- Zachować poufność swoich danych logowania
- Nie udostępniać kont wielu osobom
- Używać silnych, unikalnych haseł
- Natychmiast zgłaszać wszelkie podejrzewane naruszenia bezpieczeństwa

## 6. Udostępnianie Danych w Ramach Twojego Kościoła

### 6.1 Co Widzą Członkowie
Gdy członkowie dołączają do Twojego kościoła, mogą zobaczyć:
- Wydarzenia i harmonogramy kościoła
- Informacje o służbach
- Innych członków (domyślnie tylko imię)

### 6.2 Co Widzą Administratorzy
Jako administrator masz dostęp do:
- Profili członków (imię, e-mail, telefon itp.)
- Przypisań do służb i ról
- Uczestnictwa w wydarzeniach i historii wolontariatu
- Odpowiedzi na formularze
- Danych pól niestandardowych

### 6.3 Wymóg Przejrzystości
Musisz informować członków o tym, do jakich danych mają dostęp administratorzy. Koinonia podaje te informacje podczas procesu dołączania, ale możesz dostarczyć dodatkowe powiadomienie.

## 7. Odejście Członka

Gdy członek opuszcza Twój kościół lub usuwa swoje konto:
- Jego dane osobowe są anonimizowane
- Historyczne zapisy (uczestnictwo w wydarzeniach, przypisania) są zachowywane z zanonimizowanymi odniesieniami
- Nie możesz próbować ponownie zidentyfikować zanonimizowanych członków

## 8. Zgodność z Prawem

### 8.1 Przepisy o Ochronie Danych
Zgadzasz się przestrzegać wszystkich obowiązujących przepisów o ochronie danych, w tym:
- Ogólnego Rozporządzenia o Ochronie Danych (RODO)
- Polskiej Ustawy o Ochronie Danych Osobowych
- Wszelkich innych obowiązujących przepisów krajowych lub lokalnych

### 8.2 Inne Przepisy
Zgadzasz się również przestrzegać przepisów dotyczących:
- Antydyskryminacji
- Ochrony dzieci
- Zatrudnienia (dla pracowników kościoła)
- Organizacji charytatywnych

## 9. Zwolnienie z Odpowiedzialności

Zgadzasz się zwolnić i chronić {{COMPANY_NAME}} przed wszelkimi roszczeniami, szkodami lub wydatkami wynikającymi z:
- Twojego naruszenia niniejszych Warunków Administratora
- Twojego naruszenia przepisów o ochronie danych
- Nieautoryzowanego wykorzystania danych członków
- Nieodpowiadania na żądania osób, których dane dotyczą
- Jakichkolwiek działań Twojego kościoła naruszających prawa osób trzecich

## 10. Rozwiązanie

### 10.1 Twoje Prawa do Rozwiązania
Możesz usunąć swoją organizację kościelną w dowolnym momencie poprzez ustawienia Usługi lub kontaktując się z nami.

### 10.2 Nasze Prawa do Rozwiązania
Możemy zawiesić lub rozwiązać Twoją organizację kościelną, jeśli:
- Naruszysz niniejsze Warunki Administratora
- Naruszysz Regulamin Usługi lub Umowę Powierzenia Przetwarzania Danych
- Podejmiesz nielegalną działalność
- Nadużyjesz danych członków

### 10.3 Skutki Rozwiązania
Po rozwiązaniu:
- Dostęp do Usługi zostaje zakończony dla wszystkich członków kościoła
- Możesz zażądać eksportu danych przed rozwiązaniem
- Dane zostaną usunięte lub zanonimizowane zgodnie z naszą polityką przechowywania

## 11. Zmiany Warunków Administratora

Możemy od czasu do czasu aktualizować niniejsze Warunki Administratora. Istotne zmiany będą komunikowane za pośrednictwem:
- E-maila do zarejestrowanych administratorów kościoła
- Powiadomienia w Usłudze

Dalsze korzystanie po zmianach oznacza akceptację.

## 12. Kontakt

W przypadku pytań dotyczących niniejszych Warunków Administratora:

**{{COMPANY_NAME}}**
{{COMPANY_ADDRESS}}
Email: {{CONTACT_EMAIL}}

---

**Tworząc lub zarządzając organizacją kościelną w Koinonia, potwierdzasz, że przeczytałeś, zrozumiałeś i zgadzasz się być związany niniejszymi Warunkami dla Administratorów Kościoła.**

*Niniejsze Warunki dla Administratorów Kościoła zostały ostatnio zaktualizowane 13 stycznia 2026 r.*',
  'Warunki dla administratorów kościoła regulujące obowiązki administratora danych',
  '2026-01-13',
  true
);
