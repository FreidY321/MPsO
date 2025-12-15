# Implementation Plan

- [x] 1. Nastavení projektu a databázového připojení
  - Inicializovat Node.js projekt s Express
  - Nainstalovat závislosti: express, mysql2, bcrypt, jsonwebtoken, express-validator, cors, dotenv
  - Vytvořit .env soubor pro konfiguraci (DB credentials, JWT secret)
  - Implementovat databázové připojení k MariaDB
  - Vytvořit základní strukturu složek (routes, controllers, repositories, middleware, utils)
  - _Requirements: 10.1, 10.2_

- [x] 2. Implementovat Database Repository Layer





  - [x] 2.1 Vytvořit base repository s běžnými CRUD operacemi

    - Implementovat connection pooling
    - Vytvořit helper funkce pro SQL queries
    - _Requirements: 1.5, 2.3_
  
  - [x] 2.2 Implementovat UserRepository


    - CRUD operace pro Users tabulku
    - Metody: findByEmail, findByGoogleId, findByClassId, create, update, delete
    - _Requirements: 1.3, 1.4, 1.5, 4.1_
  
  - [x] 2.3 Implementovat ClassRepository


    - CRUD operace pro Classes tabulku
    - Metody: findAll, findById, create, update, delete, getStudentsByClassId
    - _Requirements: 1.1, 1.2_
  


  - [x] 2.4 Implementovat AuthorRepository




    - CRUD operace pro Authors tabulku
    - Metody: findAll, findById, create, update, delete, searchByName


    - _Requirements: 2.2_
  
  - [x] 2.5 Implementovat BookRepository


    - CRUD operace pro Books tabulku s JOIN na Authors, Periods, Literary_classes
    - Metody: findAll, findById, findByFilters, create, update, delete, isUsedInReadingLists
    - _Requirements: 2.2, 2.3, 2.4, 2.5_


  
  - [x] 2.6 Implementovat LiteraryClassRepository a PeriodRepository




    - CRUD operace pro Literary_classes a Periods tabulky
    - Metody: findAll, findById, create, update, delete
    - _Requirements: 2.1_
  
  - [x] 2.7 Implementovat StudentBookRepository




    - CRUD operace pro student_book tabulku
    - Metody: findByStudentId, addBook, removeBook, getAuthorCounts, getCategoryCounts
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.1_

- [x] 3. Implementovat Authentication Module





  - [x] 3.1 Vytvořit JWT utility funkce


    - Funkce pro generování JWT tokenů
    - Funkce pro verifikaci JWT tokenů
    - _Requirements: 4.1, 4.3, 10.2_
  


  - [x] 3.2 Implementovat password hashing utility

    - Bcrypt hash funkce
    - Bcrypt compare funkce
    - Funkce pro generování náhodných hesel


    - _Requirements: 3.1, 10.1_
  
  - [x] 3.3 Vytvořit authentication middleware


    - authenticateToken middleware pro ověření JWT
    - authorizeRole middleware pro kontrolu rolí
    - _Requirements: 4.1, 10.2, 10.4_
  
  - [x] 3.4 Implementovat login endpoint

    - POST /api/auth/login - email/password autentizace
    - Validace vstupů
    - Generování JWT tokenu
    - _Requirements: 4.1, 4.2, 4.3_
  

  - [x] 3.5 Napsat property test pro authentication

    - **Property 14: Valid authentication creates session**
    - **Validates: Requirements 4.1, 4.3**
  
  - [x] 3.6 Implementovat logout endpoint


    - POST /api/auth/logout
    - Invalidace tokenu (client-side)
    - _Requirements: 4.4_
  
  - [x] 3.7 Napsat property test pro logout


    - **Property 15: Session termination on logout**
    - **Validates: Requirements 4.4**
  


  - [x] 3.8 Implementovat change password endpoint

    - POST /api/auth/change-password
    - Validace starého hesla
    - Hashování nového hesla
    - _Requirements: 3.3_

- [x] 4. Implementovat User Management Module





  - [x] 4.1 Vytvořit user controller


    - GET /api/users - seznam uživatelů (admin)
    - GET /api/users/:id - detail uživatele
    - POST /api/users - vytvoření uživatele (admin)
    - PUT /api/users/:id - aktualizace uživatele
    - DELETE /api/users/:id - smazání uživatele (admin)
    - GET /api/users/class/:classId - žáci ve třídě
    - _Requirements: 1.3, 1.5_
  
  - [x] 4.2 Napsat property test pro user creation


    - **Property 3: Student account creation completeness**
    - **Validates: Requirements 1.3**
  
  - [x] 4.3 Napsat property test pro update operations

    - **Property 5: Update operations preserve data integrity**
    - **Validates: Requirements 1.5**
  
  - [x] 4.4 Implementovat bulk registration endpoint


    - POST /api/users/bulk - hromadné vytvoření žáků
    - Podpora CSV a JSON formátů
    - Validace všech záznamů před vytvořením
    - Generování přihlašovacích údajů
    - _Requirements: 1.4, 9.1, 9.2, 9.3, 9.5_
  
  - [x] 4.5 Napsat property test pro bulk registration


    - **Property 4: Bulk student creation atomicity**
    - **Validates: Requirements 1.4**
  


  - [x] 4.6 Napsat property test pro bulk registration validation





    - **Property 35: Bulk registration validates before creation**


    - **Validates: Requirements 9.3**
  
  - [x] 4.7 Implementovat password reset endpoint
    - POST /api/users/:id/reset-password (admin)


    - Generování nového dočasného hesla
    - Vrácení hesla v odpovědi


    - _Requirements: 3.1, 3.2_
  
  - [x] 4.8 Napsat property test pro password reset
    - **Property 12: Password reset generates new credentials**
    - **Validates: Requirements 3.1**
  
  - [x] 4.9 Napsat property test pro password storage
    - **Property 37: Passwords stored as bcrypt hashes**
    - **Validates: Requirements 10.1**

- [x] 5. Implementovat Class Management Module







  - [x] 5.1 Vytvořit class controller


    - GET /api/classes - seznam tříd
    - GET /api/classes/:id - detail třídy včetně žáků
    - POST /api/classes - vytvoření třídy (admin)
    - PUT /api/classes/:id - aktualizace třídy (admin)
    - DELETE /api/classes/:id - smazání třídy (admin)
    - _Requirements: 1.1, 1.2_
  


  - [x] 5.2 Napsat property test pro class creation






    - **Property 1: Class creation persistence**


    - **Validates: Requirements 1.1**
  
  - [x] 5.3 Napsat property test pro teacher assignment





    - **Property 2: Teacher assignment updates relationship**
    - **Validates: Requirements 1.2**

- [x] 6. Implementovat Author Management Module










  - [x] 6.1 Vytvořit author controller


    - GET /api/authors - seznam autorů
    - GET /api/authors/:id - detail autora
    - POST /api/authors - vytvoření autora (admin)
    - PUT /api/authors/:id - aktualizace autora (admin)
    - DELETE /api/authors/:id - smazání autora (admin)
    - _Requirements: 2.2_

- [x] 7. Implementovat Category Management Module




  - [x] 7.1 Vytvořit literary class controller


    - GET /api/literary-classes - seznam literárních druhů
    - POST /api/literary-classes - vytvoření literárního druhu (admin)
    - PUT /api/literary-classes/:id - aktualizace (admin)
    - DELETE /api/literary-classes/:id - smazání (admin)
    - _Requirements: 2.1_
  
  - [x] 7.2 Napsat property test pro literary class creation


    - **Property 6: Literary class creation with constraints**
    - **Validates: Requirements 2.1**
  


  - [x] 7.3 Vytvořit period controller





    - GET /api/periods - seznam období
    - POST /api/periods - vytvoření období (admin)
    - PUT /api/periods/:id - aktualizace (admin)
    - DELETE /api/periods/:id - smazání (admin)


    - _Requirements: 2.1_
  
  - [x] 7.4 Napsat property test pro period creation





    - **Property 7: Period creation with constraints**
    - **Validates: Requirements 2.1**

- [x] 8. Implementovat Book Management Module





  - [x] 8.1 Vytvořit book controller


    - GET /api/books - seznam knih s filtry (literary_class, period, author)
    - GET /api/books/:id - detail knihy včetně autora
    - POST /api/books - vytvoření knihy (admin)
    - PUT /api/books/:id - aktualizace knihy (admin)
    - DELETE /api/books/:id - smazání knihy (admin)
    - _Requirements: 2.2, 2.3, 2.4, 2.5_
  
  - [x] 8.2 Napsat property test pro book creation


    - **Property 8: Book creation with author and categories**
    - **Validates: Requirements 2.2**
  
  - [x] 8.3 Napsat property test pro book update


    - **Property 9: Book update preserves references**
    - **Validates: Requirements 2.3**
  
  - [x] 8.4 Napsat property test pro book deletion


    - **Property 10: Book deletion respects usage**
    - **Validates: Requirements 2.4**
  
  - [x] 8.5 Napsat property test pro book ordering


    - **Property 11: Book list ordering by categories**
    - **Validates: Requirements 2.5**

- [x] 9. Implementovat Reading List Module




  - [x] 9.1 Vytvořit reading list service pro business logiku


    - Validace pravidla max 2 knihy od jednoho autora
    - Validace min/max požadavků pro literary_classes a periods
    - Výpočet ReadingListStatus
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [x] 9.2 Vytvořit reading list controller


    - GET /api/reading-lists/my - seznam četby aktuálního žáka
    - GET /api/reading-lists/:studentId - seznam četby žáka (admin/teacher)
    - POST /api/reading-lists/books - přidání knihy do seznamu
    - DELETE /api/reading-lists/books/:bookId - odebrání knihy
    - GET /api/reading-lists/my/status - validace seznamu
    - POST /api/reading-lists/finalize - označení jako dokončený
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [x] 9.3 Napsat property test pro adding book


    - **Property 16: Adding book updates category counts**
    - **Validates: Requirements 5.1**
  
  - [x] 9.4 Napsat property test pro removing book


    - **Property 17: Removing book updates category counts**
    - **Validates: Requirements 5.2**
  
  - [x] 9.5 Napsat property test pro reading list ordering


    - **Property 18: Reading list ordered by categories**
    - **Validates: Requirements 5.3**
  
  - [x] 9.6 Napsat property test pro persistence


    - **Property 19: Reading list changes persist immediately**
    - **Validates: Requirements 5.4**
  
  - [x] 9.7 Napsat property test pro author limit


    - **Property 20: Author limit validation**
    - **Validates: Requirements 6.1, 6.2**


  
  - [x] 9.8 Napsat property test pro category counts


    - **Property 21: Category count accuracy**
    - **Validates: Requirements 6.3**


  
  - [x] 9.9 Napsat property test pro category validation

    - **Property 22: Category requirement validation**
    - **Validates: Requirements 6.4**
  
  - [x] 9.10 Napsat property test pro finalization


    - **Property 23: Finalization requires complete categories**
    - **Validates: Requirements 6.5**

- [x] 10. Checkpoint - Ujistit se, že všechny testy procházejí




  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Implementovat PDF Generation Module





  - [x] 11.1 Nainstalovat a nakonfigurovat PDFKit nebo Puppeteer


    - Vytvořit PDF template s A4 rozměry
    - _Requirements: 7.5_
  
  - [x] 11.2 Vytvořit PDF generation service


    - Funkce pro generování PDF ze seznamu četby
    - Záhlaví: logo školy, jméno žáka (degree + name + surname), třída
    - Zápatí: datum tisku, místo pro podpisy
    - Knihy seřazené podle literary_class a period
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  
  - [x] 11.3 Vytvořit PDF endpoints


    - GET /api/reading-lists/my/pdf - PDF pro aktuálního žáka
    - GET /api/reading-lists/:studentId/pdf - PDF pro žáka (admin/teacher)
    - _Requirements: 7.1_
  
  - [x] 11.4 Napsat property test pro PDF generation


    - **Property 24: PDF generation produces document**
    - **Validates: Requirements 7.1**
  

  - [x] 11.5 Napsat property test pro PDF header

    - **Property 25: PDF contains required header elements**
    - **Validates: Requirements 7.2**
  

  - [x] 11.6 Napsat property test pro PDF footer





    - **Property 26: PDF contains required footer elements**
    - **Validates: Requirements 7.3**

  
  - [x] 11.7 Napsat property test pro PDF ordering





    - **Property 27: PDF books ordered by categories**

    - **Validates: Requirements 7.4**
  

  - [x] 11.8 Napsat property test pro PDF format




    - **Property 28: PDF formatted for A4**
    - **Validates: Requirements 7.5**

- [x] 12. Implementovat API validaci a error handling




  - [x] 12.1 Vytvořit validation middleware


    - Input validation pro všechny endpointy
    - Express-validator rules
    - _Requirements: 8.5_
  
  - [x] 12.2 Vytvořit error handling middleware


    - Centralizovaný error handler
    - Konzistentní error response format
    - HTTP status kódy
    - _Requirements: 8.3_
  
  - [x] 12.3 Napsat property test pro API responses


    - **Property 30: API responses in JSON format**
    - **Validates: Requirements 8.2**
  
  - [x] 12.4 Napsat property test pro HTTP status codes

    - **Property 31: API returns appropriate HTTP status codes**
    - **Validates: Requirements 8.3**
  
  - [x] 12.5 Napsat property test pro input validation

    - **Property 32: API validates input data**
    - **Validates: Requirements 8.5**
  
  - [x] 12.6 Napsat property test pro authentication requirement

    - **Property 39: API endpoints require authentication token**
    - **Validates: Requirements 10.4**

- [x] 13. Vytvořit API dokumentaci



  - Vytvořit OpenAPI/Swagger specifikaci
  - Dokumentovat všechny endpointy s příklady
  - Nastavit Swagger UI
  - _Requirements: 8.4_

- [x] 14. Implementovat Frontend - Login stránka



  - [x] 14.1 Vytvořit login.html


    - Formulář pro email a heslo
    - Tlačítko pro Google OAuth (připravit pro budoucí implementaci)
    - Základní styling
    - _Requirements: 4.1_
  
  - [x] 14.2 Vytvořit auth.js


    - Fetch API volání na /api/auth/login
    - Ukládání JWT tokenu do localStorage
    - Přesměrování na dashboard po úspěšném přihlášení
    - Error handling a zobrazení chybových zpráv
    - _Requirements: 4.1, 4.2_

- [x] 15. Implementovat Frontend - Shared utilities




  - [x] 15.1 Vytvořit api.js


    - Wrapper pro Fetch API
    - Automatické přidávání JWT tokenu do headers
    - Error handling
    - _Requirements: 8.1, 10.2_
  
  - [x] 15.2 Vytvořit validation.js


    - Klientská validace formulářů
    - Validační pravidla pro email, heslo, jména
    - _Requirements: 8.5_
  
  - [x] 15.3 Vytvořit utils.js


    - Pomocné funkce pro formátování dat
    - Funkce pro práci s localStorage
    - Funkce pro zobrazení notifikací

- [x] 16. Implementovat Frontend - Student Dashboard






  - [x] 16.1 Vytvořit dashboard.html

    - Navigace (můj seznam, prohlížet knihy, odhlásit se)
    - Sekce pro zobrazení seznamu četby
    - Statistiky (počty v kategoriích, autoři)
    - Tlačítko pro tisk PDF
    - _Requirements: 5.3, 6.3, 6.4_
  

  - [x] 16.2 Vytvořit dashboard.js

    - Načtení seznamu četby z API
    - Zobrazení knih seřazených podle kategorií
    - Zobrazení statistik (literary_class, period progress)
    - Zobrazení počtu knih od každého autora
    - Odebrání knihy ze seznamu
    - Generování PDF
    - _Requirements: 5.2, 5.3, 6.3, 6.4, 7.1_

- [x] 17. Implementovat Frontend - Books Browser






  - [x] 17.1 Vytvořit textbooks.html

    - Filtry (literary_class, period, autor)
    - Seznam knih s informacemi
    - Tlačítko pro přidání knihy do seznamu
    - _Requirements: 2.5_
  

  - [x] 17.2 Vytvořit textbooks.js

    - Načtení knih z API s filtry
    - Načtení literary_classes, periods, authors pro filtry
    - Přidání knihy do seznamu s validací
    - Zobrazení chybových zpráv (např. max 2 knihy od autora)
    - Real-time aktualizace dostupnosti knih
    - _Requirements: 5.1, 6.1, 6.2_

- [x] 18. Implementovat Frontend - Admin Dashboard






  - [x] 18.1 Vytvořit admin.html

    - Navigace mezi sekcemi (třídy, uživatelé, knihy, autoři, kategorie)
    - Tabulky pro zobrazení dat
    - Formuláře pro vytváření/úpravy
    - Modální okna pro potvrzení akcí
    - _Requirements: 1.1, 1.3, 2.1, 2.2_
  


  - [x] 18.2 Vytvořit admin.js - správa tříd
    - CRUD operace pro třídy
    - Přiřazení učitele ke třídě
    - Zobrazení žáků ve třídě
    - _Requirements: 1.1, 1.2_

  

  - [x] 18.3 Vytvořit admin.js - správa uživatelů
    - CRUD operace pro uživatele
    - Individuální registrace žáka
    - Hromadná registrace žáků (CSV upload)
    - Reset hesla žáka
    - _Requirements: 1.3, 1.4, 3.1, 9.1, 9.2_

  
  - [x] 18.4 Vytvořit admin.js - správa autorů

    - CRUD operace pro autory
    - Vyhledávání autorů
    - _Requirements: 2.2_
  

  - [x] 18.5 Vytvořit admin.js - správa kategorií

    - CRUD operace pro literary_classes
    - CRUD operace pro periods
    - Nastavení min/max požadavků
    - _Requirements: 2.1_
  

  - [x] 18.6 Vytvořit admin.js - správa knih

    - CRUD operace pro knihy
    - Výběr autora, literary_class, period z dropdownů
    - Validace před smazáním (kontrola použití v seznamech)
    - _Requirements: 2.2, 2.3, 2.4_

- [x] 19. Implementovat CSS styling





  - [x] 19.1 Vytvořit style.css - základní styly


    - Reset CSS
    - Typografie
    - Barevná paleta
    - Layout (grid, flexbox)
  

  - [x] 19.2 Vytvořit style.css - komponenty

    - Formuláře a inputy
    - Tlačítka
    - Tabulky
    - Modální okna
    - Notifikace
  

  - [x] 19.3 Vytvořit style.css - responzivní design

    - Media queries pro mobilní zařízení
    - Responzivní navigace
    - Responzivní tabulky

- [x] 20. Implementovat Google OAuth (volitelné rozšíření)






  - [x] 20.1 Nainstalovat passport.js a passport-google-oauth20

    - Konfigurace Google OAuth credentials
    - _Requirements: 4.1_
  

  - [x] 20.2 Implementovat OAuth endpoints

    - GET /api/auth/google - zahájení OAuth flow
    - GET /api/auth/google/callback - callback handler
    - Vytvoření/aktualizace uživatele s google_id
    - Generování JWT tokenu
    - _Requirements: 4.1, 4.3_
  
  - [x] 20.3 Aktualizovat login.html


    - Přidat funkční Google OAuth tlačítko
    - _Requirements: 4.1_


- [x] 21. Final Checkpoint - Ujistit se, že všechny testy procházejí








  - Ensure all tests pass, ask the user if questions arise.

- [ ] 22. Testování a debugging
  - Manuální testování všech funkcí
  - Testování edge cases
  - Testování na různých prohlížečích
  - Oprava nalezených bugů

- [ ] 23. Optimalizace a finální úpravy
  - Optimalizace databázových dotazů
  - Přidání indexů do databáze (pokud potřeba)
  - Minifikace CSS/JS pro produkci
  - Nastavení CORS pro produkci
  - Přidání rate limiting
  - Security audit (Helmet.js, input sanitization)
