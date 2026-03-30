# Povinná četba - Backend API

Backend API pro správu povinné četby.

## Požadavky

- Node.js (v14 nebo vyšší)
- MariaDB 10.11+
- npm

## Instalace

1. Nainstalujte závislosti:
```bash
npm install
```

2. Nakonfigurujte databázi:
   - Vytvořte databázi pomocí SQL souboru v `./testTest-2.sql`
   - Zkopírujte `.env.example` na `.env`
   - Upravte `.env` s vaším nastavením

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
├── services/        # Aplikační logika
├── templates/       # Předlohy
├── utils/           # Pomocné funkce
├── .env             # Environment variables
├── .env.example     # Environment variables template
├── server.js        # Entry point
└── package.json     # Dependencies
```

## API Dokumentace

### Interaktivní dokumentace (Swagger UI)
Po spuštění serveru je dostupná na: `http://localhost:3000/api/docs`

## Environment Variables

Viz `.env.example` pro kompletní seznam proměnných prostředí.

