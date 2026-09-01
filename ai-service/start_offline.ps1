# Launch the SwasthAI offline AI service (Whisper STT + Gemma LLM) on the GPU.
$env:HF_HOME = "E:\hf-cache"
$env:GEMMA_REPO = "google/gemma-4-E2B-it-qat-mobile-transformers"
$env:WHISPER_MODEL = "small"
$PY = "D:\sih\projects\KIOSK-AI_BASED_TELEMEDICINE\ai-service\.venv\Scripts\python.exe"
Set-Location "D:\sih\project_2\Ai_Clinical\ai-service"
& $PY -m uvicorn offline_ai:app --host 127.0.0.1 --port 8010
