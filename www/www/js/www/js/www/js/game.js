// game.js — Lógica principal de AeroLightning

window.addEventListener('DOMContentLoaded', async () => {
  const audio = new AudioManager();
  const haptics = new HapticsManager();
  const targeting = new TargetingSystem(audio, haptics);

  const avion = {
    heading: 0,      // -90 a 90 grados (izquierda/derecha)
    altitud: 50,      // 0 = tierra, mayor = más alto
    velocidad: 1,     // multiplicador de velocidad
    municion: 20,
    vida: 100,
    enVuelo: false
  };

  let estado = 'esperando_instrucciones';
  let siguienteEnemigoId = 1;

  // ---- Acciones del jugador (llamadas desde GestureController) ----
  const acciones = {
    ascender() {
      if (!avion.enVuelo) return;
      avion.altitud = Math.min(avion.altitud + 10, 100);
    },
    descender() {
      if (!avion.enVuelo) return;
      avion.altitud = Math.max(avion.altitud - 10, 0);
      if (avion.altitud === 0) _aterrizar();
    },
    girar(direccion) {
      if (!avion.enVuelo) return;
      const delta = direccion === 'derecha' ? 15 : -15;
      avion.heading = Math.max(-90, Math.min(90, avion.heading + delta));
      _actualizarAngulosEnemigos();
    },
    acelerar() {
      if (!avion.enVuelo) return;
      avion.velocidad = Math.min(avion.velocidad + 0.5, 3);
    },
    frenar() {
      if (!avion.enVuelo) return;
      avion.velocidad = Math.max(avion.velocidad - 0.5, 0.5);
    },
    disparar() {
      if (!avion.enVuelo) return;
      if (avion.municion <= 0) {
        audio.playEffect('sinMunicion');
        return;
      }
      avion.municion--;
      audio.playEffect('disparoAmetralladora');
      if (targeting.estaAlineado()) {
        _destruirObjetivo(targeting.objetivoBloqueadoId());
      }
    },
    misil() {
      if (!avion.enVuelo) return;
      audio.playEffect('misil');
      haptics.media();
      if (targeting.objetivoBloqueadoId() !== null) {
        _destruirObjetivo(targeting.objetivoBloqueadoId());
      }
    },
    recargar() {
      avion.municion = 20;
      audio.playEffect('recarga');
    },
    cambiarObjetivo() {
      targeting.cambiarObjetivo();
    }
  };

  // ---- Ciclo de vida de la misión ----
  function _iniciarInstrucciones() {
    audio.announce('instrucciones');
    estado = 'esperando_toque_inicial';
  }

  function _despegar() {
    estado = 'despegando';
    audio.announce('despegue');
    audio.startEngine();
    audio.startBackgroundMusic();
    avion.enVuelo = true;
    setTimeout(() => {
      estado = 'combate';
      audio.announce('combateIniciado');
      _iniciarOleadaEnemigos();
    }, 3000);
  }

  function _aterrizar() {
    if (estado !== 'combate') return;
    estado = 'aterrizando';
    avion.enVuelo = false;
    audio.stopEngine();
    audio.announce('aterrizaje');
  }

  // ---- Enemigos ----
  function _iniciarOleadaEnemigos() {
    setInterval(() => {
      if (estado !== 'combate') return;
      if (targeting.enemies.length >= 3) return; // no saturar de sonidos
      const enemigo = {
        id: siguienteEnemigoId++,
        angulo: Math.floor(Math.random() * 180) - 90, // -90 a 90
        distancia: 400 + Math.random() * 100,
        peligro: Math.random() > 0.7 ? 2 : 1
      };
      targeting.agregarEnemigo(enemigo);
    }, 6000);
  }

  function _actualizarAngulosEnemigos() {
    // Al girar el avión, los ángulos relativos de los enemigos cambian
    targeting.enemies.forEach(e => {
      e.angulo = Math.max(-90, Math.min(90, e.angulo - avion.heading));
    });
  }

  function _destruirObjetivo(id) {
    audio.playEffect('explosion');
    audio.announce('enemigoDestruido');
    haptics.media();
    targeting.eliminarEnemigo(id);
  }

  // ---- Enemigos acercándose (pierden distancia con el tiempo) ----
  setInterval(() => {
    if (estado !== 'combate') return;
    targeting.enemies.forEach(e => {
      e.distancia = Math.max(0, e.distancia - 15 * avion.velocidad);
      if (e.distancia <= 0) {
        // el enemigo llegó hasta el jugador: impacto
        avion.vida = Math.max(0, avion.vida - 20);
        audio.playEffect('explosion');
        audio.announce('emergencia');
        haptics.fuerte();
        targeting.eliminarEnemigo(e.id);
        if (avion.vida <= 0) {
          estado = 'derrota';
          audio.stopEngine();
        }
      }
    });
  }, 1000);

  // ---- Toque inicial para arranca
