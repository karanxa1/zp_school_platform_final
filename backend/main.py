from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.core.logger import logger
from app.core.config import settings
from app.core.firebase import init_firebase

# Initialize Firebase before starting the app
init_firebase()

app = FastAPI(title=settings.PROJECT_NAME, openapi_url=f"{settings.API_V1_STR}/openapi.json")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"API Call: {request.method} {request.url.path}")
    try:
        response = await call_next(request)
        logger.info(f"API Response: {request.method} {request.url.path} - Status: {response.status_code}")
        return response
    except Exception as e:
        logger.exception(f"API Error: {request.method} {request.url.path} - {str(e)}")
        raise e

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Global exception caught for {request.method} {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"message": "Internal server error occurred.", "details": str(exc)},
    )

from app.routers import auth, students, staff, academics, attendance, fees, exams, homework, logistics, communication, reports_settings, parents

@app.get("/")
def root():
    return {"message": "Welcome to School ERP Platform API"}

app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(students.router, prefix=f"{settings.API_V1_STR}/students", tags=["students"])
app.include_router(staff.router, prefix=f"{settings.API_V1_STR}/staff", tags=["staff"])
app.include_router(parents.router, prefix=f"{settings.API_V1_STR}/parents", tags=["parents"])
app.include_router(academics.router, prefix=f"{settings.API_V1_STR}/academics", tags=["academics"])
app.include_router(attendance.router, prefix=f"{settings.API_V1_STR}/attendance", tags=["attendance"])
app.include_router(fees.router, prefix=f"{settings.API_V1_STR}/fees", tags=["fees"])
app.include_router(exams.router, prefix=f"{settings.API_V1_STR}/exams", tags=["exams"])
app.include_router(homework.router, prefix=f"{settings.API_V1_STR}/homework", tags=["homework"])
app.include_router(logistics.router, prefix=f"{settings.API_V1_STR}/logistics", tags=["logistics"])
app.include_router(communication.router, prefix=f"{settings.API_V1_STR}/communication", tags=["communication"])
app.include_router(reports_settings.router, prefix=f"{settings.API_V1_STR}/system", tags=["reports_settings"])