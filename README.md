# TripxCZ-Twitch CodeSpace AI 🚀

> Moderní lokální webové vývojové prostředí (IDE) a AI programátorský asistent přizpůsobený pro **Tripa (TripxCZ na Twitchi)** s integrovaným modelem **Claude 3.5 Sonnet** přes `fcc-server`.

![TripxCZ-Twitch](https://img.shields.io/badge/TripxCZ-Twitch-9146FF?style=for-the-badge&logo=twitch&logoColor=white)
![AI-Model](https://img.shields.io/badge/AI%20Model-Claude%203.5%20Sonnet%20(8082)-blue?style=for-the-badge)
![Security](https://img.shields.io/badge/Gate%20PIN-666-crimson?style=for-the-badge)

---

## ✨ Klíčové vlastnosti

- 🔐 **Zabezpečený Loading & Lock Screen (PIN 666):**
  - Stylová úvodní zamykací obrazovka s Twitch vizuály a digitální klávesnicí.
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
  - **Interaktivní terminál** (xterm.js).
  - **Průzkumník souborů** s prohlížečem lokálních složek a stromem projektu.
  - **Command Palette (Ctrl+K)** pro rychlé vyhledávání příkazů.
  - **Tři režimy asistenta:** Chat (běžná diskuze), Plán (architektonický návrh), Agent (přímý zápis kódu na disk).

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

---

## 👤 Autor

- **Trip** ([twitch.tv/tripxcz](https://twitch.tv/tripxcz))
