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

## Porty

- **Frontend:** http://localhost:8080
- **Backend API:** http://localhost:3000
- **API dokumentace:** http://localhost:3000/api/docs

