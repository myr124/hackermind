import json
import httpx
import pytest
from catalog.openrouter import DEFAULT_MODEL, OpenRouter


def test_free_model_structured_request_and_validation():
    def respond(request):
        body = json.loads(request.content)
        assert body["model"] == DEFAULT_MODEL
        assert body["provider"]["max_price"] == {"prompt": 0, "completion": 0}
        assert body["response_format"]["type"] == "json_schema"
        assert request.headers["Authorization"] == "Bearer test-key"
        return httpx.Response(200, json={"choices": [{"finish_reason": "stop", "message": {"content": '{"assignments": []}'}}]})
    with httpx.Client(transport=httpx.MockTransport(respond)) as client:
        assert OpenRouter("test-key", client=client).generate([]) == {"assignments": []}


@pytest.mark.parametrize("status,body", [
    (429, {"error": {"message": "private provider details"}}),
    (200, {"error": {"message": "private provider details"}}),
    (200, {"choices": [{"finish_reason": "length", "message": {"content": "{}"}}]}),
    (200, {"choices": [{"finish_reason": "stop", "message": {"content": "invalid JSON"}}]}),
])
def test_failed_or_truncated_responses_are_not_accepted(status, body):
    with httpx.Client(transport=httpx.MockTransport(lambda _: httpx.Response(status, json=body))) as client:
        with pytest.raises((RuntimeError, ValueError)):
            OpenRouter("test-key", client=client).generate([])


def test_missing_key_and_paid_model_are_rejected_before_request():
    with pytest.raises(ValueError, match="OPENROUTER_API_KEY"):
        OpenRouter(None)
    with pytest.raises(ValueError, match="free"):
        OpenRouter("test-key", model="nvidia/nemotron-3-super-120b-a12b")
