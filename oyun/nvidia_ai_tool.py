"""
NVIDIA API Aracı
----------------
NVIDIA entegrasyon API'si (integrate.api.nvidia.com) üzerinden
Llama 3.2 Vision, Kimi K3 gibi modelleri çağırmak için basit bir araç.

Kullanım (komut satırından):
    python nvidia_ai_tool.py "Merhaba, bana kısa bir şiir yaz"
    python nvidia_ai_tool.py "Bu görselde ne var?" --image-url https://ornek.com/resim.jpg
    python nvidia_ai_tool.py "Soru" --model "moonshotai/kimi-k2-instruct"

API anahtarı KODA GÖMÜLMEZ. Ortam değişkeninden okunur:
    Windows (PowerShell):  $env:NVIDIA_API_KEY = "nvapi-xxxxxxxx"
    Windows (cmd):         set NVIDIA_API_KEY=nvapi-xxxxxxxx
Anahtarınızı buraya yapıştırmayın.
"""

import os
import argparse
import requests

NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions"
DEFAULT_MODEL = "meta/llama-3.2-90b-vision-instruct"


def ask_nvidia_model(
    prompt: str,
    model: str = DEFAULT_MODEL,
    image_url: str = None,
    max_tokens: int = 1024,
    temperature: float = 0.3,
) -> str:
    """
    NVIDIA API üzerinden belirtilen modeli çalıştırır ve yanıt metnini döndürür.

    API anahtarı NVIDIA_API_KEY ortam değişkeninden okunur.
    """
    api_key = os.environ.get("NVIDIA_API_KEY")
    if not api_key:
        return (
            "Hata: NVIDIA_API_KEY ortam değişkeni tanımlı değil. "
            "Önce anahtarınızı ortam değişkeni olarak ayarlayın."
        )

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    content = [{"type": "text", "text": prompt}]
    if image_url:
        content.append({"type": "image_url", "image_url": {"url": image_url}})

    payload = {
        "model": model,
        "messages": [{"role": "user", "content": content}],
        "max_tokens": max_tokens,
        "temperature": temperature,
    }

    try:
        response = requests.post(NVIDIA_API_URL, headers=headers, json=payload, timeout=60)
    except requests.RequestException as exc:
        return f"İstek hatası: {exc}"

    if response.status_code == 200:
        try:
            return response.json()["choices"][0]["message"]["content"]
        except (KeyError, IndexError, ValueError):
            return f"Beklenmeyen yanıt biçimi: {response.text}"
    else:
        return f"Hata ({response.status_code}): {response.text}"


def main():
    parser = argparse.ArgumentParser(description="NVIDIA API üzerinden yapay zeka modeli çalıştırır.")
    parser.add_argument("prompt", help="Modele gönderilecek metin")
    parser.add_argument("--model", default=DEFAULT_MODEL, help="Kullanılacak model adı")
    parser.add_argument("--image-url", default=None, help="İsteğe bağlı görsel URL'si (vision modelleri için)")
    parser.add_argument("--max-tokens", type=int, default=1024)
    parser.add_argument("--temperature", type=float, default=0.3)
    args = parser.parse_args()

    result = ask_nvidia_model(
        prompt=args.prompt,
        model=args.model,
        image_url=args.image_url,
        max_tokens=args.max_tokens,
        temperature=args.temperature,
    )
    print(result)


if __name__ == "__main__":
    main()
