// hapticsManager.js — Vibración para AeroLightning (usa el plugin nativo de Capacitor)

class HapticsManager {
  constructor() {
    // Capacitor.Plugins.Haptics estará disponible una vez el plugin esté sincronizado
    this.haptics = (window.Capacitor && window.Capacitor.Plugins.Haptics) || null;
  }

  async ligera() {
    // Disparo de ametralladora, toques generales
    if (!this.haptics) return;
    await this.haptics.impact({ style: 'LIGHT' });
  }

  async media() {
    // Misil lanzado, objetivo destruido, cambio de objetivo
    if (!this.haptics) return;
    await this.haptics.impact({ style: 'MEDIUM' });
  }

  async fuerte() {
    // El F-35 recibe daño, bloqueado por enemigo
    if (!this.haptics) return;
    await this.haptics.impact({ style: 'HEAVY' });
  }

  async emergencia() {
    // Patrón de vibración repetido para alertas críticas
    if (!this.haptics) return;
    for (let i = 0; i < 3; i++) {
      await this.haptics.vibrate({ duration: 200 });
      await new Promise(r => setTimeout(r, 150));
    }
  }
}
