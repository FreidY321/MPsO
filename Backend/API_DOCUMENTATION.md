# Povinná Četba API Documentation

## Přehled

API pro správu povinné četby poskytuje kompletní rozhraní pro evidenci a validaci seznamů četby žáků. Systém podporuje správu uživatelů, tříd, knih, autorů a seznamů četby s automatickou validací pravidel maturitní zkoušky.

**Base URL:** `http://localhost:3000/api`

**Interaktivní dokumentace:** `http://localhost:3000/api/docs`

## Autentizace

API používá JWT (JSON Web Token) pro autentizaci. Token získáte přihlášením přes `/api/auth/login` a následně ho přidáváte do hlavičky každého požadavku:

```
Authorization: Bearer <your-jwt-token>
```

### Role uživatelů

- **admin** - Plný přístup ke všem endpointům
- **teacher** - Přístup k zobrazení dat tříd a žáků
- **student** - Přístup k vlastnímu seznamu četby

## Endpointy

### Authentication

#### POST /api/auth/login
Přihlášení uživatele pomocí emailu a hesla.

**Request Body:**
```json
{
  "email": "jan.novak@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "role": "student",
    "name": "Jan",
    "surname": "Novák",
    "email": "jan.novak@example.com"
  }
}
```

#### POST /api/auth/logout
Odhlášení uživatele (token se maže na klientovi).

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### POST /api/auth/change-password
Změna hesla přihlášeného uživatele.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "oldPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

#### GET /api/auth/google
Zahájení Google OAuth flow. Přesměruje na Google přihlašovací stránku.

**Note:** Tento endpoint se volá přesměrováním prohlížeče, ne pomocí fetch/axios.

**Usage:**
```javascript
window.location.href = 'http://localhost:3000/api/auth/google';
```

#### GET /api/auth/google/callback
Callback endpoint pro Google OAuth. Zpracuje autentizaci a přesměruje zpět na frontend.

**Note:** Tento endpoint je volán automaticky Googlem po úspěšné autentizaci.

**Success Redirect:**
```
http://localhost:8080/pages/login.html?token=<jwt-token>
```

**Error Redirect:**
```
http://localhost:8080/pages/login.html?error=<error-message>
```

---

### Users

#### GET /api/users
Seznam všech uživatelů (pouze admin).

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "id": 1,
      "role": "student",
      "name": "Jan",
      "surname": "Novák",
      "email": "jan.novak@example.com",
      "class_id": 1
    }
  ]
}
```

#### GET /api/users/:id
Detail konkrétního uživatele.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "role": "student",
    "degree": null,
    "name": "Jan",
    "seccond_name": null,
    "surname": "Novák",
    "second_surname": null,
    "email": "jan.novak@example.com",
    "class_id": 1,
    "google_id": null
  }
}
```

#### POST /api/users
Vytvoření nového uživatele (pouze admin).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "role": "student",
  "name": "Petr",
  "surname": "Svoboda",
  "email": "petr.svoboda@example.com",
  "password": "password123",
  "class_id": 1
}
```

#### POST /api/users/bulk
Hromadná registrace žáků (pouze admin).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "class_id": 1,
  "students": [
    {
      "name": "Jan",
      "surname": "Novák",
      "email": "jan.novak@example.com"
    },
    {
      "name": "Petr",
      "surname": "Svoboda",
      "email": "petr.svoboda@example.com"
    }
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "2 students created successfully",
  "data": [
    {
      "id": 1,
      "email": "jan.novak@example.com",
      "password": "generované-heslo-1"
    },
    {
      "id": 2,
      "email": "petr.svoboda@example.com",
      "password": "generované-heslo-2"
    }
  ]
}
```

#### POST /api/users/:id/reset-password
Reset hesla žáka (pouze admin).

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset successfully",
  "newPassword": "nové-generované-heslo"
}
```

#### PUT /api/users/:id
Aktualizace údajů uživatele.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Jan",
  "surname": "Novák",
  "email": "jan.novak@example.com"
}
```

#### DELETE /api/users/:id
Smazání uživatele (pouze admin).

**Headers:** `Authorization: Bearer <token>`

---

### Classes

#### GET /api/classes
Seznam všech tříd.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": 1,
      "name": "4.A",
      "year_ended": 2024,
      "deadline": "2024-05-31T23:59:59Z",
      "cj_teacher": 2
    }
  ]
}
```

#### GET /api/classes/:id
Detail třídy včetně seznamu žáků.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "4.A",
    "year_ended": 2024,
    "deadline": "2024-05-31T23:59:59Z",
    "cj_teacher": 2,
    "students": [
      {
        "id": 1,
        "name": "Jan",
        "surname": "Novák",
        "email": "jan.novak@example.com"
      }
    ]
  }
}
```

#### POST /api/classes
Vytvoření nové třídy (pouze admin).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "4.B",
  "year_ended": 2024,
  "deadline": "2024-05-31T23:59:59Z",
  "cj_teacher": 2
}
```

#### PUT /api/classes/:id
Aktualizace třídy (pouze admin).

#### DELETE /api/classes/:id
Smazání třídy (pouze admin).

---

### Authors

#### GET /api/authors
Seznam všech autorů.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "count": 50,
  "data": [
    {
      "id": 1,
      "name": "Karel",
      "second_name": null,
      "surname": "Čapek",
      "second_surname": null
    }
  ]
}
```

#### GET /api/authors/:id
Detail autora.

#### POST /api/authors
Vytvoření nového autora (pouze admin).

**Request Body:**
```json
{
  "name": "Karel",
  "surname": "Čapek"
}
```

#### PUT /api/authors/:id
Aktualizace autora (pouze admin).

#### DELETE /api/authors/:id
Smazání autora (pouze admin).

---

### Literary Classes (Literární druhy)

#### GET /api/literary-classes
Seznam všech literárních druhů.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": 1,
      "name": "Česká literatura",
      "min_request": 5,
      "max_request": 10
    },
    {
      "id": 2,
      "name": "Světová literatura",
      "min_request": 5,
      "max_request": 10
    }
  ]
}
```

#### POST /api/literary-classes
Vytvoření nového literárního druhu (pouze admin).

**Request Body:**
```json
{
  "name": "Česká literatura",
  "min_request": 5,
  "max_request": 10
}
```

#### PUT /api/literary-classes/:id
Aktualizace literárního druhu (pouze admin).

#### DELETE /api/literary-classes/:id
Smazání literárního druhu (pouze admin).

---

### Periods (Literární období)

#### GET /api/periods
Seznam všech literárních období.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "count": 8,
  "data": [
    {
      "id": 1,
      "name": "Starověk a středověk",
      "min_request": 2,
      "max_request": 5
    },
    {
      "id": 2,
      "name": "19. století",
      "min_request": 3,
      "max_request": 8
    }
  ]
}
```

#### POST /api/periods
Vytvoření nového období (pouze admin).

#### PUT /api/periods/:id
Aktualizace období (pouze admin).

#### DELETE /api/periods/:id
Smazání období (pouze admin).

---

### Books

#### GET /api/books
Seznam všech knih s možností filtrování.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `literary_class` (integer, optional) - Filtr podle literárního druhu
- `period` (integer, optional) - Filtr podle období
- `author_id` (integer, optional) - Filtr podle autora

**Response (200):**
```json
{
  "success": true,
  "count": 100,
  "data": [
    {
      "id": 1,
      "name": "R.U.R.",
      "url_book": "https://example.com/book/rur",
      "author_id": 1,
      "translator_name": "",
      "period": 3,
      "literary_class": 1,
      "author_name": "Karel Čapek",
      "period_name": "20. století",
      "literary_class_name": "Česká literatura"
    }
  ]
}
```

#### GET /api/books/:id
Detail knihy včetně informací o autorovi.

**Headers:** `Authorization: Bearer <token>`

#### POST /api/books
Vytvoření nové knihy (pouze admin).

**Request Body:**
```json
{
  "name": "R.U.R.",
  "url_book": "https://example.com/book/rur",
  "author_id": 1,
  "translator_name": "",
  "period": 3,
  "literary_class": 1
}
```

#### PUT /api/books/:id
Aktualizace knihy (pouze admin).

#### DELETE /api/books/:id
Smazání knihy (pouze admin). Knihu nelze smazat, pokud je použita v nějakém seznamu četby.

---

### Reading Lists (Seznamy četby)

#### GET /api/reading-lists/my
Seznam četby přihlášeného žáka.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "count": 15,
  "data": [
    {
      "id": 1,
      "name": "R.U.R.",
      "author_name": "Karel Čapek",
      "period_name": "20. století",
      "literary_class_name": "Česká literatura",
      "when_added": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### GET /api/reading-lists/:studentId
Seznam četby konkrétního žáka (admin/teacher).

**Headers:** `Authorization: Bearer <token>`

#### GET /api/reading-lists/my/status
Validační stav seznamu četby s počty v kategoriích.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "studentId": 1,
    "totalBooks": 15,
    "literaryClassProgress": [
      {
        "id": 1,
        "name": "Česká literatura",
        "currentCount": 7,
        "minRequired": 5,
        "maxAllowed": 10,
        "isSatisfied": true,
        "isOverLimit": false
      }
    ],
    "periodProgress": [
      {
        "id": 2,
        "name": "19. století",
        "currentCount": 4,
        "minRequired": 3,
        "maxAllowed": 8,
        "isSatisfied": true,
        "isOverLimit": false
      }
    ],
    "authorCounts": {
      "1": {
        "fullName": "Karel Čapek",
        "count": 2,
        "canAddMore": false
      }
    },
    "isComplete": true,
    "violations": []
  }
}
```

#### POST /api/reading-lists/books
Přidání knihy do seznamu četby.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "book_id": 1
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Book added to reading list"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": {
    "message": "Cannot add more than 2 books from the same author",
    "statusCode": 400
  }
}
```

#### DELETE /api/reading-lists/books/:bookId
Odebrání knihy ze seznamu četby.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Book removed from reading list"
}
```

#### POST /api/reading-lists/finalize
Označení seznamu jako dokončený (pouze pokud splňuje všechny požadavky).

**Headers:** `Authorization: Bearer <token>`

#### GET /api/reading-lists/my/pdf
Vygenerování PDF dokumentu se seznamem četby.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
- Content-Type: `application/pdf`
- Binární data PDF dokumentu

#### GET /api/reading-lists/:studentId/pdf
Vygenerování PDF pro konkrétního žáka (admin/teacher).

**Headers:** `Authorization: Bearer <token>`

---

## Chybové kódy

API používá standardní HTTP status kódy:

- **200 OK** - Požadavek byl úspěšný
- **201 Created** - Zdroj byl úspěšně vytvořen
- **400 Bad Request** - Chyba validace vstupních dat
- **401 Unauthorized** - Chybí nebo je neplatný autentizační token
- **403 Forbidden** - Nedostatečná oprávnění
- **404 Not Found** - Zdroj nebyl nalezen
- **409 Conflict** - Konflikt (např. duplicitní email)
- **500 Internal Server Error** - Chyba serveru

### Formát chybové odpovědi

```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "statusCode": 400,
    "validationErrors": [
      {
        "field": "email",
        "message": "Valid email is required",
        "value": "invalid-email"
      }
    ]
  }
}
```

## Validační pravidla

### Pravidla pro seznamy četby

1. **Maximum 2 knihy od jednoho autora** - Žák nemůže mít více než 2 knihy od stejného autora
2. **Minimální počty v kategoriích** - Každý literární druh a období má definovaný minimální počet knih
3. **Maximální počty v kategoriích** - Každý literární druh a období má definovaný maximální počet knih
4. **Dokončení seznamu** - Seznam lze označit jako dokončený pouze pokud splňuje všechny minimální a maximální požadavky

### Validace vstupů

- **Email** - Musí být platný email formát
- **Heslo** - Minimálně 8 znaků
- **Role** - Pouze `student`, `teacher`, nebo `admin`
- **Povinná pole** - `name`, `surname`, `email` pro uživatele

## Příklady použití

### Přihlášení a získání tokenu

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jan.novak@example.com",
    "password": "password123"
  }'
```

### Získání seznamu knih s filtrem

```bash
curl -X GET "http://localhost:3000/api/books?literary_class=1&period=3" \
  -H "Authorization: Bearer <your-token>"
```

### Přidání knihy do seznamu četby

```bash
curl -X POST http://localhost:3000/api/reading-lists/books \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "book_id": 1
  }'
```

### Stažení PDF seznamu četby

```bash
curl -X GET http://localhost:3000/api/reading-lists/my/pdf \
  -H "Authorization: Bearer <your-token>" \
  --output reading-list.pdf
```

## Rate Limiting

Aktuálně není implementován rate limiting. V produkčním prostředí doporučujeme implementovat rate limiting pro ochranu API.

## CORS

API podporuje CORS pro všechny originy v development módu. V produkci nastavte `CORS_ORIGIN` v `.env` souboru.

## Kontakt

Pro podporu a dotazy kontaktujte: support@example.com
