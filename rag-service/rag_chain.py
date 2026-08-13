import os
from pathlib import Path

from dotenv import load_dotenv
from langchain_chroma import Chroma
from langchain_mistralai import (
    ChatMistralAI,
    MistralAIEmbeddings,
)
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser


load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
CHROMA_DIR = BASE_DIR / "chroma_db"


def ask_ev_question(question: str) -> str:
    if not os.getenv("MISTRAL_API_KEY"):
        raise ValueError(
            "MISTRAL_API_KEY .env file mein nahi mili."
        )

    if not CHROMA_DIR.exists():
        raise FileNotFoundError(
            "chroma_db nahi mila. Pehle ingest.py chalao."
        )

    embeddings = MistralAIEmbeddings(
        model="mistral-embed"
    )

    vector_store = Chroma(
        collection_name="ev_vehicles",
        embedding_function=embeddings,
        persist_directory=str(CHROMA_DIR)
    )

    documents = vector_store.similarity_search(
        question,
        k=4
    )

    if not documents:
        return (
            "Is question ki information current "
            "EV knowledge base mein available nahi hai."
        )

    context = "\n\n".join(
        document.page_content
        for document in documents
    )

    prompt = ChatPromptTemplate.from_template(
        """
You are TataEV's helpful electric vehicle assistant.

Rules:
1. Answer using only the provided EV context.
2. Never invent specifications, price, range or features.
3. Clearly distinguish certified range and real-world range.
4. If information is unavailable, clearly say so.
5. Answer in the same language used by the user.

EV CONTEXT:
{context}

USER QUESTION:
{question}

ANSWER:
"""
    )

    model = ChatMistralAI(
        model="mistral-small-2603",
        temperature=0.1
    )

    chain = prompt | model | StrOutputParser()

    return chain.invoke(
        {
            "context": context,
            "question": question
        }
    )


if __name__ == "__main__":
    print("TataEV RAG Chatbot ready hai.")
    print("Band karne ke liye exit likho.\n")

    while True:
        user_question = input("You: ").strip()

        if user_question.lower() in {
            "exit",
            "quit"
        }:
            print("Chatbot band ho gaya.")
            break

        if not user_question:
            continue

        try:
            answer = ask_ev_question(user_question)
            print(f"\nAgent: {answer}\n")

        except Exception as error:
            print(f"\nError: {error}\n")