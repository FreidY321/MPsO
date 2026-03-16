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
 *                 message:
 *                   type: string
 *                   example: Přihlášení proběhlo úspěšně
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
 *                   example: Odhlášení proběhlo úspěšně. Please remove the token from client storage.
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
 *                   example: Heslo bylo úspěšně změněno
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
 *     description: Zahájení Google OAuth flow - přesměruje na Google přihlašovací stránku s výzvou k výběru účtu
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
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: State parameter pro detekci mobilní aplikace
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
 *                   example: Uživatel byl úspěšně vytvořen
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Můj profil
 *     description: Získání profilu aktuálně přihlášeného uživatele
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil uživatele
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
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /api/users/class/{classId}:
 *   get:
 *     summary: Žáci ve třídě
 *     description: Získání seznamu žáků v konkrétní třídě (admin, učitel)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID třídy
 *     responses:
 *       200:
 *         description: Seznam žáků ve třídě
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
 *                   example: 25
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
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
 *                   example: Uživatel byl úspěšně aktualizován
 *                 data:
 *                   $ref: '#/components/schemas/User'
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
 *                   example: Uživatel byl úspěšně smazán
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
 *                       format: email
 *                     class_id:
 *                       type: integer
 *                     password:
 *                       type: string
 *                       description: Volitelné - pokud vyplněno, použije se, jinak se vygeneruje náhodné heslo
 *     responses:
 *       201:
 *         description: Všechny účty úspěšně vytvořeny
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
 *                   example: Bylo vytvořeno 25 studentských účtů
 *                 count:
 *                   type: integer
 *                   example: 25
 *                 credentials:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 123
 *                       email:
 *                         type: string
 *                         example: jan.novak@spseiostrava.cz
 *                       password:
 *                         type: string
 *                         example: TempPass123!
 *                       name:
 *                         type: string
 *                         example: Jan
 *                       surname:
 *                         type: string
 *                         example: Novák
 *       207:
 *         description: Část účtů úspěšně vytvořena, část selhala
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
 *                   example: Bylo vytvořeno 23 studentských účtů, 2 řádků selhalo
 *                 createdCount:
 *                   type: integer
 *                   example: 23
 *                 errorCount:
 *                   type: integer
 *                   example: 2
 *                 credentials:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       email:
 *                         type: string
 *                       password:
 *                         type: string
 *                       name:
 *                         type: string
 *                       surname:
 *                         type: string
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       index:
 *                         type: integer
 *                         description: Index řádku v CSV
 *                       email:
 *                         type: string
 *                         description: Email, u kterého došlo k chybě
 *                       error:
 *                         type: string
 *                         description: Popis chyby (např. 'Uživatel s tímto emailem již existuje')
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
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Heslo bylo úspěšně resetováno
 *                 newPassword:
 *                   type: string
 *                   example: TempPass123!
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
 *     description: Získání seznamu všech tříd (admin, učitel)
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
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
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
 *                 example: I4C
 *               year_ended:
 *                 type: integer
 *                 example: 2024
 *               deadline:
 *                 type: string
 *                 format: date-time
 *                 example: 2024-05-31T23:59:59Z
 *               cj_teacher:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       201:
 *         description: Třída vytvořena
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
 *                   example: Třída byla úspěšně vytvořena
 *                 data:
 *                   $ref: '#/components/schemas/Class'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /api/classes/{id}:
 *   get:
 *     summary: Detail třídy
 *     description: Získání detailu třídy včetně žáků (admin, učitel)
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID třídy
 *     responses:
 *       200:
 *         description: Detail třídy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   allOf:
 *                     - $ref: '#/components/schemas/Class'
 *                     - type: object
 *                       properties:
 *                         students:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/User'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *   put:
 *     summary: Aktualizace třídy
 *     description: Aktualizace údajů třídy (pouze admin)
 *     tags: [Classes]
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
 *       200:
 *         description: Třída aktualizována
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
 *                   example: Třída byla úspěšně aktualizována
 *                 data:
 *                   $ref: '#/components/schemas/Class'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *   delete:
 *     summary: Smazání třídy
 *     description: Smazání třídy (pouze admin)
 *     tags: [Classes]
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
 *         description: Třída smazána
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
 *                   example: Třída byla úspěšně smazána
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
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
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *   post:
 *     summary: Vytvoření autora
 *     description: Přidání nového autora (pouze admin)
 *     tags: [Authors]
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
 *               - surname
 *             properties:
 *               name:
 *                 type: string
 *                 example: Karel
 *               second_name:
 *                 type: string
 *               surname:
 *                 type: string
 *                 example: Čapek
 *               second_surname:
 *                 type: string
 *     responses:
 *       201:
 *         description: Autor vytvořen
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
 *                   example: Autor byl úspěšně vytvořen
 *                 data:
 *                   $ref: '#/components/schemas/Author'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /api/authors/{id}:
 *   get:
 *     summary: Detail autora
 *     description: Získání detailu autora podle ID
 *     tags: [Authors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID autora
 *     responses:
 *       200:
 *         description: Detail autora
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Author'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *   put:
 *     summary: Aktualizace autora
 *     description: Aktualizace údajů autora (pouze admin)
 *     tags: [Authors]
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
 *               name:
 *                 type: string
 *               second_name:
 *                 type: string
 *               surname:
 *                 type: string
 *               second_surname:
 *                 type: string
 *     responses:
 *       200:
 *         description: Autor aktualizován
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
 *                   example: Autor byl úspěšně aktualizován
 *                 data:
 *                   $ref: '#/components/schemas/Author'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *   delete:
 *     summary: Smazání autora
 *     description: Smazání autora (pouze admin)
 *     tags: [Authors]
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
 *         description: Autor smazán
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
 *                   example: Autor byl úspěšně smazán
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
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
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *   post:
 *     summary: Vytvoření literárního druhu
 *     description: Přidání nového literárního druhu (pouze admin)
 *     tags: [Literary Classes]
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
 *               - min_request
 *               - max_request
 *             properties:
 *               name:
 *                 type: string
 *                 example: Česká literatura
 *               min_request:
 *                 type: integer
 *                 example: 5
 *               max_request:
 *                 type: integer
 *                 example: 10
 *     responses:
 *       201:
 *         description: Literární druh vytvořen
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
 *                   example: Literární druh byl úspěšně vytvořen
 *                 data:
 *                   $ref: '#/components/schemas/LiteraryClass'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /api/literary-classes/{id}:
 *   get:
 *     summary: Detail literárního druhu
 *     description: Získání detailu literárního druhu podle ID
 *     tags: [Literary Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID literárního druhu
 *     responses:
 *       200:
 *         description: Detail literárního druhu
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/LiteraryClass'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *   put:
 *     summary: Aktualizace literárního druhu
 *     description: Aktualizace literárního druhu (pouze admin)
 *     tags: [Literary Classes]
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
 *               name:
 *                 type: string
 *               min_request:
 *                 type: integer
 *               max_request:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Literární druh aktualizován
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
 *                   example: Literární druh byl úspěšně aktualizován
 *                 data:
 *                   $ref: '#/components/schemas/LiteraryClass'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *   delete:
 *     summary: Smazání literárního druhu
 *     description: Smazání literárního druhu (pouze admin)
 *     tags: [Literary Classes]
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
 *         description: Literární druh smazán
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
 *                   example: Literární druh byl úspěšně smazán
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
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
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *   post:
 *     summary: Vytvoření období
 *     description: Přidání nového literárního období (pouze admin)
 *     tags: [Periods]
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
 *               - min_request
 *               - max_request
 *             properties:
 *               name:
 *                 type: string
 *                 example: 19. století
 *               min_request:
 *                 type: integer
 *                 example: 3
 *               max_request:
 *                 type: integer
 *                 example: 8
 *     responses:
 *       201:
 *         description: Období vytvořeno
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
 *                   example: Období bylo úspěšně vytvořeno
 *                 data:
 *                   $ref: '#/components/schemas/Period'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /api/periods/{id}:
 *   get:
 *     summary: Detail období
 *     description: Získání detailu období podle ID
 *     tags: [Periods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID období
 *     responses:
 *       200:
 *         description: Detail období
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Period'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *   put:
 *     summary: Aktualizace období
 *     description: Aktualizace období (pouze admin)
 *     tags: [Periods]
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
 *               name:
 *                 type: string
 *               min_request:
 *                 type: integer
 *               max_request:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Období aktualizováno
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
 *                   example: Období bylo úspěšně aktualizováno
 *                 data:
 *                   $ref: '#/components/schemas/Period'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *   delete:
 *     summary: Smazání období
 *     description: Smazání období (pouze admin)
 *     tags: [Periods]
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
 *         description: Období smazáno
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
 *                   example: Období bylo úspěšně smazáno
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
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
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
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
 *                 example: R.U.R.
 *               url_book:
 *                 type: string
 *                 example: https://example.com/book/rur
 *               author_id:
 *                 type: integer
 *                 example: 1
 *               translator_name:
 *                 type: string
 *                 example: ""
 *               period:
 *                 type: integer
 *                 example: 3
 *               literary_class:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Kniha vytvořena
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
 *                   example: Kniha byla úspěšně vytvořena
 *                 data:
 *                   $ref: '#/components/schemas/Book'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /api/books/{id}:
 *   get:
 *     summary: Detail knihy
 *     description: Získání detailu knihy podle ID s informacemi o autorovi
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID knihy
 *     responses:
 *       200:
 *         description: Detail knihy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Book'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *   put:
 *     summary: Aktualizace knihy
 *     description: Aktualizace údajů knihy (pouze admin)
 *     tags: [Books]
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
 *       200:
 *         description: Kniha aktualizována
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
 *                   example: Kniha byla úspěšně aktualizována
 *                 data:
 *                   $ref: '#/components/schemas/Book'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *   delete:
 *     summary: Smazání knihy
 *     description: Smazání knihy (pouze admin) - pouze pokud není použita v seznamech četby
 *     tags: [Books]
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
 *         description: Kniha smazána
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
 *                   example: Kniha byla úspěšně smazána
 *       400:
 *         description: Kniha je používána v seznamech četby
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
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
 *                     allOf:
 *                       - $ref: '#/components/schemas/Book'
 *                       - type: object
 *                         properties:
 *                           when_added:
 *                             type: string
 *                             format: date-time
 *                             example: 2024-01-15T10:30:00Z
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
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
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
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
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /api/reading-lists/books:
 *   post:
 *     summary: Přidání knihy do seznamu
 *     description: Přidání knihy do seznamu četby žáka s validací pravidel (max 2 knihy od autora, max 20 knih celkem)
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
 *                 example: 1
 *     responses:
 *       201:
 *         description: Kniha přidána
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
 *                   example: Kniha byla úspěšně přidána do seznamu četby
 *                 data:
 *                   type: object
 *                   properties:
 *                     id_student:
 *                       type: integer
 *                     id_book:
 *                       type: integer
 *                     when_added:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Chyba validace (např. max 2 knihy od autora, kniha už je v seznamu)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
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
 *         description: ID knihy k odebrání
 *     responses:
 *       200:
 *         description: Kniha odebrána
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
 *                   example: Kniha byla úspěšně odebrána ze seznamu četby
 *       404:
 *         description: Kniha nebyla nalezena v seznamu četby
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /api/reading-lists/{studentId}:
 *   get:
 *     summary: Seznam četby žáka
 *     description: Získání seznamu četby konkrétního žáka (admin, učitel)
 *     tags: [Reading Lists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID žáka
 *     responses:
 *       200:
 *         description: Seznam četby žáka
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
 *                     allOf:
 *                       - $ref: '#/components/schemas/Book'
 *                       - type: object
 *                         properties:
 *                           when_added:
 *                             type: string
 *                             format: date-time
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /api/reading-lists/{studentId}/pdf:
 *   get:
 *     summary: PDF seznamu četby žáka
 *     description: Vygenerování PDF dokumentu se seznamem četby konkrétního žáka (admin, učitel)
 *     tags: [Reading Lists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID žáka
 *     responses:
 *       200:
 *         description: PDF dokument
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /api/reading-lists/books/batch:
 *   post:
 *     summary: Hromadné přidání knih do seznamu
 *     description: Přidání více knih do seznamu četby žáka najednou s validací pravidel
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
 *               - bookIds
 *             properties:
 *               bookIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2, 3]
 *     responses:
 *       201:
 *         description: Knihy přidány
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
 *                   example: Knihy byly přidány do seznamu četby
 *                 data:
 *                   type: object
 *                   properties:
 *                     added:
 *                       type: array
 *                       items:
 *                         type: object
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           bookId:
 *                             type: integer
 *                           reason:
 *                             type: string
 *                 status:
 *                   $ref: '#/components/schemas/ReadingListStatus'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /api/reading-lists/books:
 *   delete:
 *     summary: Hromadné odebrání knih ze seznamu
 *     description: Odebrání více knih ze seznamu četby žáka najednou
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
 *               - bookIds
 *             properties:
 *               bookIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2, 3]
 *     responses:
 *       200:
 *         description: Knihy odebrány
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
 *                   example: Knihy byly odstraněny z tvého seznamu četby
 *                 data:
 *                   type: object
 *                   properties:
 *                     removed:
 *                       type: array
 *                       items:
 *                         type: object
 *                     notFound:
 *                       type: array
 *                       items:
 *                         type: object
 *                 status:
 *                   $ref: '#/components/schemas/ReadingListStatus'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /api/reading-lists/class/{classId}/status:
 *   get:
 *     summary: Stav maturitních seznamů třídy
 *     description: Získání stavu maturitních seznamů četby pro všechny žáky ve třídě (admin, učitel)
 *     tags: [Reading Lists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID třídy
 *     responses:
 *       200:
 *         description: Stav třídy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     classId:
 *                       type: integer
 *                     totalStudents:
 *                       type: integer
 *                     completedStudents:
 *                       type: integer
 *                     pendingStudents:
 *                       type: integer
 *                     completionPercentage:
 *                       type: integer
 *                     studentStatuses:
 *                       type: array
 *                       items:
 *                         type: object
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
