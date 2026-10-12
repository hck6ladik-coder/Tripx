# hck6lada CodeSpace AI 🚀

> Moderní lokální webové vývojové prostředí (IDE) a AI programátorský asistent **hck6lada** s integrovaným modelem **Claude 3.5 Sonnet** přes `fcc-server`.

![hck6lada](https://img.shields.io/badge/hck6lada-CodeSpace-7c8cff?style=for-the-badge)
![AI-Model](https://img.shields.io/badge/AI%20Model-Claude%203.5%20Sonnet%20(8082)-blue?style=for-the-badge)
![Security](https://img.shields.io/badge/Gate%20PIN-666-crimson?style=for-the-badge)

---

## ✨ Klíčové vlastnosti

- 🔐 **Zabezpečený Loading & Lock Screen (PIN 666):**
  - Stylová úvodní zamykací obrazovka s neonovými vizuály a digitální klávesnicí.
  - Zabezpečení kódem `666` aktivující "Režim 666".
  - Interaktivní bootovací sekvence s inicializací všech subsystémů.
  - Tlačítko pro rychlé zamknutí obrazovky přímo ve StatusBaru a Sidebaru.

- 🤖 **Senior Software Architect & Programmer AI:**
  - Plně předkonfigurovaný model **Claude 3.5 Sonnet** napojený přímo na lokální `fcc-server` (port 8082).
  - Přísné inženýrské standardy: SOLID, DRY, Clean Architecture, Big-O optimalizace, defenzivní programování, striktní typování.
  - Výhradně česká komunikace (100% v češtině, bez meta-úvah a bez úniků interního myšlení).

- 📁 **Lokální správa souborů a automatický zápis:**
  - AI má plný přístup k lokálnímu disku a vytváří soubory přímo na disk projektu (`// filepath:` hlavičky).
  - Tlačítko pro uložení změn přímo na disk nebo automatické ukládání v režimu Agent.

- 🧠 **Perzistentní paměť faktů:**
  - AI si pamatuje informace o uživateli, preferencích a architektuře projektu i mezi jednotlivými konverzacemi.

- 💻 **Kompletní vývojářské rozhraní:**
  - **Monaco Editor** s podporou desítek jazyků, zvýrazňováním syntaxe a záložkami.
  - **Interaktivní terminál** (xterm.js) s reálným spouštěním příkazů.
  - **Průzkumník souborů** s prohlížečem lokálních složek a stromem projektu.
  - **Command Palette (Ctrl+K)** pro rychlé vyhledávání příkazů.
  - **Tři režimy asistenta:** Chat (běžná diskuze), Plán (architektonický návrh), Agent (přímý zápis kódu na disk).

- 🛠️ **Autonomní Self-Healing Agent:**
  - Samostatný agent pro automatickou diagnostiku a opravu chyb v projektu.

- ⚔️ **AI Model Arena:**
  - Souboj modelů – porovnání odpovědí více modelů vedle sebe.

- 📚 **Prompt Manager (Ctrl+Shift+P):**
  - Knihovna předpřipravených i vlastních promptů (debug, refactor, testy, review, dokumentace…).
  - Oblíbené, vyhledávání, proměnné (`{{výběr}}`, `{{soubor}}`, `{{jazyk}}`) a vložení do chatu jedním klikem.

- 🎙️ **Hlasové ovládání:**
  - **Hlasový vstup** do chatu (české diktování) a **živý hlasový chat** ve stylu ChatGPT.
  - **TTS mluvení** odpovědí asistenta.

- 🎨 **Živý Canvas & Artifacts:**
  - Interaktivní sandbox náhled pro HTML, React/TSX a SVG přímo z chatu nebo editoru.
  - Úprava kódu, přepínání náhled/kód, konzole, stahování jako `.html`.

- 🧩 **Přizpůsobení rozhraní (Ctrl+Shift+L):**
  - Zapínání/vypínání panelů (Chat, Editor, Terminál, Canvas), Status Baru a sidebaru.
  - Předvolby rozvržení: Plné IDE, Focus Chat, Čistý Editor, Web Studio, Ultra Zen Mode.

---

## ⌨️ Klávesové zkratky

| Zkratka | Akce |
|---|---|
| `Ctrl+K` | Command Palette |
| `Ctrl+Shift+P` | Prompt Manager |
| `Ctrl+Shift+V` | Hlasový chat |
| `Ctrl+Shift+L` | Přizpůsobení rozhraní |
| `Ctrl+B` | Přepnout sidebar |
| `Ctrl+N` | Nový chat |

---

## 🛠️ Požadavky a technologie

- **Node.js** (v18+)
- **npm** nebo **pnpm**
- **fcc-server** (`free-claude-code`) spuštěný na portu `8082`

**Použitý technologický stack:**
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons
- **Komponenty:** Monaco Editor, XTerm.js, Radix UI, Zustand
- **Backend Proxy:** Integrovaný Vite middleware pro lokální soubory a proxy na `fcc-server`

---

## 🚀 Rychlý start

1. **Klonování repozitáře:**
   ```bash
   git clone https://github.com/hck6ladik-coder/Tripx.git
   cd Tripx
   ```

2. **Instalace závislostí:**
   ```bash
   npm install
   ```

3. **Spuštění fcc-serveru:**
   V samostatném terminálu spusťte:
   ```bash
   fcc-server
   ```
   *(Běží na http://127.0.0.1:8082)*

4. **Spuštění vývojového serveru:**
   ```bash
   npm run dev
   ```

5. **Otevření v prohlížeči:**
   Přejděte na [http://localhost:3000](http://localhost:3000).
   Zadejte kód **`666`** pro odemčení a inicializaci systému.

6. **Kontrola buildu:**
   ```bash
   npm run build
   ```

---

## 🌐 Nasazení na Vercel (bez chyby 404)

Repozitář je připravený na deploy bez jakékoliv konfigurace navíc:

- **Root Directory:** kořen repozitáře, framework se detekuje sám (Vite, build `npm run build`, output `dist`).
- **`vercel.json`** přepisuje všechny cesty mimo `/api/*` na `index.html` (SPA fallback – žádná 404 při reloadu).
- **Složka `api/`** obsahuje serverless funkce, takže žádný request nekončí na Vercel 404:
  - `POST /api/chat` – proxy na přímé providery (Kimi, OpenRouter, OpenAI, DeepSeek, Groq) se streamem; bez klíče vrátí srozumitelné upozornění místo chyby.
  - `GET /api/fs/tree|directories|read` a `POST /api/fs/write` – ladné prázdné odpovědi (disk na Vercelu není).
  - `POST /api/terminal/exec` – vrátí hlášku, že terminál funguje jen lokálně.

**Důležité:** na Vercelu neběží lokální `fcc-server` (modely `fcc/*`), není přístup k disku ani terminál. Pro plnou funkčnost včetně chatu vložte API klíč v **Nastavení** (ukládá se do localStorage v prohlížeči) a pro vývoj s diskem/terminálem spusťte aplikaci lokálně (`npm run dev` + `fcc-server`).

---

## 📝 Poznámka k verzi

- Generování obrázků a videí (AI Media Studio) bylo z projektu **zcela odstraněno** – včetně příkazů `/image` a `/video`.
- Typy, konstanty a store byly sjednoceny se stabilní zálohou, všechny ostatní funkce (Prompt Manager, Voice Chat, Canvas, Arena, Self-Healing Agent) jsou plně funkční a build prochází (`tsc` bez chyb).

---

## 👤 Autor

- **hck6lada**
