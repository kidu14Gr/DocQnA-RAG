import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()


class LLMModel:
    """
    Groq powered LLM for RAG generation
    """

    def __init__(self):
        self.client = Groq(
            api_key=os.getenv("GROQ_API_KEY")
        )

        self.model = os.getenv(
            "GROQ_MODEL",
            "llama-3.1-8b-instant"
        )

    # --------------------------------------------

    @staticmethod
    def _looks_document_question(text: str) -> bool:
        lowered = text.lower()
        keywords = [
            "document",
            "doc",
            "docx",
            "pdf",
            "file",
            "uploaded",
            "report",
            "paper",
            "manual",
            "contract",
            "resume",
            "in the document",
            "in the file",
            "in the pdf",
            "according to the document",
            "from the document",
            "based on the document",
            "page",
            "section",
            "chapter",
            "table",
            "figure",
        ]
        return any(keyword in lowered for keyword in keywords)

    # --------------------------------------------

    def _chat(self, system_prompt: str, user_prompt: str, temperature: float, max_tokens: int) -> str:
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": user_prompt
                }
            ],
            temperature=temperature,
            max_tokens=max_tokens
        )

        return response.choices[0].message.content

    # --------------------------------------------

    def classify_intent(self, question: str, history: str = "") -> str:
        system_prompt = (
            "You are an intent classifier. Decide if the user's question requires information "
            "from an uploaded document or is a general question. Consider the conversation "
            "history for follow-up questions and pronouns. Respond with exactly one word: "
            "DOCUMENT or GENERAL."
        )

        user_prompt = (
            f"Conversation history:\n{history.strip() if history else 'NO PRIOR CONVERSATION'}\n\n"
            f"User question:\n{question}\n\n"
            "Label:"
        )

        response = self._chat(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.0,
            max_tokens=5
        )

        label = response.strip().upper()
        if "DOCUMENT" in label:
            return "DOCUMENT"
        if "GENERAL" in label:
            return "GENERAL"

        return "DOCUMENT" if self._looks_document_question(question) else "GENERAL"

    # --------------------------------------------

    def generate(self, prompt: str) -> str:
        return self._chat(
            system_prompt="You are a precise assistant that answers ONLY from provided context.",
            user_prompt=prompt,
            temperature=0.2,
            max_tokens=800
        )

    # --------------------------------------------

    def generate_general(self, prompt: str) -> str:
        return self._chat(
            system_prompt="You are a helpful assistant.",
            user_prompt=prompt,
            temperature=0.7,
            max_tokens=800
        )
