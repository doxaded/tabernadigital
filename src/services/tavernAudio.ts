/**
 * Serviço de Áudio Ambiental da Taberna (Web Audio API)
 * Gera som autêntico de lareira estalando e acordes suaves de alaúde medieval
 * Não depende de arquivos externos, funciona 100% offline no navegador.
 */

class TavernAudioService {
  private ctx: AudioContext | null = null;
  private isPlayingAudio = false;
  private fireGainNode: GainNode | null = null;
  private luteGainNode: GainNode | null = null;
  private masterGainNode: GainNode | null = null;
  private luteIntervalId: number | null = null;
  private fireNoiseNode: AudioNode | null = null;
  private listeners: Array<(playing: boolean) => void> = [];

  public subscribe(listener: (playing: boolean) => void) {
    this.listeners.push(listener);
    listener(this.isPlayingAudio);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l(this.isPlayingAudio));
  }

  public isPlaying(): boolean {
    return this.isPlayingAudio;
  }

  public async toggle(): Promise<boolean> {
    if (this.isPlayingAudio) {
      this.stop();
      return false;
    } else {
      await this.start();
      return true;
    }
  }

  public async start() {
    if (this.isPlayingAudio) return;

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!this.ctx) {
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }

      // Master Gain
      this.masterGainNode = this.ctx.createGain();
      this.masterGainNode.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.masterGainNode.connect(this.ctx.destination);

      // 1. Iniciar gerador de som de lareira (Fogo e Estalos de Madeira)
      this.startFireplace();

      // 2. Iniciar acordes suaves e festivos de alaúde medieval
      this.startLuteMusic();

      this.isPlayingAudio = true;
      this.notify();
    } catch (e) {
      console.warn('Não foi possível iniciar o áudio da taberna:', e);
    }
  }

  public stop() {
    if (!this.isPlayingAudio) return;

    if (this.luteIntervalId) {
      window.clearInterval(this.luteIntervalId);
      this.luteIntervalId = null;
    }

    if (this.masterGainNode && this.ctx) {
      // Fade out suave
      this.masterGainNode.gain.setTargetAtTime(0.001, this.ctx.currentTime, 0.4);
      setTimeout(() => {
        try {
          this.fireNoiseNode?.disconnect();
          this.fireGainNode?.disconnect();
          this.luteGainNode?.disconnect();
        } catch {
          // ignore
        }
        this.fireNoiseNode = null;
        this.fireGainNode = null;
        this.luteGainNode = null;
        this.masterGainNode = null;
      }, 500);
    }

    this.isPlayingAudio = false;
    this.notify();
  }

  // Sintetizador do estalo da lareira da taberna
  private startFireplace() {
    if (!this.ctx || !this.masterGainNode) return;

    // Buffer de ruído rosa para o sopro/fogo baixo
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.05;
      b6 = white * 0.115926;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Filtro passa-baixa para dar sensação de fogo crepitante quente
    const fireFilter = this.ctx.createBiquadFilter();
    fireFilter.type = 'lowpass';
    fireFilter.frequency.setValueAtTime(450, this.ctx.currentTime);

    this.fireGainNode = this.ctx.createGain();
    this.fireGainNode.gain.setValueAtTime(0.2, this.ctx.currentTime);

    whiteNoise.connect(fireFilter);
    fireFilter.connect(this.fireGainNode);
    this.fireGainNode.connect(this.masterGainNode);
    whiteNoise.start();
    this.fireNoiseNode = whiteNoise;

    // Estalos aleatórios de brasa/lenha
    const schedulePops = () => {
      if (!this.isPlayingAudio || !this.ctx || !this.masterGainNode) return;
      
      const popOsc = this.ctx.createOscillator();
      const popGain = this.ctx.createGain();
      const popFilter = this.ctx.createBiquadFilter();

      popFilter.type = 'bandpass';
      popFilter.frequency.setValueAtTime(800 + Math.random() * 1400, this.ctx.currentTime);
      popFilter.Q.setValueAtTime(3.0, this.ctx.currentTime);

      popOsc.type = 'triangle';
      popOsc.frequency.setValueAtTime(120 + Math.random() * 200, this.ctx.currentTime);

      const popTime = this.ctx.currentTime + Math.random() * 0.8;
      const popDuration = 0.03 + Math.random() * 0.04;

      popGain.gain.setValueAtTime(0, popTime);
      popGain.gain.linearRampToValueAtTime(0.25 + Math.random() * 0.25, popTime + 0.005);
      popGain.gain.exponentialRampToValueAtTime(0.001, popTime + popDuration);

      popOsc.connect(popFilter);
      popFilter.connect(popGain);
      popGain.connect(this.masterGainNode);

      popOsc.start(popTime);
      popOsc.stop(popTime + popDuration + 0.05);

      if (this.isPlayingAudio) {
        setTimeout(schedulePops, 200 + Math.random() * 800);
      }
    };
    schedulePops();
  }

  // Sintetizador de acordes e dedilhado festivo de alaúde medieval (Modo Dórico em Ré/Lá)
  private startLuteMusic() {
    if (!this.ctx || !this.masterGainNode) return;

    this.luteGainNode = this.ctx.createGain();
    this.luteGainNode.gain.setValueAtTime(0.35, this.ctx.currentTime);
    this.luteGainNode.connect(this.masterGainNode);

    // Escala medieval: D3, F3, G3, A3, C4, D4, E4, F4, G4, A4 (Frequências Hz)
    const luteNotes = [
      146.83, // D3
      174.61, // F3
      196.00, // G3
      220.00, // A3
      261.63, // C4
      293.66, // D4
      329.63, // E4
      349.23, // F4
      392.00, // G4
      440.00, // A4
    ];

    // Padrão de dedilhado festivo de taverna
    const patterns = [
      [0, 3, 5, 7, 5, 3], // Dm arpeggio
      [2, 4, 6, 8, 6, 4], // G/C modal
      [1, 3, 5, 7, 6, 4], // F major lilt
      [3, 5, 7, 9, 7, 5], // A minor resolution
    ];

    let patternIdx = 0;
    let noteIdx = 0;

    const playLuteNote = (freq: number) => {
      if (!this.ctx || !this.luteGainNode) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const oscHarmonic = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();
      const noteFilter = this.ctx.createBiquadFilter();

      // Timbre característico de corda dedilhada de alaúde
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      oscHarmonic.type = 'triangle';
      oscHarmonic.frequency.setValueAtTime(freq * 2, now);

      noteFilter.type = 'lowpass';
      noteFilter.frequency.setValueAtTime(freq * 4.5, now);
      noteFilter.frequency.exponentialRampToValueAtTime(freq * 1.2, now + 0.6);

      // Ataque rápido e decaimento natural de corda acústica
      noteGain.gain.setValueAtTime(0, now);
      noteGain.gain.linearRampToValueAtTime(0.18, now + 0.015);
      noteGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc.connect(noteFilter);
      oscHarmonic.connect(noteFilter);
      noteFilter.connect(noteGain);
      noteGain.connect(this.luteGainNode);

      osc.start(now);
      oscHarmonic.start(now);
      osc.stop(now + 1.3);
      oscHarmonic.stop(now + 1.3);
    };

    // Toca as notas do dedilhado em ritmo festivo de compasso 6/8
    this.luteIntervalId = window.setInterval(() => {
      if (!this.isPlayingAudio) return;

      const currentPattern = patterns[patternIdx];
      const noteIndexInScale = currentPattern[noteIdx];
      const freq = luteNotes[noteIndexInScale];

      playLuteNote(freq);

      noteIdx++;
      if (noteIdx >= currentPattern.length) {
        noteIdx = 0;
        patternIdx = (patternIdx + 1) % patterns.length;
      }
    }, 380);
  }

  private getOrCreateContext(): AudioContext | null {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!this.ctx) {
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  /**
   * Efeito Sonoro: Rolagem de Dado d20 sobre madeira rústica (Toque sutil e discreto)
   */
  public playDiceRoll() {
    const ctx = this.getOrCreateContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [0, 0.07, 0.15, 0.24].forEach((delay, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(340 + Math.random() * 220, now + delay);
      osc.frequency.exponentialRampToValueAtTime(120 + Math.random() * 50, now + delay + 0.05);
      gain.gain.setValueAtTime(0.05 / (i + 1), now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + 0.06);
    });
  }

  /**
   * Efeito Sonoro: Sino de Balcão da Taverna (Chime límpido, suave e macio)
   */
  public playBellChime() {
    const ctx = this.getOrCreateContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [1560, 3120, 4680].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.045 / (idx + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.3);
    });
  }

  /**
   * Efeito Sonoro: Brinde com Caneca de Carvalho / Taça da Taverna (Macio e discreto)
   */
  public playToastSound() {
    const ctx = this.getOrCreateContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [1920, 2450].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);
      gain.gain.setValueAtTime(0.05, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.7);
    });
  }

  /**
   * Efeito Sonoro: Labareda da Tocha / Fogo Crepitante (Sutil)
   */
  public playFlameWhoosh() {
    const ctx = this.getOrCreateContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(380, now + 0.12);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.35);
    gain.gain.setValueAtTime(0.045, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  }
}

export const tavernAudio = new TavernAudioService();
