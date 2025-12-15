# Requirements Document

## Introduction

Webová aplikace pro správu povinné četby umožňuje školám efektivně spravovat třídy, žáky, učitele a knihy povinné četby. Systém zajišťuje, že žáci vytvoří seznamy přečtených knih v souladu s požadavky maturitní zkoušky, včetně kontroly kategorií (literární druhy a období) a autorů. Aplikace poskytuje API pro mobilní aplikaci a umožňuje tisk formálních seznamů četby.

## Glossary

- **System**: Webová aplikace pro správu povinné četby
- **Admin**: Správce systému s plnými právy pro správu dat
- **Student**: Žák, který vytváří a spravuje svůj seznam povinné četby
- **Teacher**: Učitel přiřazený ke třídě jako vyučující češtiny
- **Class**: Třída ve škole s rokem maturity a deadlinem
- **Book**: Kniha v systému povinné četby
- **Author**: Autor knihy
- **Literary_class**: Literární druh (kategorie) - např. česká literatura, světová literatura
- **Period**: Literární období - např. starověk, 19. století
- **Reading List**: Seznam přečtených knih vytvořený žákem
- **API**: Rozhraní pro komunikaci s mobilní aplikací

## Requirements

### Requirement 1

**User Story:** Jako admin chci spravovat třídy, učitele a žáky, abych mohl udržovat aktuální evidenci školy.

#### Acceptance Criteria

1. WHEN admin vytvoří novou třídu THEN the System SHALL uložit třídu s názvem, rokem maturity, deadlinem a přiřazeným učitelem češtiny
2. WHEN admin přiřadí učitele ke třídě THEN the System SHALL aktualizovat vztah mezi učitelem a třídou
3. WHEN admin vloží nového žáka THEN the System SHALL vytvořit účet žáka s přihlašovacími údaji a přiřadit ho ke třídě
4. WHEN admin provede hromadné vložení žáků THEN the System SHALL vytvořit účty pro všechny žáky v dávce a přiřadit je ke specifikované třídě
5. WHEN admin upraví údaje třídy, učitele nebo žáka THEN the System SHALL uložit změny a zachovat integritu dat

### Requirement 2

**User Story:** Jako admin chci spravovat autory, literární druhy, období a knihy, abych mohl udržovat aktuální katalog povinné četby.

#### Acceptance Criteria

1. WHEN admin vytvoří nový literární druh THEN the System SHALL uložit literární druh s názvem, minimálním a maximálním počtem knih
2. WHEN admin vytvoří nové období THEN the System SHALL uložit období s názvem, minimálním a maximálním počtem knih
3. WHEN admin přidá nového autora THEN the System SHALL uložit autora se jménem a příjmením
4. WHEN admin přidá novou knihu THEN the System SHALL uložit knihu s názvem, autorem, literárním druhem, obdobím a URL
5. WHEN admin upraví údaje knihy THEN the System SHALL aktualizovat informace o knize včetně všech vztahů
6. WHEN admin smaže knihu THEN the System SHALL odstranit knihu pouze pokud není použita v žádném seznamu četby
7. WHEN admin zobrazí seznam knih THEN the System SHALL zobrazit všechny knihy s informacemi o autorovi, literárním druhu a období

### Requirement 3

**User Story:** Jako admin chci resetovat hesla žáků, abych mohl pomoci žákům s přístupem do systému.

#### Acceptance Criteria

1. WHEN admin resetuje heslo žáka THEN the System SHALL vygenerovat nové dočasné heslo a uložit ho
2. WHEN admin resetuje heslo THEN the System SHALL zobrazit nové heslo adminovi pro předání žákovi
3. WHEN žák se přihlásí s dočasným heslem THEN the System SHALL vyžadovat změnu hesla při prvním přihlášení

### Requirement 4

**User Story:** Jako žák chci se přihlásit do systému, abych mohl spravovat svůj seznam povinné četby.

#### Acceptance Criteria

1. WHEN žák zadá správné přihlašovací údaje THEN the System SHALL autorizovat žáka a zobrazit jeho dashboard
2. WHEN žák zadá nesprávné přihlašovací údaje THEN the System SHALL zamítnout přihlášení a zobrazit chybovou zprávu
3. WHEN žák se úspěšně přihlásí THEN the System SHALL vytvořit session pro žáka
4. WHEN žák se odhlásí THEN the System SHALL ukončit session a přesměrovat na přihlašovací stránku
5. WHERE žák má Google účet WHEN žák se přihlásí přes Google OAuth THEN the System SHALL autorizovat žáka bez hesla

### Requirement 5

**User Story:** Jako žák chci vytvořit seznam přečtených knih, abych splnil požadavky maturitní zkoušky.

#### Acceptance Criteria

1. WHEN žák přidá knihu do svého seznamu THEN the System SHALL přidat knihu s časovým razítkem a aktualizovat počty v literárních druzích a obdobích
2. WHEN žák odebere knihu ze seznamu THEN the System SHALL odstranit knihu a aktualizovat počty v literárních druzích a obdobích
3. WHEN žák zobrazí svůj seznam THEN the System SHALL zobrazit všechny vybrané knihy s informacemi o autorovi, literárním druhu a období
4. WHEN žák upraví svůj seznam THEN the System SHALL uložit změny okamžitě do databáze

### Requirement 6

**User Story:** Jako žák chci, aby systém kontroloval pravidla maturitní zkoušky, abych měl jistotu, že můj seznam je validní.

#### Acceptance Criteria

1. WHEN žák přidá knihu od autora THEN the System SHALL zkontrolovat, zda žák nemá již dvě knihy od stejného autora
2. IF žák má již dvě knihy od stejného autora THEN the System SHALL zamítnout přidání třetí knihy a zobrazit chybovou zprávu
3. WHEN žák zobrazí svůj seznam THEN the System SHALL zobrazit aktuální počty knih v jednotlivých literárních druzích a obdobích
4. WHEN žák zobrazí svůj seznam THEN the System SHALL zobrazit, které literární druhy a období ještě nesplňují minimální požadavky
5. WHEN žák zobrazí svůj seznam THEN the System SHALL zobrazit, které literární druhy a období překračují maximální limit
6. WHEN žák se pokusí označit seznam jako dokončený THEN the System SHALL ověřit, že všechny literární druhy a období splňují minimální a maximální požadavky

### Requirement 7

**User Story:** Jako žák chci vytisknout svůj seznam povinné četby, abych ho mohl odevzdat učiteli.

#### Acceptance Criteria

1. WHEN žák vybere možnost tisku THEN the System SHALL vygenerovat PDF dokument se seznamem četby
2. WHEN systém generuje tisk THEN the System SHALL zahrnout záhlaví s logem školy, jménem žáka a třídou
3. WHEN systém generuje tisk THEN the System SHALL zahrnout zápatí s datem tisku a místem pro podpisy
4. WHEN systém generuje tisk THEN the System SHALL zobrazit všechny knihy seřazené podle literárních druhů a období
5. WHEN systém generuje tisk THEN the System SHALL formátovat dokument pro standardní tisk na A4

### Requirement 8

**User Story:** Jako vývojář mobilní aplikace chci přistupovat k datům přes API, abych mohl vytvořit mobilní verzi aplikace.

#### Acceptance Criteria

1. WHEN mobilní aplikace odešle autentizovaný požadavek THEN the System SHALL ověřit autentizaci a vrátit požadovaná data
2. WHEN API endpoint je volán THEN the System SHALL vrátit data ve formátu JSON
3. WHEN API endpoint je volán THEN the System SHALL zahrnout odpovídající HTTP status kódy
4. WHEN API je přístupné THEN the System SHALL poskytovat dokumentaci všech endpointů
5. WHEN API zpracovává požadavek THEN the System SHALL validovat vstupní data a vracet chyby při nevalidních datech

### Requirement 9

**User Story:** Jako admin chci registrovat žáky individuálně nebo hromadně, abych mohl efektivně spravovat velké množství žáků.

#### Acceptance Criteria

1. WHEN admin použije individuální registraci THEN the System SHALL vytvořit účet pro jednoho žáka s manuálně zadanými údaji
2. WHEN admin použije hromadnou registraci THEN the System SHALL přijmout CSV soubor nebo seznam žáků
3. WHEN systém zpracovává hromadnou registraci THEN the System SHALL validovat všechny záznamy před vytvořením účtů
4. IF hromadná registrace obsahuje nevalidní data THEN the System SHALL zobrazit chyby a neumožnit vytvoření účtů s chybami
5. WHEN hromadná registrace je úspěšná THEN the System SHALL vygenerovat přihlašovací údaje pro všechny žáky a zobrazit je adminovi

### Requirement 10

**User Story:** Jako uživatel systému chci, aby aplikace byla bezpečná, abych měl jistotu, že moje data jsou chráněna.

#### Acceptance Criteria

1. WHEN uživatel zadá heslo THEN the System SHALL uložit heslo v zahashované podobě
2. WHEN uživatel přistupuje k chráněným stránkám THEN the System SHALL ověřit platnou session
3. IF uživatel nemá platnou session THEN the System SHALL přesměrovat uživatele na přihlašovací stránku
4. WHEN API endpoint je volán THEN the System SHALL vyžadovat autentizační token
5. WHEN systém detekuje neautorizovaný přístup THEN the System SHALL zamítnout požadavek a vrátit HTTP 401 nebo 403
