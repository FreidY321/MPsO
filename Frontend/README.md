# Povinná četba - Frontend

Frontend aplikace pro správu povinné četby.

## Struktura

```
Frontend/
├── pages/              # HTML stránky
│   ├── login.html     # Přihlašovací stránka
│   ├── dashboard.html # Dashboard žáka
│   ├── admin.html     # Admin rozhraní
│   └── textbooks.html # Prohlížení knih
├── public/
│   ├── css/
│   │   └── style.css  # Styly
│   └── js/
│       ├── auth.js    # Autentizace
│       └── main.js    # Hlavní JavaScript
└── index.html         # Hlavní stránka
```

## Spuštění

Frontend musí běžet přes HTTP server (ne jako soubory) kvůli komunikaci s backend API.

### Doporučený způsob - Node.js server (již připraven)

```bash
cd Frontend
node server.js
```

Frontend bude dostupný na:
- **Hlavní URL:** http://localhost:8080/
- **Login stránka:** http://localhost:8080/pages/login.html
- **Test utilities:** http://localhost:8080/test-utilities.html

### Alternativní způsoby

#### 1. Pomocí Live Server (VS Code)

1. Nainstalujte rozšíření "Live Server"
2. Klikněte pravým tlačítkem na `index.html`
3. Vyberte "Open with Live Server"

#### 2. Pomocí Python HTTP serveru

```bash
# Python 3
python -m http.server 8080

# Nebo Python 2
python -m SimpleHTTPServer 8080
```

#### 3. Pomocí npx http-server

```bash
npx http-server -p 8080
```

### Backend server

Nezapomeňte spustit také backend:

```bash
cd Backend
node server.js
```

Backend API běží na http://localhost:3000/api

## Přihlašovací stránka

### Funkce

- **Email/heslo přihlášení** - Plně funkční autentizace přes API
- **Google OAuth** - Připraveno pro budoucí implementaci (tlačítko je zatím neaktivní)
- **Automatické přesměrování** - Po úspěšném přihlášení podle role:
  - Admin → `admin.html`
  - Teacher → `admin.html`
  - Student → `dashboard.html`
- **Ukládání JWT tokenu** - Token se ukládá do localStorage
- **Validace formuláře** - Kontrola emailu a hesla
- **Zobrazení chyb** - Uživatelsky přívětivé chybové zprávy

### Testování

Pro testování přihlášení potřebujete:

1. **Běžící backend API** na `http://localhost:3000`
2. **Testovací účet** v databázi

Příklad vytvoření testovacího účtu (přes API nebo přímo v databázi):
```sql
INSERT INTO Users (role, name, surname, email, password) 
VALUES ('student', 'Test', 'User', 'test@example.com', '<bcrypt-hash>');
```

Nebo použijte admin účet k vytvoření uživatelů přes API.

## API Konfigurace

API URL je nastaveno v `public/js/auth.js`:

```javascript
const API_BASE_URL = 'http://localhost:3000/api';
```

Pro produkci změňte na vaši produkční URL.

## Bezpečnost

- JWT token je uložen v `localStorage`
- Token se automaticky přidává do všech API požadavků
- Po odhlášení se token maže
- Hesla se nikdy neukládají na klientovi

## Další kroky

Po implementaci login stránky následují:
1. Dashboard pro žáky
2. Prohlížení knih
3. Admin rozhraní
4. Správa seznamů četby

## Poznámky

- Frontend je responzivní a funguje na mobilních zařízeních
- Používá moderní CSS (flexbox, grid)
- Vanilla JavaScript bez frameworků
- Připraveno pro Google OAuth integraci
