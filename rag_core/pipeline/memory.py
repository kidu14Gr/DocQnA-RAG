from typing import TYPE_CHECKING

_LCConversationBufferMemory = None

if TYPE_CHECKING:
    from langchain.memory import ConversationBufferMemory as _LCConversationBufferMemory  # type: ignore
else:
    try:
        from langchain.memory import ConversationBufferMemory as _LCConversationBufferMemory
    except Exception:
        _LCConversationBufferMemory = None


if _LCConversationBufferMemory is not None:
    ConversationBufferMemory = _LCConversationBufferMemory
else:
    class ConversationBufferMemory:
        """
        Minimal fallback for ConversationBufferMemory when langchain doesn't ship it.
        Stores a simple text transcript and exposes the same two methods we use.
        """

        def __init__(self, memory_key: str = "history", return_messages: bool = False):
            self.memory_key = memory_key
            self.return_messages = return_messages
            self._buffer = []

        def load_memory_variables(self, inputs):
            if self.return_messages:
                return {self.memory_key: list(self._buffer)}

            lines = []
            for human, ai in self._buffer:
                lines.append(f"Human: {human}")
                lines.append(f"AI: {ai}")
            return {self.memory_key: "\n".join(lines)}

        def save_context(self, inputs, outputs):
            human = inputs.get("input") or inputs.get("question") or ""
            ai = outputs.get("output") or outputs.get("answer") or ""
            self._buffer.append((human, ai))
