const { app, BrowserWindow, screen } = require("electron");
const { autoUpdater } = require("electron-updater");
const RPC = require("discord-rpc");
const path = require("path");

let win = null;
const SERVER_URL = "http://localhost:3000";
const CLIENT_ID = "872018004542644304";

console.log("[MAIN LOG] 🚀 Electron folyamat elindult...");

function createOverlayWindow() {
  console.log("[MAIN LOG] 🖥️ Képernyő felbontás lekérése...");
  const mainScreen = screen.getPrimaryDisplay();
  const { width, height } = mainScreen.size;
  console.log(`[MAIN LOG] 📐 Észlelt méret: ${width}x${height}`);

  win = new BrowserWindow({
    width: width,
    height: height,
    x: 0,
    y: 0,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false, // Alapból rejtve, a Discord fogja előhozni
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.setIgnoreMouseEvents(true, { forward: true });

  console.log("[MAIN LOG] 📄 index.html betöltése...");
  win.loadFile(path.join(__dirname, "index.html"));

  win.webContents.on("did-finish-load", () => {
    console.log(
      "[MAIN LOG] ✅ Az index.html sikeresen beágyazódott az ablakba.",
    );
  });
}

// --- DISCORD RPC ---
console.log("[MAIN LOG] 🔌 Discord RPC kliens inicializálása...");
const rpc = new RPC.Client({ transport: "ipc" });

rpc.on("ready", () => {
  console.log("=======================================================");
  console.log("🎮 [DISCORD RPC] SIKERES KAPCSOLÓDÁS A HELYI DISCORDHOZ!");
  console.log("=======================================================");

  rpc.subscribe("PRESENCE_UPDATE", (data) => {
    console.log(
      "[DISCORD RPC] 🔃 PRESENCE_UPDATE esemény érkezett a Discordtól!",
    );

    try {
      const activities = data.presence.activities || [];
      console.log(
        `[DISCORD RPC] Aktuális aktivitások száma: ${activities.length}`,
      );

      // Kilogoljuk az összes futó aktivitást, hogy lássuk, mit érzékel a Discord
      activities.forEach((act, index) => {
        console.log(
          `  [${index}] App ID: ${act.application_id}, Név: ${act.name}, Részletek: ${act.details}`,
        );
      });

      const isOnRPGGuild = activities.some(
        (act) =>
          act.application_id === CLIENT_ID ||
          (act.metadata && act.metadata.button_url),
      );

      console.log(
        `[DISCORD RPC] Értékelés -> Felhasználó az RPG szerveren van? Érték: ${isOnRPGGuild}`,
      );

      if (isOnRPGGuild) {
        if (win && !win.isVisible()) {
          console.log(
            "🌧️ [OVERLAY ACTION] Feltétel teljesült! WINDOW SHOW -> Eső bekapcsol.",
          );
          win.show();
        }
      } else {
        if (win && win.isVisible()) {
          console.log(
            "☀️ [OVERLAY ACTION] Feltétel már nem teljesül! WINDOW HIDE -> Eső elrejtve.",
          );
          win.hide();
        }
      }
    } catch (e) {
      console.error(
        "❌ [MAIN ERROR] Hiba az RPC adat feldolgozásakor:",
        e.message,
      );
    }
  });
});

app.whenReady().then(() => {
  createOverlayWindow();

  console.log(
    "[MAIN LOG] 🔑 Bejelentkezés a Discord RPC-be a Client ID-val...",
  );
  rpc.login({ clientId: CLIENT_ID }).catch((err) => {
    console.error(
      "❌ [DISCORD ERROR] Nem sikerült rácsatlakozni a Discordra. Fut a Discord a gépeden?",
      err.message,
    );
  });

  console.log("[MAIN LOG] 🔄 AutoUpdater ellenőrzése...");
  autoUpdater
    .checkForUpdatesAndNotify()
    .catch((e) =>
      console.log(
        "[MAIN LOG] AutoUpdater figyelmen kívül hagyva (helyi futás)",
      ),
    );
});

app.on("window-all-closed", () => {
  console.log("[MAIN LOG] 🛑 Minden ablak bezárult. Kilépés.");
  if (process.platform !== "darwin") app.quit();
});
