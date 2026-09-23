// audioManager.js — Gestor de audio para AeroLightning

const SOUND_FILES = {
  // Loops persistentes
  motorF35: 'sonidos/sonidode-f-35.mp3',
  musicaFondo: 'sonidos/musicadepartida.mp3',

  // Cola de anuncios (uno a la vez)
  instrucciones: 'sonidos/instrucciones.mp3',
  despegue: 'sonidos/sonidodecasaenelaire.wav',
  aterrizaje: 'sonidos/aterrizaje.mp3',
  combateIniciado: 'sonidos/combateiniciado.mp3',
  contactoRadar: 'sonidos/contactoderadar.mp3',
  enemigoDetectado: 'sonidos/enemigodetectado.wav',
  objetivoIdentificado: 'sonidos/objetivoidentificado.wav',
  objetivoDestruido: 'sonidos/objetivodestruido-prepárateparalasiguientemision.wav',
  enemigoDestruido: 'sonidos/enemigodestruido.wav',
  misionCompletada: 'sonidos/victoriaconfirmada-hascompletadolamision.wav',
  bloqueado: 'sonidos/big-alarm-2.mp3',
  emergencia: 'sonidos/emergencia.wav',

  // Efectos libres (pueden superponerse)
  disparoAmetralladora: 'sonidos/perestrelka.mp3',
  disparoSecundario: 'sonidos/Disparo.mp3',
  tiro: 'sonidos/tiro.mp3',
  recarga: 'sonidos/recargapistola.mp3',
  sinMunicion: 'sonidos/nosalelabala.mp3',
  misil: 'sonidos/misil.mp3',
  bateriaAntiaerea: 'sonidos/bateriademisilesantiaereos.mp3',
  torretaEnemiga: 'sonidos/Torreta.mp3',
  explosion: 'sonidos/explosion-1.mp3'
};

class AudioManager {
  constructor() {
    this.buffers = {};
    this.loopSources = {};
    this.announceQueue = [];
    this.isAnnouncing = false;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);
  }

  async loadAll() {
    const entries = Object.entries(SOUND_FILES);
    await Promise.all(entries.map(async ([key, url]) => {
      const res = await fetch(url);
      const arrayBuffer = await res.arrayBuffer();
      this.buffers[key] = await this.ctx.decodeAudioData(arrayBuffer);
    }));
  }

  _play(key, { volume = 1, loop = false, pan = 0 } = {}) {
    const buffer = this.buffers[key];
    if (!buffer) {
      console.warn(`Sonido no cargado: ${key}`);
      return null;
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = loop;

    const gain = this.ctx.createGain();
    gain.gain.value = volume;

    const panner = this.ctx.createStereoPanner();
    panner.pan.value = pan;

    source.connect(panner).connect(gain).connect(this.masterGain);
    source.start(0);
    return { source, gain, panner };
  }

  startEngine() {
    if (this.loopSources.motorF35) return;
    this.loopSources.motorF35 = this._play('motorF35', { volume: 0.7, loop: true });
  }

  stopEngine() {
    if (!this.loopSources.motorF35) return;
    this.loopSources.motorF35.source.stop();
    delete this.loopSources.motorF35;
  }

  startBackgroundMusic() {
    if (this.loopSources.musicaFondo) return;
    this.loopSources.musicaFondo = this._play('musicaFondo', { volume: 0.08, loop: true });
  }

  announce(key) {
    this.announceQueue.push(key);
    this._processQueue();
  }

  _processQueue() {
    if (this.isAnnouncing || this.announceQueue.length === 0) return;
    this.isAnnouncing = true;
    const key = this.announceQueue.shift();
    const played = this._play(key, { volume: 1, loop: false });

    if (played) {
      const duration = played.source.buffer.duration;
      setTimeout(() => {
        this.isAnnouncing = false;
        this._processQueue();
      }, duration * 1000);
    } else {
      this.isAnnouncing = false;
      this._processQueue();
    }
  }

  playEffect(key, volume = 1, pan = 0) {
    this._play(key, { volume, loop: false, pan });
  }

  // Pulso de rastreo de enemigo: pan y velocidad variables según posición/distancia
  playTrackingPulse(pan, volume = 0.5) {
    this._play('contactoRadar', { volume, loop: false, pan });
  }
  }
