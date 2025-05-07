# Projektvision: Svea AI Application

## Övergripande vision
Svea AI Application ska vara en intelligent, domänagnostisk produktassistent som hjälper användare att förstå, analysera och köpa produkter från alla typer av webbutiker - från B2C-elektronik till B2B-merchandise. Fokus ligger på att erbjuda en universal shoppingupplevelse där AI-assistenten kan analysera och jämföra alla slags produkter genom ett användarvänligt gränssnitt.

### Primära värden för användaren
- Tidsbesparingar genom automatiserad produktforskning och jämförelse
- Förbättrade inköpsbeslut genom opartisk datadriven analys
- Minskad komplexitet vid inköp över olika leverantörer och plattformar

## Etapp 1: Användarhantering & Produktintelligens (3-6 månader)
### Mål
Skapa en plattform med robust användarhanteringssystem där användare kan registrera sig och hantera profiler. Plattformen ska kunna samla, strukturera och analysera produktdata från utvalda webbutiker, med förmåga att hantera produkter i olika kategorier.

### Funktioner
- Komplett användarhantering (registrering, profiler, autentisering)
- Säker hantering av användardata och inloggningsuppgifter för externa tjänster
- Flexibel datainsamling från olika typer av webbplatser
- Strukturerad datamodell som förstår produktegenskaper
- Enkelt textbaserat gränssnitt för produktfrågor
- Grundläggande produktjämförelser

### Teknik
- Backend: Python (FastAPI) för effektiv API-hantering
- Frontend: React med fokus på användarvänlighet och responsiv design för olika enheter
- Databas: Supabase för produktdata, användarhantering och autentisering
- Data-insamling: Flexibel crawlerarkitektur för olika webbplatsstrukturer
- Säker kryptering av användaruppgifter
- Enkel LLM-integration för produktförståelse
- Containriserad infrastruktur för skalbarhet och underhållbarhet

### KPI:er
- Användarengagemang: >50% återkommande användare inom 30 dagar efter registrering
- Användarupplevelse: >80% positiva användarbetyg i feedback
- Teknisk kvalitet: <1% feltolkningar av produktdata, <5s svarstid på frågor
- Tillväxt: Stöd för minst 5 webbutiker och 3 produktkategorier i slutet av etappen
- Robusthet: 99.9% systemtillgänglighet

## Etapp 2: Universal Shopping Assistant (6-12 månader)
### Mål
Vidareutveckla plattformen för att fungera som en universell shoppingassistent som kan hantera produktjämförelser och orderprocesser, oavsett bransch eller webbutik.

### Funktioner
- Personaliserade produktrekommendationer baserat på användarprofil
- Avancerade produktjämförelser över alla kategorier
- Möjlighet att hantera beställningar direkt i gränssnittet
- Integrerad prisjämförelse mellan olika källor
- Produktbevakningar och notifieringar
- Hantering av användarspecifika rabatter och preferenser

### Teknik
- Integrationer med e-handelsplattformar och B2B-portaler via standardiserade API:er
- Avancerad AI-modell med förmåga att förstå branschspecifika termer
- Single Sign-On lösningar för sömlös autentisering
- API-integrationer för direkta beställningar där möjligt
- Caching-strategi för förbättrad prestanda

### KPI:er
- Användartillfredsställelse: NPS >40 för personaliseringsupplevelse
- Konvertering: >25% av produktsökningar leder till beställning
- Plattformsengagemang: Genomsnittlig användartid >10 minuter per session
- Dataanalys: >90% precision i tvärdomänliga produktjämförelser
- Produktbredd: Stöd för >15 webbutiker och >10 produktkategorier
- Skalbarhet: Systemet ska klara av 1000 samtidiga användare

## Etapp 3: Intelligent Inköpsplattform (12-24 månader)
### Mål
Utveckla ett intelligent inköpssystem med möjlighet till avancerad användaranpassning, orderhantering, och på sikt även automatisering av vissa processer.

### Funktioner
- Konversationsbaserad produktrådgivning över alla produktkategorier
- Personaliserad bevakningsportal för användaren
- Möjlighet att dela inköpslistor och rekommendationer
- Integration med användarens befintliga inköpsprocesser
- Sammankoppling av matchande produkter från olika leverantörer
- Möjlighet till schemaläggning av återkommande inköp (ej automatiserat utan med användarens godkännande)

### Teknik
- Avancerad LLM-integration med bred produktförståelse
- Personaliserade modeller baserade på användarpreferenser
- Integrationer med företagssystem (ERP, inköpssystem) med användarens medgivande
- Säker multi-site autentiseringshantering
- Distribuerad arkitektur för hög tillgänglighet
- Kontinuerlig integrationsprocess för uppdatering av modeller

### KPI:er
- Användarnöjdhet: >90% av användarna uppger att plattformen sparar tid
- Insikter: Genomsnittlig besparingsgrad >15% genom AI-rekommendationer
- Systemeffektivitet: >95% automatisk extraktion och kategorisering av produkt
- Teknisk skalbarhet: Stöd för >10 000 aktiva användare och >50 integrerade butiker

## Affärsmodell
- Inledningsvis kostnadsfri basprofil med begränsade funktioner (max 10 sökningar/månad)
- Premium-användarmodell (99kr/månad) med tillgång till avancerade funktioner
- Företagsabonnemang (från 499kr/månad) med möjlighet till flera användare och anpassade rapporter
- Potentiell provision från leverantörer för genererade order (3-7% per transaktion)
- Målsättning för break-even: 18 månader efter lansering

## Tekniska utmaningar och prioriteringar
- **Användarhantering**: Skapa ett robust och säkert system för användarregistrering och hantering
- **Universell produktförståelse**: Utveckla modeller som förstår produkter oavsett bransch
- **Säker autentisering**: Hantera och lagra användaruppgifter på ett säkert sätt
- **Intelligent crawling**: 
  - Prioritera användning av sitemaps när tillgängliga för effektiv och resurssnål datainsamling
  - Utveckla anpassningsbara abstraktionslager för att hantera olika webbplatsstrukturer
  - Implementera självlärande extraktionsmodeller som kan identifiera produktdata oavsett presentationsformat
  - Skapa produktmappningsramverk för att normalisera produktattribut från olika källor
- **Integration**: Hantera olika typer av e-handelssystem och B2B-portaler
- **Skalbarhet**: Säkerställa att systemet kan hantera ökande mängder data och användare utan prestandaförlust
- **Kostnadskontroll**: Optimera AI-modellernas kostnadseffektivitet särskilt för inferens

## Dataextraktion och normalisering
För att hantera att olika webbutiker presenterar produkter med olika struktur och terminologi, kommer systemet att använda följande strategier:

1. **Strukturerad datainsamling**:
   - Prioritera XML/HTML sitemaps för effektiv sidupptäckt
   - Automatisk identifiering av produktlistor och produktsidor
   - Kategorispecifik extraktion baserad på domänkunskap
   - Rate-limiting för att respektera webbplatsers resurser

2. **Flexibla extraktionsmodeller**:
   - Konfigurerbar mappning för olika webbplatsstrukturer
   - **AI-driven produktelementidentifiering**:
     - Tränade vision-språkmodeller (VLM) som kan identifiera visuella och textuella produktelement i webbsidor
     - Transformer-baserade modeller tränade på HTML-struktur för att identifiera semantiska element som pris, titel och specifikationer oavsett HTML-layout
     - Few-shot learning där systemet kan lära sig nya produktelementstyper från några få exempel
     - Transfer learning där kunskap om produktstruktur från en webbplats överförs till andra liknande webbplatser
   - Semi-automatisk konfiguration vid integration av nya källor
   - Kontinuerlig förbättring genom aktiv inlärning från användares interaktioner

3. **Attributnormalisering**:
   - Standardiserad produktdatamodell med flexibla attribut
   - AI-driven mappning av butiksspecifika termer till standardterminologi
   - Hantering av olika måttenheter, formateringar och namnkonventioner
   - Versionshantering av datamodeller för spårbarhet
   
4. **Kvalitetssäkring**:
   - Automatisk validering av extraherad data
   - Detektering av anomalier och outliers i produktdata
   - Kontinuerlig övervakning av extraktionsprecision
   - Periodiska stickprovstester med manuell verifiering

Denna strategi säkerställer att produktdata kan samlas in och normaliseras effektivt oavsett hur den presenteras på olika webbplatser, vilket möjliggör meningsfulla jämförelser och analyser.

## Juridiska och etiska överväganden
- **Datainsamling**: Endast publikt tillgänglig data samlas in i enlighet med webbplatsers robots.txt
- **GDPR-efterlevnad**: Användardata hanteras strikt enligt dataskyddsförordningen
- **Transparens**: Tydlig information till användare om hur deras data används och lagras
- **Rättvis konkurrens**: System designat för att undvika diskriminering mellan olika butiker
- **Samtycke**: Explicit godkännande krävs för externa tjänstintegrationer

## Riskhantering och beredskap
- **Tekniska risker**: 
  - Plan för hantering av API-förändringar hos tredjepartstjänster
  - Redundans i kritiska system för att hantera driftstörningar
  - Regelbunden säkerhetsrevision och penetrationstestning
- **Affärsrisker**:
  - Strategi för att hantera motstånd från webbutiker som inte vill vara en del av systemet
  - Kontinuitetsplan för förändringar i marknadsförhållanden
- **Datakvalitetsrisker**:
  - System för att identifiera och hantera felaktig eller föråldrad produktinformation
  - Fallbackstrategier när dataextraktion misslyckas

## Framgångsfaktorer
- Användarvänlighet och tydlig värdeproposition från första användningstillfället
- Robust användarhantering med hög säkerhet
- Generaliserbar produktkunskap över olika domäner
- Balans mellan funktionalitet och enkelhet
- Fokus på användarstyrning över systemet
- Snabb time-to-value för nya användare
- Kontinuerlig förbättring baserad på användarfeedback

Denna vision bygger på att skapa ett användarstyrt intelligent system som fungerar som en universell inköpsassistent över alla branscher och produkttyper. Svea AI Application ska eliminera gränsen mellan olika e-handelsplattformar och förenkla inköpsprocessen oavsett om användaren letar efter elektronik, kontorsmaterial, profilprodukter eller andra varor.

## Adaptiv crawling och inlärning

Systemet bygger på en inlärningscykel för att optimera crawling och dataextraktion över tid:

### 1. Butiksminnessystem
- Systemet lagrar strukturell förståelse för varje specifik webbplats (t.ex. Kjell.com, Webhallen, etc.)
- Vid första crawlen identifieras mönster som HTML-struktur, CSS-klasser och DOM-navigering för produktelement
- Dessa mönster sparas som en "butiksprofil" för att effektivisera framtida crawls
- Versionskontroll av butiksprofiler för historisk spårbarhet

### 2. Progressiv optimering
- För varje crawl blir systemet mer effektivt genom att:
  - Fokusera på redan identifierade produktlistor och kategorisidor
  - Prioritera navigation genom kända mönster i webbplatsens struktur
  - Förutse var nya produkter sannolikt kommer att publiceras
  - Optimera crawlscheman baserat på uppdateringsfrekvens

### 3. Automatisk anpassning
- Vid ändringar i webbplatsens struktur (redesign etc.):
  - Systemet upptäcker avvikelser från den lagrade butiksprofilen
  - Initierar en anpassningsprocess för att lära sig den nya strukturen
  - Bevarar produktkunskap medan strukturförståelsen uppdateras
  - Notifierar administratörer vid kritiska strukturella förändringar

### 4. Branschöverföring
- Kunskap från liknande webbplatser (t.ex. elektronikbutiker) överförs genom:
  - Identifiering av gemensamma produktattributmönster
  - Tillämpning av framgångsrika extraktionsstrategier från en butik till en annan
  - Klassificering av nya butiker baserat på likhet med redan kända butiker
  - Prestandamätning för att kvantifiera värdet av kunskapsöverföring

Detta adaptiva system säkerställer att crawling blir markant effektivare för varje körning, samtidigt som det kan hantera webbplatsändringar och snabbt integreras med nya webbplatser inom liknande branscher.

## Implementeringsplan och resursallokering
- Utvecklingsteam: 3-5 utvecklare initialt, skalning efter behov
- Infrastruktur: Molnbaserad med flexibla resurser för att hantera varierande belastning
- Utvecklingscykel: 2-veckors sprintar med kontinuerlig leverans
- Testing: Automatiserade tester för all kärnfunktionalitet, A/B-testning för UX
- Feedback: Etablera användarfeedbackloop från tidigt skede 