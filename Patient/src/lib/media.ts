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

export const captureFrame = (video: HTMLVideoElement, maxWidth = 900): string | null => {
  if (!video.videoWidth) return null;

  const scale = Math.min(1, maxWidth / video.videoWidth);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);

  const context = canvas.getContext('2d');
  if (!context) return null;
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL('image/jpeg', 0.9).split('base64,')[1];
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
  await video.play().catch(() => undefined);
  return stream;
};

export const closeCamera = (stream: MediaStream | null) => {
  stream?.getTracks().forEach((track) => track.stop());
};
