// targetingSystem.js — Puntería por audio espacial para AeroLightning
// Bloqueo automático al enemigo más cercano/peligroso, con cambio manual de objetivo

class TargetingSystem {
  constructor(audioManager, hapticsManager) {
    this.audio = audioManager;
    this.haptics = hapticsManager;
    this.enemies = [];       // { id, angulo, distancia, peligro }
    this.lockedId = null;
    this.pulseTimer = null;
    this.wasAligned = false;

    this.ALIGN_THRESHOLD = 8; // grados de tolerancia para considerar "centrado"
  }

  agregarEnemigo(enemigo) {
    this.enemies.push(enemigo);
    if (this.lockedId === null) {
      this._elegirObjetivo();
    }
    this.audio.announce('enemigoDetectado');
  }

  eliminarEnemigo(id) {
    this.enemies = this.enemies.filter(e => e.id !== id);
    if (this.lockedId === id) {
      this.lockedId = null;
      this._elegirObjetivo();
    }
  }

  // Elige el enemigo más peligroso; si hay empate, el más cercano
  _elegirObjetivo() {
    if (this.enemies.length === 0) {
      this.lockedId = null;
      this._detenerPulso();
      return;
    }
    const ordenados = [...this.enemies].sort((a, b) => {
      if (b.peligro !== a.peligro) return b.peligro - a.peligro;
      return a.distancia - b.distancia;
    });
    this.lockedId = ordenados[0].id;
    this.audio.announce('objetivoIdentificado');
    this._iniciarPulso();
  }

  // Gesto para cambiar de objetivo manualmente (ciclo entre enemigos)
  cambiarObjetivo() {
    if (this.enemies.length <= 1) return;
    const idx = this.enemies.findIndex(e => e.id === this.lockedId);
    const siguiente = this.enemies[(idx + 1) % this.enemies.length];
    this.lockedId = siguiente.id;
    this.haptics && this.haptics.media();
    this.audio.announce('objetivoIdentificado');
  }

  _objetivoActual() {
    return this.enemies.find(e => e.id === this.lockedId) || null;
  }

  // angulo: -90 (izquierda) a +90 (derecha) relativo al frente del avión
  _anguloAPan(angulo) {
    const clamped = Math.max(-90, Math.min(90, angulo));
    return clamped / 90; // -1 a 1 para StereoPannerNode
  }

  // distancia: metros o unidades de juego; menor = más cerca
  _distanciaAIntervalo(distancia) {
    const minMs = 150;   // pulso muy rápido, objetivo muy cerca
    const maxMs = 1200;  // pulso lento, objetivo lejos
    const maxDistancia = 500;
    const factor = Math.min(distancia / maxDistancia, 1);
    return minMs + factor * (maxMs - minMs);
  }

  _iniciarPulso() {
    this._detenerPulso();
    const tick = () => {
      const objetivo = this._objetivoActual();
      if (!objetivo) return;

      const pan = this._anguloAPan(objetivo.angulo);
      const volumen = Math.max(0.3, 1 - objetivo.distancia / 500);
      this.audio.playTrackingPulse(pan, volumen);

      const alineado = Math.abs(objetivo.angulo) <= this.ALIGN_THRESHOLD;
      if (alineado && !this.wasAligned) {
        this.audio.announce('objetivoIdentificado');
        this.haptics && this.haptics.ligera();
      }
      this.wasAligned = alineado;

      const intervalo = this._distanciaAIntervalo(objetivo.distancia);
      this.pulseTimer = setTimeout(tick, intervalo);
    };
    tick();
  }

  _detenerPulso() {
    if (this.pulseTimer) {
      clearTimeout(this.pulseTimer);
      this.pulseTimer = null;
    }
  }

  // El juego llama esto antes de disparar, para saber si el disparo va a impactar
  estaAlineado() {
    const objetivo = this._objetivoActual();
    if (!objetivo) return false;
    return Math.abs(objetivo.angulo) <= this.ALIGN_THRESHOLD;
  }

  objetivoBloqueadoId() {
    return this.lockedId;
  }
}
