# Jak spustit aplikaci

## Rychlý start

### 1. Spusťte Backend server

Otevřete terminál a spusťte:

```bash
cd Backend
node server.js
```

Měli byste vidět:
```
Database connected successfully
✓ Server running on port 3000
✓ Environment: development
✓ API available at http://localhost:3000/api
```

### 2. Spusťte Frontend server

Otevřete **nový** terminál a spusťte:

```bash
cd Frontend
node server.js
```

Měli byste vidět:
```
Frontend server running at http://localhost:8080/
Login page: http://localhost:8080/pages/login.html
```

### 3. Otevřete aplikaci v prohlížeči

Otevřete: **http://localhost:8080/pages/login.html**

## Přihlášení

Pro přihlášení potřebujete účet v databázi. Pokud ještě nemáte žádný účet, můžete:

1. Vytvořit účet přes API (pokud máte admin přístup)
2. Vložit testovací účet přímo do databáze
3. Použít existující účet

### Testovací účet (pokud existuje v databázi)

Zkuste se přihlásit s údaji, které máte v databázi v tabulce `Users`.

## Řešení problémů

### "Chyba připojení k serveru"

**Příčina:** Backend server neběží nebo běží na jiném portu.

**Řešení:**
1. Zkontrolujte, že backend běží: `cd Backend && node server.js`
2. Zkontrolujte, že běží na portu 3000
3. Zkontrolujte konzoli prohlížeče (F12) pro detaily chyby

### "Port already in use"

**Příčina:** Port 3000 nebo 8080 je již obsazený.

**Řešení:**
1. Ukončete proces, který port používá
2. Nebo změňte port v konfiguraci

### "Cannot connect to database"

**Příčina:** MariaDB neběží nebo špatné přihlašovací údaje.

**Řešení:**
1. Zkontrolujte, že MariaDB běží
2. Zkontrolujte `Backend/.env` soubor
3. Ověřte přihlašovací údaje k databázi

## Porty

- **Frontend:** http://localhost:8080
- **Backend API:** http://localhost:3000
- **API dokumentace:** http://localhost:3000/api/docs

## Poznámky

- Frontend **musí** běžet přes HTTP server (ne jako soubory)
- CORS je nakonfigurován pro http://localhost:8080
- JWT tokeny se ukládají do localStorage
- Pro vývoj používejte Chrome/Firefox s otevřenou konzolí (F12)

