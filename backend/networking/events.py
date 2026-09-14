from dataclasses import dataclass
from typing import List, Dict, Any
import json

@dataclass
class ProtocolEvent:
    id: str
    protocol: str
    direction: str
    summary: str
    raw: str
    keyFields: List[Dict[str, str]]
    offsetMs: float
    status: str = "real"

def event_to_sse(event: Dict[str, Any]) -> str:
    return f"data: {json.dumps(event)}\n\n"

def done_sse() -> str:
    return "data: [DONE]\n\n"
