# analyzer/chorus_analyzer.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import yt_dlp
import librosa
import numpy as np
import os

# 上一级目录的 downloads/audio_cache
CACHE_DIR = os.path.join(os.path.dirname(__file__), "..", "downloads", "audio_cache")
os.makedirs(CACHE_DIR, exist_ok=True)

RESULT_CACHE = {}

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


class AnalyzeRequest(BaseModel):
    bvid: str
    duration: float = 20.0  # 默认 20 秒


def normalize(arr):
    min_val, max_val = np.min(arr), np.max(arr)
    if max_val - min_val < 1e-6:
        return np.zeros_like(arr)
    return (arr - min_val) / (max_val - min_val)


def find_chorus(audio_path, window_duration=20.0):
    try:
        y, sr = librosa.load(audio_path, sr=22050, mono=True)
        hop = 512
        
        rms = librosa.feature.rms(y=y, frame_length=2048, hop_length=hop)[0]
        cent = librosa.feature.spectral_centroid(y=y, sr=sr, hop_length=hop)[0]
        score = 0.7 * normalize(rms) + 0.3 * normalize(cent)

        fps = sr / hop
        win_frames = max(1, int(window_duration * fps))
        
        if len(score) < win_frames:
            return 0.0
        
        conv = np.convolve(score, np.ones(win_frames), mode='valid')
        max_idx = np.argmax(conv)
        start = max_idx / fps
        
        total_dur = len(y) / sr
        if start + window_duration > total_dur:
            start = max(0, total_dur - window_duration)
        
        return round(start, 2)
    except Exception as e:
        print(f"analysis error: {e}")
        return 0.0


def download_audio(bvid):
    output = os.path.join(CACHE_DIR, bvid)
    mp3_path = f"{output}.mp3"
    
    if os.path.exists(mp3_path) and os.path.getsize(mp3_path) > 1000:
        return mp3_path
    
    opts = {
        'format': 'bestaudio/best',
        'outtmpl': output + ".%(ext)s",
        'postprocessors': [{'key': 'FFmpegExtractAudio', 'preferredcodec': 'mp3', 'preferredquality': '128'}],
        'quiet': True,
        'no_warnings': True,
    }

    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            ydl.download([f"https://www.bilibili.com/video/{bvid}"])
        return mp3_path if os.path.exists(mp3_path) else None
    except:
        return None


@app.get("/")
def health():
    return {"status": "ok"}


@app.post("/analyze")
def analyze(req: AnalyzeRequest):
    cache_key = f"{req.bvid}_{req.duration}"
    if cache_key in RESULT_CACHE:
        return RESULT_CACHE[cache_key]
    
    audio = download_audio(req.bvid)
    if not audio:
        return {"bvid": req.bvid, "start_time": 0.0, "status": "error"}
    
    start = find_chorus(audio, req.duration)
    result = {"bvid": req.bvid, "start_time": start, "duration": req.duration, "status": "success"}
    RESULT_CACHE[cache_key] = result
    return result


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
