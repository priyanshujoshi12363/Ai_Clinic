export const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = String(reader.result || '');
      resolve(result.includes('base64,') ? result.split('base64,')[1] : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

export interface ListenResult {
  base64: string;
  mimeType: string;
  spoke: boolean;
}

export interface ListenHandle {
  result: Promise<ListenResult | null>;
  stop: () => void;
  cancel: () => void;
}

export interface ListenOptions {
  onLevel?: (level: number) => void;
  onSpeechStart?: () => void;
  silenceMs?: number;
  maxMs?: number;
  startTimeoutMs?: number;
  /** Voice must exceed (noiseFloor + this) to count as speech. Raise to ignore louder rooms. */
  speechMargin?: number;
  /** Absolute minimum level to ever treat as speech, regardless of noise floor. */
  minSpeechLevel?: number;
}

/**
 * Noise-aware push-to-nothing listener.
 *
 * It first measures the room's ambient level for ~400ms, then only treats sound
 * as the patient speaking when it rises clearly ABOVE that floor and stays up for
 * a few consecutive frames. A short cough or a passing voice that does not sustain
 * is ignored. Recording ends after the patient goes quiet for `silenceMs`.
 */
export const listenForSpeech = (opts: ListenOptions = {}): ListenHandle => {
  const {
    onLevel,
    onSpeechStart,
    silenceMs = 1400,
    maxMs = 22000,
    startTimeoutMs = 12000,
    speechMargin = 0.06,
    minSpeechLevel = 0.08
  } = opts;

  const CALIBRATION_MS = 350;
  const SUSTAIN_FRAMES = 2;

  let stream: MediaStream | null = null;
  let recorder: MediaRecorder | null = null;
  let context: AudioContext | null = null;
  let raf = 0;
  const chunks: Blob[] = [];
  let mimeType = 'audio/webm';

  let started = false;
  let speaking = false;
  let cancelled = false;
  let resolveResult: (value: ListenResult | null) => void = () => {};
  let stopTimer: number | null = null;
  let hardTimer: number | null = null;
  let startTimer: number | null = null;

  let noiseFloor = 0.04;
  let calibrating = true;
  let calibN = 0;
  let calibSum = 0;
  let calibStart = 0;
  let aboveRun = 0;

  const result = new Promise<ListenResult | null>((resolve) => {
    resolveResult = resolve;
  });

  const cleanup = () => {
    cancelAnimationFrame(raf);
    if (stopTimer) clearTimeout(stopTimer);
    if (hardTimer) clearTimeout(hardTimer);
    if (startTimer) clearTimeout(startTimer);
    stream?.getTracks().forEach((t) => t.stop());
    context?.close().catch(() => undefined);
    stream = null;
    context = null;
    recorder = null;
  };

  const finish = async (spoke: boolean) => {
    if (!recorder) {
      cleanup();
      resolveResult(null);
      return;
    }
    const rec = recorder;
    recorder = null;
    rec.onstop = async () => {
      const blob = new Blob(chunks, { type: mimeType });
      const base64 = await blobToBase64(blob);
      cleanup();
      // Send if the patient spoke, or if they tapped Done with enough audio captured.
      if (cancelled || (!spoke && blob.size < 1400) || blob.size < 900) {
        resolveResult(null);
        return;
      }
      resolveResult({ base64, mimeType: mimeType.split(';')[0], spoke: true });
    };
    try {
      rec.stop();
    } catch {
      cleanup();
      resolveResult(null);
    }
  };

  (async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1
        }
      });
      if (cancelled) { cleanup(); resolveResult(null); return; }

      const preferred = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
      mimeType = preferred.find((t) => MediaRecorder.isTypeSupported(t)) || '';

      recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.start(200);

      context = new AudioContext();
      const source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.75;
      source.connect(analyser);
      // Focus on the speech band (~300Hz–3.4kHz) instead of the whole spectrum,
      // so hums, fans and low rumble contribute little.
      const data = new Uint8Array(analyser.frequencyBinCount);
      const sampleRate = context.sampleRate;
      const binHz = sampleRate / analyser.fftSize;
      const loBin = Math.max(1, Math.floor(300 / binHz));
      const hiBin = Math.min(data.length - 1, Math.ceil(3400 / binHz));

      calibStart = performance.now();
      hardTimer = window.setTimeout(() => finish(speaking), maxMs);
      startTimer = window.setTimeout(() => { if (!started) finish(false); }, startTimeoutMs);

      const tick = () => {
        if (!context) return;
        analyser.getByteFrequencyData(data);
        let sum = 0;
        for (let i = loBin; i <= hiBin; i++) sum += data[i];
        const level = Math.min(1, sum / (hiBin - loBin + 1) / 80);
        onLevel?.(started ? level : level * 0.6);

        if (calibrating) {
          calibSum += level;
          calibN++;
          if (performance.now() - calibStart >= CALIBRATION_MS) {
            noiseFloor = calibSum / Math.max(1, calibN);
            calibrating = false;
          }
          raf = requestAnimationFrame(tick);
          return;
        }

        const threshold = Math.max(minSpeechLevel, noiseFloor + speechMargin);

        if (level >= threshold) {
          aboveRun++;
          if (!started && aboveRun >= SUSTAIN_FRAMES) {
            started = true;
            speaking = true;
            if (startTimer) { clearTimeout(startTimer); startTimer = null; }
            onSpeechStart?.();
          }
          if (started && stopTimer) { clearTimeout(stopTimer); stopTimer = null; }
        } else {
          aboveRun = 0;
          if (started && !stopTimer) {
            stopTimer = window.setTimeout(() => finish(true), silenceMs);
          }
        }

        raf = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      cleanup();
      resolveResult(null);
    }
  })();

  return {
    result,
    // Manual "Done": force-send whatever was captured, even if the detector
    // never tripped (covers quiet voices / a too-strict threshold).
    stop: () => finish(true),
    cancel: () => { cancelled = true; finish(false); }
  };
};

export class Recorder {
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private stream: MediaStream | null = null;

  mimeType = 'audio/webm';

  async start(): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1
      }
    });

    const preferred = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
    this.mimeType = preferred.find((type) => MediaRecorder.isTypeSupported(type)) || '';

    this.chunks = [];
    this.recorder = new MediaRecorder(this.stream, this.mimeType ? { mimeType: this.mimeType } : undefined);
    this.recorder.ondataavailable = (event) => {
      if (event.data.size > 0) this.chunks.push(event.data);
    };
    this.recorder.start();
  }

  async stop(): Promise<{ base64: string; mimeType: string; durationOk: boolean }> {
    return new Promise((resolve, reject) => {
      if (!this.recorder) {
        reject(new Error('Recorder was not started'));
        return;
      }

      this.recorder.onstop = async () => {
        try {
          const type = this.mimeType || 'audio/webm';
          const blob = new Blob(this.chunks, { type });
          const base64 = await blobToBase64(blob);
          this.release();
          resolve({ base64, mimeType: type.split(';')[0], durationOk: blob.size > 2000 });
        } catch (error) {
          this.release();
          reject(error);
        }
      };

      this.recorder.stop();
    });
  }

  release() {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    this.recorder = null;
  }
}

export class LevelMeter {
  private context: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private raf = 0;
  private data: Uint8Array = new Uint8Array(0);

  async attach(onLevel: (level: number) => void) {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.context = new AudioContext();
    const source = this.context.createMediaStreamSource(stream);
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 256;
    source.connect(this.analyser);
    this.data = new Uint8Array(this.analyser.frequencyBinCount);

    const tick = () => {
      if (!this.analyser) return;
      this.analyser.getByteFrequencyData(this.data as any);
      let sum = 0;
      for (let i = 0; i < this.data.length; i++) sum += this.data[i];
      onLevel(Math.min(1, sum / this.data.length / 90));
      this.raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(this.raf);
      stream.getTracks().forEach((track) => track.stop());
      this.context?.close();
      this.context = null;
      this.analyser = null;
    };
  }
}

let activeAudio: HTMLAudioElement | null = null;
let playToken = 0;

export const stopSpeech = () => {
  playToken++;
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.src = '';
    activeAudio = null;
  }
};

export const playChunks = async (
  audios: string[] | undefined | null,
  format = 'wav'
): Promise<void> => {
  if (!audios || audios.length === 0) return;

  stopSpeech();
  const token = ++playToken;

  for (const chunk of audios) {
    if (token !== playToken) return;

    await new Promise<void>((resolve) => {
      const audio = new Audio(`data:audio/${format};base64,${chunk}`);
      activeAudio = audio;
      audio.onended = () => resolve();
      audio.onerror = () => resolve();
      audio.play().catch(() => resolve());
    });
  }

  if (token === playToken) activeAudio = null;
};

/** Plays a pre-recorded prompt from a URL, honouring the same stop control. */
export const playUrl = async (url: string): Promise<boolean> => {
  stopSpeech();
  const token = ++playToken;

  return new Promise<boolean>((resolve) => {
    const audio = new Audio(url);
    activeAudio = audio;
    let settled = false;
    const done = (ok: boolean) => {
      if (settled) return;
      settled = true;
      if (token === playToken) activeAudio = null;
      resolve(ok);
    };
    audio.onended = () => done(true);
    audio.onerror = () => done(false);
    audio.play().catch(() => done(false));
  });
};

export const captureFrame = (video: HTMLVideoElement, maxWidth = 900): string | null => {
  if (!video.videoWidth) return null;

  const scale = Math.min(1, maxWidth / video.videoWidth);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);

  const context = canvas.getContext('2d');
  if (!context) return null;
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL('image/jpeg', 0.92).split('base64,')[1];
};

/**
 * Waits until the webcam is actually producing frames (videoWidth > 0 and a
 * few frames painted), then captures. Prevents sending an empty/black frame
 * to face detection, which reads as "no face".
 */
export const captureWhenReady = async (
  video: HTMLVideoElement,
  maxWidth = 960,
  timeoutMs = 4000
): Promise<string | null> => {
  const start = performance.now();
  while (performance.now() - start < timeoutMs) {
    if (video.videoWidth > 0 && video.readyState >= 2) {
      // let a couple more frames render so auto-exposure settles
      await new Promise((r) => setTimeout(r, 350));
      return captureFrame(video, maxWidth);
    }
    await new Promise((r) => setTimeout(r, 120));
  }
  return video.videoWidth > 0 ? captureFrame(video, maxWidth) : null;
};

export const openCamera = async (
  video: HTMLVideoElement,
  facingMode: 'user' | 'environment' = 'user'
): Promise<MediaStream> => {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
    audio: false
  });
  video.srcObject = stream;

  // Wait for the first real frame so a capture right after this isn't empty.
  await new Promise<void>((resolve) => {
    let settled = false;
    const done = () => { if (!settled) { settled = true; resolve(); } };
    video.onloadedmetadata = () => { video.play().catch(() => undefined); };
    video.onloadeddata = done;
    video.play().catch(() => undefined);
    setTimeout(done, 2500);
  });

  return stream;
};

export const closeCamera = (stream: MediaStream | null) => {
  stream?.getTracks().forEach((track) => track.stop());
};
