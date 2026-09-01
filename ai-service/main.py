from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import base64
import cv2
import numpy as np
import os
from insightface.app import FaceAnalysis
import uvicorn
from datetime import datetime

app = FastAPI(
    title="Face Recognition Service",
    description="Face embedding extraction using InsightFace",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.environ.setdefault("INSIGHTFACE_HOME", "./insightface_models")

face_app = FaceAnalysis(
    name="buffalo_l",
    providers=["CPUExecutionProvider"]
)
face_app.prepare(ctx_id=-1, det_size=(640, 640))

print("InsightFace loaded successfully")
print(f"Model: buffalo_l")
print(f"Embedding size: 512")

class FaceExtractRequest(BaseModel):
    image: str
    abhaId: Optional[str] = None

class FaceCompareRequest(BaseModel):
    image1: str
    image2: str

class FaceVerifyRequest(BaseModel):
    image: str
    embedding: List[float]

def decode_base64_image(image_b64: str) -> np.ndarray:
    try:
        if "base64," in image_b64:
            image_b64 = image_b64.split("base64,", 1)[1]
        elif "," in image_b64:
            image_b64 = image_b64.split(",", 1)[1]
        
        image_b64 = image_b64.strip()
        
        raw = base64.b64decode(image_b64)
        arr = np.frombuffer(raw, np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise ValueError("Invalid image data")
        
        return img
    except Exception as e:
        raise ValueError(f"Failed to decode image: {str(e)}")

@app.get("/")
async def root():
    return {
        "service": "Face Recognition Service",
        "version": "1.0.0",
        "status": "running",
        "model": "buffalo_l",
        "embedding_size": 512,
        "timestamp": datetime.now().isoformat(),
        "endpoints": {
            "extract": "POST /api/extract",
            "compare": "POST /api/compare",
            "verify": "POST /api/verify",
            "health": "GET /api/health"
        }
    }

@app.post("/api/extract")
async def extract_face_embedding(request: FaceExtractRequest):
    try:
        if not request.image:
            return {
                "success": False,
                "message": "Image is required",
                "embedding": None,
                "faces_detected": 0,
                "embedding_size": 0
            }
        
        img = decode_base64_image(request.image)
        print(f"[EXTRACT DIAG] image shape={getattr(img,'shape',None)} mean_brightness={float(img.mean()) if img is not None else 'NA':.1f}")
        faces = face_app.get(img)
        print(f"[EXTRACT DIAG] faces_detected={len(faces)}" + (f" det_score={float(faces[0].det_score):.3f}" if faces else ""))
        
        if not faces:
            return {
                "success": False,
                "message": "No face detected. Please provide a clear face photo.",
                "embedding": None,
                "faces_detected": 0,
                "embedding_size": 0
            }
        
        faces.sort(key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]), reverse=True)
        embedding = faces[0].normed_embedding.tolist()
        
        return {
            "success": True,
            "message": "Face embedding extracted successfully",
            "embedding": embedding,
            "faces_detected": len(faces),
            "embedding_size": len(embedding),
            "quality": float(faces[0].det_score),
            "abhaId": request.abhaId
        }
        
    except Exception as e:
        return {
            "success": False,
            "message": f"Error: {str(e)}",
            "embedding": None,
            "faces_detected": 0,
            "embedding_size": 0
        }

@app.post("/api/compare")
async def compare_faces(request: FaceCompareRequest):
    try:
        if not request.image1 or not request.image2:
            return {
                "success": False,
                "message": "Both images are required",
                "verified": False,
                "confidence": 0,
                "distance": 1
            }
        
        img1 = decode_base64_image(request.image1)
        img2 = decode_base64_image(request.image2)
        
        faces1 = face_app.get(img1)
        faces2 = face_app.get(img2)
        
        if not faces1 or not faces2:
            return {
                "success": False,
                "message": "Could not detect face in one or both images",
                "verified": False,
                "confidence": 0,
                "distance": 1
            }
        
        faces1.sort(key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]), reverse=True)
        faces2.sort(key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]), reverse=True)
        
        embedding1 = faces1[0].normed_embedding
        embedding2 = faces2[0].normed_embedding
        
        similarity = np.dot(embedding1, embedding2) / (np.linalg.norm(embedding1) * np.linalg.norm(embedding2))
        similarity = float(similarity)
        
        verified = similarity >= 0.75
        
        return {
            "success": True,
            "verified": verified,
            "confidence": similarity,
            "distance": 1 - similarity,
            "threshold": 0.75
        }
        
    except Exception as e:
        return {
            "success": False,
            "message": f"Error: {str(e)}",
            "verified": False,
            "confidence": 0,
            "distance": 1
        }

@app.post("/api/verify")
async def verify_face_with_embedding(request: FaceVerifyRequest):
    try:
        if not request.image:
            return {
                "success": False,
                "message": "Image is required",
                "verified": False,
                "confidence": 0,
                "distance": 1
            }
        
        if not request.embedding:
            return {
                "success": False,
                "message": "Stored embedding is required",
                "verified": False,
                "confidence": 0,
                "distance": 1
            }
        
        img = decode_base64_image(request.image)
        print(f"[EXTRACT DIAG] image shape={getattr(img,'shape',None)} mean_brightness={float(img.mean()) if img is not None else 'NA':.1f}")
        faces = face_app.get(img)
        print(f"[EXTRACT DIAG] faces_detected={len(faces)}" + (f" det_score={float(faces[0].det_score):.3f}" if faces else ""))
        
        if not faces:
            return {
                "success": False,
                "message": "No face detected",
                "verified": False,
                "confidence": 0,
                "distance": 1
            }
        
        faces.sort(key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]), reverse=True)
        new_embedding = faces[0].normed_embedding
        stored_embedding = np.array(request.embedding)
        
        similarity = np.dot(new_embedding, stored_embedding) / (np.linalg.norm(new_embedding) * np.linalg.norm(stored_embedding))
        similarity = float(similarity)
        verified = similarity >= 0.75
        
        return {
            "success": True,
            "verified": verified,
            "confidence": similarity,
            "distance": 1 - similarity,
            "threshold": 0.75,
            "faces_detected": len(faces)
        }
        
    except Exception as e:
        return {
            "success": False,
            "message": f"Error: {str(e)}",
            "verified": False,
            "confidence": 0,
            "distance": 1
        }

@app.get("/api/health")
async def health_check():
    try:
        dummy = np.zeros((112, 112, 3), dtype=np.uint8)
        faces = face_app.get(dummy)
        return {
            "success": True,
            "status": "healthy",
            "service": "Face Recognition Service",
            "model": "buffalo_l",
            "embedding_size": 512,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "success": False,
            "status": "unhealthy",
            "error": str(e)
        }

if __name__ == "__main__":
    print("=" * 60)
    print("Face Recognition Service Starting...")
    print("=" * 60)
    print(f"Server: http://localhost:8001")
    print(f"API Docs: http://localhost:8001/docs")
    print(f"Health: http://localhost:8001/api/health")
    print("=" * 60)
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=False
    )