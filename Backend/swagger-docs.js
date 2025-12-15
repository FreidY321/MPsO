/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     description: Kontrola, zda API běží
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API běží správně
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 message:
 *                   type: string
 *                   example: API is running
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Přihlášení uživatele
 *     description: Autentizace pomocí emailu a hesla, vrací JWT token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: jan.novak@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *     responses:
 *       200:
 *         description: Úspěšné přihlášení
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Neplatné přihlašovací údaje
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Odhlášení uživatele
 *     description: Odhlášení (token se maže na klientovi)
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Úspěšné odhlášení
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Logged out successfully
 */

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Změna hesla
 *     description: Změna hesla přihlášeného uživatele
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 format: password
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Heslo úspěšně změněno
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */

/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Google OAuth přihlášení
 *     description: Zahájení Google OAuth flow - přesměruje na Google přihlašovací stránku
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Přesměrování na Google OAuth
 */

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     description: Callback endpoint pro Google OAuth - zpracuje autentizaci a přesměruje na frontend
 *     tags: [Authentication]
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         description: Authorization code od Google
 *     responses:
 *       302:
 *         description: Přesměrování na frontend s tokenem nebo chybou
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Seznam všech uživatelů
 *     description: Získání seznamu všech uživatelů (pouze admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Seznam uživatelů
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 10
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *   post:
 *     summary: Vytvoření nového uživatele
 *     description: Vytvoření nového uživatele (pouze admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *               - name
 *               - surname
 *               - email
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [student, teacher, admin]
 *               degree:
 *                 type: string
 *               name:
 *                 type: string
 *               second_name:
 *                 type: string
 *               surname:
 *                 type: string
 *               second_surname:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               class_id:
 *                 type: integer
 *               google_id:
 *                 type: string
 *     responses:
 *       201:
 *         description: Uživatel vytvořen
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Detail uživatele
 *     description: Získání detailu uživatele podle ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID uživatele
 *     responses:
 *       200:
 *         description: Detail uživatele
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *   put:
 *     summary: Aktualizace uživatele
 *     description: Aktualizace údajů uživatele
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               degree:
 *                 type: string
 *               name:
 *                 type: string
 *               second_name:
 *                 type: string
 *               surname:
 *                 type: string
 *               second_surname:
 *                 type: string
 *               email:
 *                 type: string
 *               class_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Uživatel aktualizován
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   delete:
 *     summary: Smazání uživatele
 *     description: Smazání uživatele (pouze admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Uživatel smazán
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /api/users/bulk:
 *   post:
 *     summary: Hromadná registrace žáků
 *     description: Vytvoření více žáků najednou (pouze admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - students
 *               - class_id
 *             properties:
 *               students:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                     - surname
 *                     - email
 *                   properties:
 *                     degree:
 *                       type: string
 *                     name:
 *                       type: string
 *                     second_name:
 *                       type: string
 *                     surname:
 *                       type: string
 *                     second_surname:
 *                       type: string
 *                     email:
 *                       type: string
 *               class_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Žáci vytvořeni
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /api/users/{id}/reset-password:
 *   post:
 *     summary: Reset hesla žáka
 *     description: Vygenerování nového hesla pro žáka (pouze admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Heslo resetováno
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 newPassword:
 *                   type: string
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /api/classes:
 *   get:
 *     summary: Seznam tříd
 *     description: Získání seznamu všech tříd
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Seznam tříd
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Class'
 *   post:
 *     summary: Vytvoření třídy
 *     description: Vytvoření nové třídy (pouze admin)
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - year_ended
 *             properties:
 *               name:
 *                 type: string
 *               year_ended:
 *                 type: integer
 *               deadline:
 *                 type: string
 *                 format: date-time
 *               cj_teacher:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Třída vytvořena
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */

/**
 * @swagger
 * /api/books:
 *   get:
 *     summary: Seznam knih
 *     description: Získání seznamu knih s možností filtrování
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: literary_class
 *         schema:
 *           type: integer
 *         description: Filtr podle literárního druhu
 *       - in: query
 *         name: period
 *         schema:
 *           type: integer
 *         description: Filtr podle období
 *       - in: query
 *         name: author_id
 *         schema:
 *           type: integer
 *         description: Filtr podle autora
 *     responses:
 *       200:
 *         description: Seznam knih
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Book'
 *   post:
 *     summary: Vytvoření knihy
 *     description: Přidání nové knihy do systému (pouze admin)
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - author_id
 *               - period
 *               - literary_class
 *             properties:
 *               name:
 *                 type: string
 *               url_book:
 *                 type: string
 *               author_id:
 *                 type: integer
 *               translator_name:
 *                 type: string
 *               period:
 *                 type: integer
 *               literary_class:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Kniha vytvořena
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */

/**
 * @swagger
 * /api/reading-lists/my:
 *   get:
 *     summary: Můj seznam četby
 *     description: Získání seznamu četby přihlášeného žáka
 *     tags: [Reading Lists]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Seznam četby
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Book'
 */

/**
 * @swagger
 * /api/reading-lists/my/status:
 *   get:
 *     summary: Stav mého seznamu četby
 *     description: Získání validačního stavu seznamu četby s počty v kategoriích
 *     tags: [Reading Lists]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stav seznamu četby
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ReadingListStatus'
 */

/**
 * @swagger
 * /api/reading-lists/books:
 *   post:
 *     summary: Přidání knihy do seznamu
 *     description: Přidání knihy do seznamu četby žáka
 *     tags: [Reading Lists]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - book_id
 *             properties:
 *               book_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Kniha přidána
 *       400:
 *         description: Chyba validace (např. max 2 knihy od autora)
 */

/**
 * @swagger
 * /api/reading-lists/books/{bookId}:
 *   delete:
 *     summary: Odebrání knihy ze seznamu
 *     description: Odebrání knihy ze seznamu četby žáka
 *     tags: [Reading Lists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Kniha odebrána
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */

/**
 * @swagger
 * /api/reading-lists/my/pdf:
 *   get:
 *     summary: PDF mého seznamu četby
 *     description: Vygenerování PDF dokumentu se seznamem četby
 *     tags: [Reading Lists]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: PDF dokument
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */

/**
 * @swagger
 * /api/authors:
 *   get:
 *     summary: Seznam autorů
 *     description: Získání seznamu všech autorů
 *     tags: [Authors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Seznam autorů
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Author'
 */

/**
 * @swagger
 * /api/literary-classes:
 *   get:
 *     summary: Seznam literárních druhů
 *     description: Získání seznamu všech literárních druhů
 *     tags: [Literary Classes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Seznam literárních druhů
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LiteraryClass'
 */

/**
 * @swagger
 * /api/periods:
 *   get:
 *     summary: Seznam období
 *     description: Získání seznamu všech literárních období
 *     tags: [Periods]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Seznam období
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Period'
 */
