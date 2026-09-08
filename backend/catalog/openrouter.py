"""Bounded hosted classification using an explicitly free Nemotron endpoint."""
import argparse
import json
import os
import time

import httpx

from .classification import Classification, classify_batch
from .db import migrate

DEFAULT_MODEL = "nvidia/nemotron-3-super-120b-a12b:free"


class ProviderError(RuntimeError):
    def __init__(self, code):
        self.code = code
        super().__init__(f"OpenRouter provider error {code}; completed projects retained")


class OpenRouter:
    def __init__(self, key, model=DEFAULT_MODEL, client=None):
        key = (key or "").strip()
        if not key:
            raise ValueError("Set OPENROUTER_API_KEY in the backend environment")
        if any(c.isspace() for c in key) or not key.isascii():
            raise ValueError("OPENROUTER_API_KEY contains invalid embedded whitespace or non-ASCII characters")
        if not model.startswith("nvidia/nemotron-") or not model.endswith(":free"):
            raise ValueError("Classification requires an explicitly free Nemotron model")
        self.model = model
        self.client = client or httpx.Client(timeout=180)
        self.key = key
        self.last_request = 0

    def generate(self, messages):
        for attempt in range(2):
            try:
                return self._generate_once(messages)
            except ProviderError as error:
                if attempt or error.code not in {502, 503, 504}:
                    raise

    def _generate_once(self, messages):
        delay = 3.1 - (time.monotonic() - self.last_request)
        if delay > 0:
            time.sleep(delay)
        self.last_request = time.monotonic()
        response = self.client.post("https://openrouter.ai/api/v1/chat/completions",
            headers={"Authorization": f"Bearer {self.key}", "X-Title": "Hackermind local classification"},
            json={"model": self.model, "messages": messages, "temperature": 0,
                  "max_tokens": 6000, "reasoning": {"effort": "low", "exclude": True},
                  "provider": {"require_parameters": True, "max_price": {"prompt": 0, "completion": 0}},
                  "response_format": {"type": "json_schema", "json_schema": {
                      "name": "project_classification", "strict": True, "schema": Classification.model_json_schema()}}})
        if response.status_code != 200:
            raise ProviderError(response.status_code)
        data = response.json()
        if data.get("error"):
            code = data["error"].get("code") if isinstance(data["error"], dict) else None
            code = code if isinstance(code, int) else "unknown"
            raise ProviderError(code)
        choices = data.get("choices") or []
        if not choices or choices[0].get("finish_reason") != "stop":
            raise ValueError("OpenRouter response was missing or incomplete; classification not saved")
        content = choices[0].get("message", {}).get("content")
        if not isinstance(content, str):
            raise ValueError("OpenRouter returned no classification text")
        return Classification.model_validate_json(content).model_dump()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--limit", type=int, choices=range(1, 21), default=5)
    parser.add_argument("--reprocess", action="store_true")
    args = parser.parse_args()
    try:
        with httpx.Client(timeout=180) as client:
            provider = OpenRouter(os.getenv("OPENROUTER_API_KEY"), os.getenv("OPENROUTER_MODEL", DEFAULT_MODEL), client)
            migrate()
            count = classify_batch(provider.generate, provider.model, args.limit, args.reprocess,
                                   progress=lambda result: print(json.dumps(result), flush=True))
            print(json.dumps({"classified": count, "model": provider.model}))
    except (ValueError, RuntimeError, httpx.HTTPError) as error:
        # Never dump request headers, full provider responses, or validation payloads.
        message = str(error) if type(error) in {ValueError, RuntimeError, ProviderError} else type(error).__name__
        parser.exit(1, f"Classification stopped: {message}\n")


if __name__ == "__main__":
    main()
