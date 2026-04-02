from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth.router import router as auth_router
from app.problems.router import router as problems_router
from app.execution.router import router as execution_router
from app.submissions.router import router as submissions_router

app = FastAPI(title="SQL Practice Platform", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(problems_router, prefix="/problems", tags=["problems"])
app.include_router(execution_router, prefix="/problems", tags=["execution"])
app.include_router(submissions_router, prefix="/users", tags=["submissions"])


@app.get("/health")
async def health():
    return {"status": "ok"}
