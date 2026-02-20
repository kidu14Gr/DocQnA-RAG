def build_doc_prompt(question: str, context: str, history: str) -> str:
    """
    Document-grounded prompt with conversation history.
    """

    context = context.strip()
    question = question.strip()
    history = history.strip()

    return f"""
You are a document-grounded assistant.
Use the conversation history to resolve references (pronouns, follow-ups),
but answer ONLY from the provided document context.
If the answer is not in the context, say you don't know based on the document.
Cite like [source 1], [source 2] when you use document information.

--------------------------------
CONVERSATION HISTORY:
{history if history else "NO PRIOR CONVERSATION"}

DOCUMENT CONTEXT:
{context if context else "NO DOCUMENT CONTEXT AVAILABLE"}

USER QUESTION:
{question}

ANSWER:
"""


def build_general_prompt(question: str, history: str) -> str:
    """
    General assistant prompt with conversation history.
    """

    question = question.strip()
    history = history.strip()

    return f"""
You are a helpful assistant.
Use the conversation history to resolve references and maintain context.

--------------------------------
CONVERSATION HISTORY:
{history if history else "NO PRIOR CONVERSATION"}

USER QUESTION:
{question}

ANSWER:
"""
