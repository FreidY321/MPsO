# Design Document

## Overview

Webová aplikace pro správu povinné četby je full-stack aplikace postavená na Node.js backendu s Express frameworkem a vanilla JavaScript frontendem. Aplikace používá RESTful API architekturu pro komunikaci mezi frontendem a backendem, což umožňuje snadnou integraci s mobilní aplikací. Systém implementuje role-based access control (RBAC) pro rozlišení mezi adminy, učiteli a žáky. Databáze MariaDB je již vytvořena druhým členem týmu.

## Architecture

### High-Level Architecture

```
┌─────────────────┐
│  Web Frontend   │
│  (HTML/CSS/JS)  │
└────────┬────────┘
         │ HTTP/REST
         ▼
┌─────────────────┐
│   Node.js API   │
│   (Express)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  MariaDB        │
│  (MaturitniCetba│
│   database)     │
└─────────────────┘
```

### Technology Stack

**Backend:**
- Node.js s Express.js pro REST API
- mysql2 nebo mariadb npm package pro databázové připojení
- bcrypt pro hashování hesel
- jsonwebtoken (JWT) pro session management
- express-validator pro validaci vstupů
- PDFKit nebo Puppeteer pro generování PDF
- passport.js s passport-google-oauth20 pro Google OAuth

**Frontend:**
- Vanilla HTML5, CSS3, JavaScript (ES6+)
- Fetch API pro komunikaci s backendem
- LocalStorage pro ukládání JWT tokenů

**Database:**
- MariaDB 10.11.13
- Databáze: MaturitniCetba
- Charset: utf16 s czech collation

## Components and Interfaces

### Backend Components

#### 1. Authentication Module
- **Odpovědnost:** Správa přihlašování, JWT tokenů, autorizace, Google OAuth
- **Rozhraní:**
  - `POST /api/auth/login` - přihlášení uživatele (email + heslo)
  - `GET /api/auth/google` - zahájení Google OAuth flow
  - `GET /api/auth/google/callback` - callback pro Google OAuth
  - `POST /api/auth/logout` - odhlášení uživatele
  - `POST /api/auth/change-password` - změna hesla
  - `middleware: authenticateToken()` - ověření JWT tokenu
  - `middleware: authorizeRole(roles)` - kontrola role uživatele

#### 2. User Management Module
- **Odpovědnost:** Správa žáků, učitelů, adminů
- **Rozhraní:**
  - `GET /api/users` - seznam uživatelů (admin)
  - `GET /api/users/:id` - detail uživatele
  - `POST /api/users` - vytvoření uživatele (admin)
  - `POST /api/users/bulk` - hromadné vytvoření žáků (admin)
  - `PUT /api/users/:id` - aktualizace uživatele
  - `POST /api/users/:id/reset-password` - reset hesla (admin)
  - `DELETE /api/users/:id` - smazání uživatele (admin)
  - `GET /api/users/class/:classId` - žáci ve třídě

#### 3. Class Management Module
- **Odpovědnost:** Správa tříd a přiřazení učitelů
- **Rozhraní:**
  - `GET /api/classes` - seznam tříd
  - `GET /api/classes/:id` - detail třídy včetně žáků
  - `POST /api/classes` - vytvoření třídy (admin)
  - `PUT /api/classes/:id` - aktualizace třídy (admin)
  - `DELETE /api/classes/:id` - smazání třídy (admin)

#### 4. Author Management Module
- **Odpovědnost:** Správa autorů knih
- **Rozhraní:**
  - `GET /api/authors` - seznam autorů
  - `GET /api/authors/:id` - detail autora
  - `POST /api/authors` - vytvoření autora (admin)
  - `PUT /api/authors/:id` - aktualizace autora (admin)
  - `DELETE /api/authors/:id` - smazání autora (admin)

#### 5. Category Management Module
- **Odpovědnost:** Správa literárních druhů a období
- **Rozhraní:**
  - `GET /api/literary-classes` - seznam literárních druhů
  - `POST /api/literary-classes` - vytvoření literárního druhu (admin)
  - `PUT /api/literary-classes/:id` - aktualizace literárního druhu (admin)
  - `DELETE /api/literary-classes/:id` - smazání literárního druhu (admin)
  - `GET /api/periods` - seznam období
  - `POST /api/periods` - vytvoření období (admin)
  - `PUT /api/periods/:id` - aktualizace období (admin)
  - `DELETE /api/periods/:id` - smazání období (admin)

#### 6. Book Management Module
- **Odpovědnost:** Správa knih
- **Rozhraní:**
  - `GET /api/books` - seznam knih s filtry (literární druh, období, autor)
  - `GET /api/books/:id` - detail knihy včetně autora
  - `POST /api/books` - vytvoření knihy (admin)
  - `PUT /api/books/:id` - aktualizace knihy (admin)
  - `DELETE /api/books/:id` - smazání knihy (admin)

#### 7. Reading List Module
- **Odpovědnost:** Správa seznamů četby žáků, validace pravidel
- **Rozhraní:**
  - `GET /api/reading-lists/my` - seznam četby aktuálního žáka
  - `GET /api/reading-lists/:studentId` - seznam četby žáka (admin/teacher)
  - `POST /api/reading-lists/books` - přidání knihy do seznamu
  - `DELETE /api/reading-lists/books/:bookId` - odebrání knihy ze seznamu
  - `GET /api/reading-lists/my/status` - validace seznamu proti pravidlům
  - `POST /api/reading-lists/finalize` - označení seznamu jako dokončený

#### 8. PDF Generation Module
- **Odpovědnost:** Generování PDF dokumentů se seznamy četby
- **Rozhraní:**
  - `GET /api/reading-lists/my/pdf` - generování PDF pro aktuálního žáka
  - `GET /api/reading-lists/:studentId/pdf` - generování PDF pro žáka (admin/teacher)

#### 9. Database Repository Layer
- **Odpovědnost:** Abstrakce nad MariaDB databází
- **Rozhraní:**
  - `UserRepository` - CRUD operace pro Users
  - `ClassRepository` - CRUD operace pro Classes
  - `AuthorRepository` - CRUD operace pro Authors
  - `BookRepository` - CRUD operace pro Books
  - `LiteraryClassRepository` - CRUD operace pro Literary_classes
  - `PeriodRepository` - CRUD operace pro Periods
  - `StudentBookRepository` - CRUD operace pro student_book

### Frontend Components

#### 1. Authentication Pages
- `login.html` - přihlašovací stránka s Google OAuth tlačítkem
- `auth.js` - logika pro přihlášení, ukládání JWT

#### 2. Admin Dashboard
- `admin.html` - hlavní stránka admina
- `admin.js` - správa tříd, učitelů, žáků, knih, autorů, kategorií

#### 3. Student Dashboard
- `dashboard.html` - hlavní stránka žáka
- `dashboard.js` - zobrazení a správa seznamu četby, statistiky

#### 4. Books Browser
- `textbooks.html` - prohlížení dostupných knih
- `textbooks.js` - filtrování podle literárního druhu, období, autora

#### 5. Shared Components
- `api.js` - wrapper pro Fetch API s JWT autentizací
- `validation.js` - klientská validace formulářů
- `utils.js` - pomocné funkce

## Data Models

Tyto modely odpovídají existujícímu databázovému schématu.

### User (tabulka: Users)
```javascript
{
  id: number,
  role: 'student' | 'teacher' | 'admin',
  degree: string | null,           // Titul (např. Mgr., Ing.)
  name: string,
  seccond_name: string | null,     // Druhé jméno
  surname: string,
  second_surname: string | null,
  email: string,
  class_id: number | null,
  password: string | null,         // Bcrypt hash
  google_id: string | null         // Pro Google OAuth
}
```

### Class (tabulka: Classes)
```javascript
{
  id: number,
  name: string,                    // Např. "4.A"
  year_ended: number,              // Rok maturity
  deadline: datetime | null,       // Deadline pro odevzdání seznamů
  cj_teacher: number | null        // ID učitele češtiny (FK na Users)
}
```

### Author (tabulka: Authors)
```javascript
{
  id: number,
  name: string,
  second_name: string | null,
  surname: string,
  second_surname: string | null
}
```

### Literary_class (tabulka: Literary_classes)
```javascript
{
  id: number,
  name: string,                    // Např. "Česká literatura", "Světová literatura"
  min_request: number,             // Minimální počet knih
  max_request: number              // Maximální počet knih
}
```

### Period (tabulka: Periods)
```javascript
{
  id: number,
  name: string,                    // Např. "Starověk a středověk", "19. století"
  min_request: number,             // Minimální počet knih
  max_request: number              // Maximální počet knih
}
```

### Book (tabulka: Books)
```javascript
{
  id: number,
  name: string,
  url_book: string,                // URL k informacím o knize
  author_id: number,               // FK na Authors
  translator_name: string,         // Jméno překladatele (pokud je překlad)
  period: number,                  // FK na Periods
  literary_class: number           // FK na Literary_classes
}
```

### StudentBook (tabulka: student_book)
```javascript
{
  id_student: number,              // FK na Users (composite PK)
  id_book: number,                 // FK na Books (composite PK)
  when_added: datetime             // Kdy byla kniha přidána
}
```

### ReadingListStatus (computed/derived)
```javascript
{
  studentId: number,
  totalBooks: number,
  literaryClassProgress: [
    {
      id: number,
      name: string,
      currentCount: number,
      minRequired: number,
      maxAllowed: number,
      isSatisfied: boolean,
      isOverLimit: boolean
    }
  ],
  periodProgress: [
    {
      id: number,
      name: string,
      currentCount: number,
      minRequired: number,
      maxAllowed: number,
      isSatisfied: boolean,
      isOverLimit: boolean
    }
  ],
  authorCounts: {
    [authorId: number]: {
      fullName: string,
      count: number,
      canAddMore: boolean
    }
  },
  isComplete: boolean,             // Všechny kategorie splněny
  violations: string[]             // Seznam porušení pravidel
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Class creation persistence
*For any* valid class data with name, year, deadline and assigned teacher, creating the class should result in the class being stored with all provided attributes accessible via retrieval.
**Validates: Requirements 1.1**

### Property 2: Teacher assignment updates relationship
*For any* existing class and teacher, assigning the teacher to the class should result in the cj_teacher field being updated correctly.
**Validates: Requirements 1.2**

### Property 3: Student account creation completeness
*For any* valid student data, creating a student account should result in a user with email, hashed password and correct class assignment.
**Validates: Requirements 1.3**

### Property 4: Bulk student creation atomicity
*For any* list of valid student records, bulk creation should result in all students being created with correct class assignments or none if any validation fails.
**Validates: Requirements 1.4**

### Property 5: Update operations preserve data integrity
*For any* entity (class, teacher, student) and valid update data, updating the entity should preserve all unchanged fields and correctly update specified fields.
**Validates: Requirements 1.5**

### Property 6: Literary class creation with constraints
*For any* valid literary class data with name, min_request and max_request, creating the literary class should store all attributes correctly.
**Validates: Requirements 2.1**

### Property 7: Period creation with constraints
*For any* valid period data with name, min_request and max_request, creating the period should store all attributes correctly.
**Validates: Requirements 2.1**

### Property 8: Book creation with author and categories
*For any* valid book data with name, author_id, period, literary_class, url_book and translator_name, creating the book should store all attributes and establish relationships.
**Validates: Requirements 2.2**

### Property 9: Book update preserves references
*For any* existing book and valid update data, updating the book should preserve all student_book references while updating the specified fields.
**Validates: Requirements 2.3**

### Property 10: Book deletion respects usage
*For any* book, deletion should succeed only if the book is not referenced in the student_book table.
**Validates: Requirements 2.4**

### Property 11: Book list ordering by categories
*For any* set of books, retrieving the book list should return all books ordered by their literary_class and period.
**Validates: Requirements 2.5**

### Property 12: Password reset generates new credentials
*For any* student account, resetting the password should generate a new temporary bcrypt hashed password.
**Validates: Requirements 3.1**

### Property 13: Password reset returns new password
*For any* password reset operation, the system should return the newly generated plain text password in the response before hashing.
**Validates: Requirements 3.2**

### Property 14: Valid authentication creates session
*For any* valid email and password combination, successful authentication should create a valid JWT session token.
**Validates: Requirements 4.1, 4.3**

### Property 15: Session termination on logout
*For any* authenticated user, logging out should invalidate the session token.
**Validates: Requirements 4.4**

### Property 16: Adding book updates category counts
*For any* student reading list and book, adding the book should increment the count for the book's literary_class and period by exactly one.
**Validates: Requirements 5.1**

### Property 17: Removing book updates category counts
*For any* student reading list containing a book, removing the book should decrement the count for the book's literary_class and period by exactly one.
**Validates: Requirements 5.2**

### Property 18: Reading list ordered by categories
*For any* student reading list, retrieving the list should return all books ordered by their literary_class and period.
**Validates: Requirements 5.3**

### Property 19: Reading list changes persist immediately
*For any* modification to student_book table, querying the list immediately after should reflect the change.
**Validates: Requirements 5.4**

### Property 20: Author limit validation
*For any* student reading list and book, if the list already contains two books by the same author (author_id), attempting to add a third book by that author should be rejected.
**Validates: Requirements 6.1, 6.2**

### Property 21: Category count accuracy
*For any* student reading list, the displayed literary_class and period counts should equal the actual number of books in each category.
**Validates: Requirements 6.3**

### Property 22: Category requirement validation
*For any* student reading list, the system should correctly identify which literary_classes and periods do not meet their min_request requirements.
**Validates: Requirements 6.4**

### Property 23: Finalization requires complete categories
*For any* student reading list, finalization should succeed only if all literary_classes and periods meet their min_request and do not exceed max_request.
**Validates: Requirements 6.5**

### Property 24: PDF generation produces document
*For any* student reading list, requesting PDF generation should produce a valid PDF document.
**Validates: Requirements 7.1**

### Property 25: PDF contains required header elements
*For any* generated PDF, the document should contain school logo, student full name (degree + name + surname), and class name in the header.
**Validates: Requirements 7.2**

### Property 26: PDF contains required footer elements
*For any* generated PDF, the document should contain print date and signature space in the footer.
**Validates: Requirements 7.3**

### Property 27: PDF books ordered by categories
*For any* generated PDF, all books should be displayed ordered by literary_class and period.
**Validates: Requirements 7.4**

### Property 28: PDF formatted for A4
*For any* generated PDF, the document dimensions should conform to A4 paper size (210mm x 297mm).
**Validates: Requirements 7.5**

### Property 29: API authentication validation
*For any* API request with valid JWT authentication token, the system should process the request and return requested data.
**Validates: Requirements 8.1**

### Property 30: API responses in JSON format
*For any* API endpoint response, the content type should be application/json and the body should be valid JSON.
**Validates: Requirements 8.2**

### Property 31: API returns appropriate HTTP status codes
*For any* API request, the response should include an HTTP status code that correctly represents the outcome (2xx for success, 4xx for client errors, 5xx for server errors).
**Validates: Requirements 8.3**

### Property 32: API validates input data
*For any* API request with invalid input data, the system should reject the request and return validation errors.
**Validates: Requirements 8.5**

### Property 33: Individual registration creates single account
*For any* valid student data submitted via individual registration, exactly one student account should be created in Users table.
**Validates: Requirements 9.1**

### Property 34: Bulk registration accepts multiple formats
*For any* valid CSV file or JSON array of student data, the bulk registration endpoint should accept and process the data.
**Validates: Requirements 9.2**

### Property 35: Bulk registration validates before creation
*For any* bulk registration request, all records should be validated before any accounts are created in Users table.
**Validates: Requirements 9.3**

### Property 36: Bulk registration generates credentials
*For any* successful bulk registration, the system should generate unique email and password for each student and return them in the response.
**Validates: Requirements 9.5**

### Property 37: Passwords stored as bcrypt hashes
*For any* user account in Users table, the password field should contain a bcrypt hash, not the plain text password.
**Validates: Requirements 10.1**

### Property 38: Protected resources require valid session
*For any* request to a protected resource, the system should verify the JWT token before granting access.
**Validates: Requirements 10.2**

### Property 39: API endpoints require authentication token
*For any* API endpoint (except login and OAuth callbacks), requests without a valid JWT authentication token should be rejected.
**Validates: Requirements 10.4**