# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware

# from fastapi.staticfiles import StaticFiles
# from fastapi.responses import FileResponse

# from app.routes import router

# app = FastAPI(
#     title="Payroll Entry API",
#     version="1.0.0"
# )

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# app.include_router(router, prefix="/api")

# app.mount(
#     "/assets",
#     StaticFiles(directory="app/static/assets"),
#     name="assets",
# )


# @app.get("/")
# def frontend():
#     return FileResponse("app/static/index.html")

# @app.get("/")
# def home():
#     return {
#         "message": "Payroll API Running"
#     }


# @app.get("/health")
# def health():
#     return {
#         "status": "OK"
#     }




from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from app.routes import router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes
app.include_router(router, prefix="/api")

# Static assets from Vite build
app.mount("/assets", StaticFiles(directory="app/static/assets"), name="assets")

@app.get("/")
def serve_index():
    return FileResponse("app/static/index.html")

# IMPORTANT: must be after API routes
@app.get("/{full_path:path}")
def serve_spa(full_path: str):
    return FileResponse("app/static/index.html")