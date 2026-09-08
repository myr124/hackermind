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
    def __init__(self, key, model=DEFAULT_MODEL, client=None, response_type=Classification):
        key = (key or "").strip()
        if not key:
            raise ValueError("Set OPENROUTER_API_KEY in the backend environment")
        if any(c.isspace() for c in key) or not key.isascii():
            raise ValueError("OPENROUTER_API_KEY contains invalid embedded whitespace or non-ASCII characters")
        if not model.startswith("nvidia/nemotron-") or not model.endswith(":free"):
            raise ValueError("Classification requires an explicitly free Nemotron model")
        self.model = model
        self.response_type = response_type
        self.use_tool_result = model == "nvidia/nemotron-3-ultra-550b-a55b:free"
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
        schema = self.response_type.model_json_schema()
        formatting = {"tools": [{"type": "function", "function": {"name": "catalog_result", "description": "Return the validated catalog result", "parameters": schema}}], "tool_choice": {"type": "function", "function": {"name": "catalog_result"}}} if self.use_tool_result else {"response_format": {"type": "json_schema", "json_schema": {"name": "catalog_result", "strict": True, "schema": schema}}}
        response = self.client.post("https://openrouter.ai/api/v1/chat/completions",
            headers={"Authorization": f"Bearer {self.key}", "X-Title": "Hackermind local classification"},
            json={"model": self.model, "messages": messages, "temperature": 0,
                  "max_tokens": 6000, "reasoning": {"effort": "low", "exclude": True},
                  "provider": {"require_parameters": True, "max_price": {"prompt": 0, "completion": 0}},
                  **formatting})
        if response.status_code != 200:
            raise ProviderError(response.status_code)
        data = response.json()
        if data.get("error"):
            code = data["error"].get("code") if isinstance(data["error"], dict) else None
            code = code if isinstance(code, int) else "unknown"
            raise ProviderError(code)
        choices = data.get("choices") or []
        if not choices or choices[0].get("finish_reason") not in ({"tool_calls", "stop"} if self.use_tool_result else {"stop"}):
            raise ValueError("OpenRouter response was missing or incomplete; classification not saved")
        content = choices[0].get("message", {}).get("content")
        if self.use_tool_result:
            calls = choices[0].get("message", {}).get("tool_calls") or []
            if len(calls) != 1 or calls[0].get("function", {}).get("name") != "catalog_result":
                raise ValueError("OpenRouter returned no catalog result tool call")
            content = calls[0]["function"].get("arguments")
        if not isinstance(content, str):
            raise ValueError("OpenRouter returned no classification text")
        return self.response_type.model_validate_json(content).model_dump()


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
