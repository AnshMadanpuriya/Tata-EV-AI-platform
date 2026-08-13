from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from rag_chain import ask_ev_question


app = FastAPI(
    title="TataEV RAG Chatbot API",
    version="1.0.0"
)


# React frontend ko API call karne ki permission
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"]
)


class ChatRequest(BaseModel):
    message: str = Field(
        min_length=1,
        max_length=500
    )


class ChatResponse(BaseModel):
    answer: str


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "TataEV RAG Chatbot"
    }


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    question = request.message.strip()

    try:
        answer = ask_ev_question(question)

        return ChatResponse(
            answer=answer
        )

    except Exception as error:
        print(f"Chat API error: {error}")

        raise HTTPException(
            status_code=500,
            detail="Chatbot answer generate nahi kar paya."
        )