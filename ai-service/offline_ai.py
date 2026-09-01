# -*- coding: utf-8 -*-
"""
Offline AI service for SwasthAI — the air-gapped fallback for the kiosk.

Runs three local models on the machine's GPU so the whole intake works with NO
internet:
  * Whisper  (faster-whisper small)  -> speech-to-text        POST /stt
  * Gemma    (transformers, local)   -> LLM reasoning / JSON   POST /llm

Text-to-speech is handled offline in the kiosk itself via kokoro-js, so it is
not served here.

Launched with the venv that already has torch(cu118) + transformers + soundfile:
  E:\\sih\\projects\\KIOSK-AI_BASED_TELEMEDICINE\\ai-service\\.venv\\Scripts\\python.exe
"""
import base64
import io
import os
import threading

os.environ.setdefault("HF_HOME", r"E:\hf-cache")

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

GEMMA_REPO = os.environ.get("GEMMA_REPO", "google/gemma-4-E2B-it-qat-mobile-transformers")
WHISPER_MODEL = os.environ.get("WHISPER_MODEL", "small")
SAMPLE_RATE = 16000

app = FastAPI(title="SwasthAI Offline AI", version="1.0.0")
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

# --------------------------------------------------------------------------- #
#  lazy model loaders (load on first use, keep warm)
# --------------------------------------------------------------------------- #
_wlock = threading.Lock()
_whisper = None

_glock = threading.Lock()
_gemma = None
_gproc = None


def _torch():
    import torch
    return torch


def _device():
    return "cuda" if _torch().cuda.is_available() else "cpu"


def _dtype():
    torch = _torch()
    if not torch.cuda.is_available():
        return torch.float32
    major, _ = torch.cuda.get_device_capability()
    return torch.bfloat16 if major >= 8 else torch.float16


def load_whisper():
    global _whisper
    with _wlock:
        if _whisper is not None:
            return _whisper
        from faster_whisper import WhisperModel
        # Whisper runs on CPU (int8): its CTranslate2 backend needs CUDA-12 cuBLAS
        # which this box does not have (torch here is cu118). CPU int8 is fast
        # enough for short utterances (~5s) and keeps the GPU free for Gemma.
        device = os.environ.get("WHISPER_DEVICE", "cpu")
        _whisper = WhisperModel(
            WHISPER_MODEL,
            device=device,
            compute_type="float16" if device == "cuda" else "int8",
        )
        return _whisper


def load_gemma():
    global _gemma, _gproc
    with _glock:
        if _gemma is not None:
            return _gemma, _gproc
        from transformers import AutoModelForMultimodalLM, AutoProcessor
        _gproc = AutoProcessor.from_pretrained(GEMMA_REPO)
        _gemma = AutoModelForMultimodalLM.from_pretrained(
            GEMMA_REPO, dtype=_dtype(), device_map=_device(), low_cpu_mem_usage=True,
        )
        _gemma.eval()
        return _gemma, _gproc


def _decode_audio(audio_b64):
    if "," in audio_b64:
        audio_b64 = audio_b64.split(",", 1)[1]
    raw = base64.b64decode(audio_b64)
    import numpy as np
    import soundfile as sf
    data, sr = sf.read(io.BytesIO(raw), dtype="float32", always_2d=False)
    if data.ndim > 1:
        data = data.mean(axis=1)
    if sr != SAMPLE_RATE:
        import torchaudio.functional as AF
        t = _torch().from_numpy(np.ascontiguousarray(data)).unsqueeze(0)
        data = AF.resample(t, sr, SAMPLE_RATE).squeeze(0).numpy()
    return data.astype("float32")


# --------------------------------------------------------------------------- #
#  models
# --------------------------------------------------------------------------- #
class STTRequest(BaseModel):
    audio: str
    language: str | None = None   # e.g. "hi", "en", "gu" — None = auto-detect


class STTResponse(BaseModel):
    transcript: str
    language: str | None = None


class Turn(BaseModel):
    role: str
    content: str


class LLMRequest(BaseModel):
    messages: list[Turn] = []
    json_mode: bool = False
    temperature: float = 0.3
    max_new_tokens: int = 768


class LLMResponse(BaseModel):
    content: str


# --------------------------------------------------------------------------- #
#  routes
# --------------------------------------------------------------------------- #
@app.get("/health")
def health():
    torch = _torch()
    return {
        "status": "ok",
        "service": "offline-ai",
        "device": _device(),
        "gpu": torch.cuda.get_device_name(0) if torch.cuda.is_available() else None,
        "whisper_loaded": _whisper is not None,
        "gemma_loaded": _gemma is not None,
        "whisper_model": WHISPER_MODEL,
        "gemma_repo": GEMMA_REPO,
    }


@app.post("/stt", response_model=STTResponse)
def stt(req: STTRequest):
    if not req.audio:
        raise HTTPException(status_code=400, detail="audio_required")
    try:
        audio = _decode_audio(req.audio)
    except Exception:
        raise HTTPException(status_code=400, detail="invalid_audio")
    try:
        model = load_whisper()
        lang = req.language.split("-")[0] if req.language else None
        segments, info = model.transcribe(
            audio, language=lang, beam_size=5, vad_filter=True,
        )
        text = " ".join(s.text for s in segments).strip()
        return STTResponse(transcript=text, language=getattr(info, "language", lang))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"stt_failed: {exc}")


@app.post("/llm", response_model=LLMResponse)
def llm(req: LLMRequest):
    torch = _torch()
    try:
        model, proc = load_gemma()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"gemma_load_failed: {exc}")

    built = []
    for t in req.messages:
        role = t.role
        text = (t.content or "").strip()
        if role in ("system", "user", "assistant") and text:
            built.append({"role": role, "content": [{"type": "text", "text": text}]})
    if req.json_mode:
        built.append({
            "role": "user",
            "content": [{"type": "text", "text":
                         "Reply with ONLY a single valid JSON object. No prose, no markdown fences."}],
        })
    if not built:
        return LLMResponse(content="")

    try:
        with torch.inference_mode():
            inputs = proc.apply_chat_template(
                built, add_generation_prompt=True, tokenize=True,
                return_dict=True, return_tensors="pt",
            ).to(model.device)
            plen = inputs["input_ids"].shape[-1]
            out = model.generate(
                **inputs,
                max_new_tokens=req.max_new_tokens,
                do_sample=req.temperature > 0,
                temperature=max(req.temperature, 1e-4),
            )
            text = proc.decode(out[0][plen:], skip_special_tokens=True).strip()
        return LLMResponse(content=text)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"llm_failed: {exc}")
