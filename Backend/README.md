# Povinná četba - Backend API

Backend API pro správu povinné četby.

## Požadavky

- Node.js (v14 nebo vyšší)
- MariaDB 10.11+
- npm nebo yarn

## Instalace

1. Nainstalujte závislosti:
```bash
npm install
```

2. Nakonfigurujte databázi:
   - Vytvořte databázi pomocí SQL souboru v `../Frontend/testTest-2.sql`
   - Zkopírujte `.env.example` na `.env`
   - Upravte `.env` s vašimi databázovými přihlašovacími údaji

3. Spusťte server:
```bash
# Development mode s auto-reload
npm run dev

# Production mode
npm start
```

## Struktura projektu

```
Backend/
├── config/          # Konfigurace (databáze, atd.)
├── controllers/     # Request handlers
├── middleware/      # Express middleware
├── repositories/    # Databázová vrstva
├── routes/          # API routes
├── utils/           # Pomocné funkce
├── .env             # Environment variables
├── .env.example     # Environment variables template
├── server.js        # Entry point
└── package.json     # Dependencies
```

## API Dokumentace

### Interaktivní dokumentace (Swagger UI)
Po spuštění serveru je dostupná na: `http://localhost:3000/api/docs`

### Markdown dokumentace
Kompletní dokumentace všech endpointů je v souboru [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

### Hlavní endpointy

#### Authentication
- `POST /api/auth/login` - Přihlášení
- `POST /api/auth/logout` - Odhlášení
- `POST /api/auth/change-password` - Změna hesla

#### Users
- `GET /api/users` - Seznam uživatelů (admin)
- `POST /api/users` - Vytvoření uživatele (admin)
- `POST /api/users/bulk` - Hromadná registrace žáků (admin)
- `POST /api/users/:id/reset-password` - Reset hesla (admin)

#### Classes
- `GET /api/classes` - Seznam tříd
- `POST /api/classes` - Vytvoření třídy (admin)

#### Books
- `GET /api/books` - Seznam knih (s filtry)
- `POST /api/books` - Vytvoření knihy (admin)

#### Reading Lists
- `GET /api/reading-lists/my` - Můj seznam četby
- `GET /api/reading-lists/my/status` - Stav mého seznamu
- `POST /api/reading-lists/books` - Přidání knihy
- `DELETE /api/reading-lists/books/:bookId` - Odebrání knihy
- `GET /api/reading-lists/my/pdf` - PDF seznam četby

#### Authors, Literary Classes, Periods
- `GET /api/authors` - Seznam autorů
- `GET /api/literary-classes` - Seznam literárních druhů
- `GET /api/periods` - Seznam období

Pro kompletní dokumentaci všech endpointů včetně příkladů viz [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) nebo Swagger UI na `/api/docs`.

## Environment Variables

Viz `.env.example` pro kompletní seznam proměnných prostředí.

## Bezpečnost

- Hesla jsou hashována pomocí bcrypt
- JWT tokeny pro autentizaci
- CORS konfigurace
- Input validace pomocí express-validator
