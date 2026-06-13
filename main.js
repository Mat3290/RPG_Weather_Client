// --- DISCORD RPC ---
console.log("[MAIN LOG] 🔌 Discord RPC kliens inicializálása...");
const rpc = new RPC.Client({ transport: "ipc" });

rpc.on("ready", () => {
  console.log("=======================================================");
  console.log("🎮 [DISCORD RPC] SIKERES KAPCSOLÓDÁS A HELYI DISCORDHOZ!");
  console.log("=======================================================");

  // 3 másodpercenként lekérjük a Discordtól, hogy mit játszik/hol van a felhasználó
  setInterval(async () => {
    try {
      // Lekérjük a felhasználó aktuális státuszát/aktivitásait
      const response = await rpc.request("GET_ACTIVITY", {});

      console.log("[DISCORD RPC] 🔃 Aktivitási adatok sikeresen lekérve.");

      const activities = response.activities || [];

      // Megnézzük, hogy az RPG szerveren vagy-e az ID alapján
      const isOnRPGGuild = activities.some(
        (act) =>
          act.application_id === CLIENT_ID ||
          (act.metadata && act.metadata.button_url),
      );

      console.log(
        `[DISCORD RPC] Értékelés -> Felhasználó az RPG szerveren van? ${isOnRPGGuild}`,
      );

      if (isOnRPGGuild) {
        if (win && !win.isVisible()) {
          console.log("🌧️ [OVERLAY ACTION] WINDOW SHOW -> Eső bekapcsol.");
          win.show();
        }
      } else {
        if (win && win.isVisible()) {
          console.log("☀️ [OVERLAY ACTION] WINDOW HIDE -> Eső elrejtve.");
          win.hide();
        }
      }
    } catch (e) {
      // Ez akkor fut le, ha épp nincs elindítva semmilyen státusz a Discordban (ez normális)
      if (win && win.isVisible()) {
        console.log("☀️ [OVERLAY ACTION] Nincs aktivitás -> Eső elrejtve.");
        win.hide();
      }
    }
  }, 3000); // 3 másodperces frissítési ütem
});
