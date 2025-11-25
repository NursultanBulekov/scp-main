from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine
from . import models
from .routers import auth, products, catalogs, entities, links, orders, admin, chat, team, complaints

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SCP Backend API",
    version="1.0.0",
    description="Backend services for SCP platform."
)

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Regex patterns for private IP subnets
# 10.0.0.0/8: matches 10.x.x.x
# 192.168.0.0/16: matches 192.168.x.x
# Also matches React Native WebView origins when loading HTTP/HTTPS URLs
origin_regex = r"^http[s]?://(10\.(\d{1,3}\.){2}\d{1,3}|192\.168\.(\d{1,3}\.)\d{1,3})(:\d+)?$"

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=origin_regex,
    allow_credentials=True, # Allow cookies/authentication headers
    allow_methods=["*"],    # Allow all HTTP methods (POST, GET, etc.)
    allow_headers=["*"],    # Allow all headers (Authorization, Content-Type, etc.)
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(products.router, prefix="/products", tags=["products"])
app.include_router(catalogs.router, prefix="/catalogs", tags=["catalogs"])
app.include_router(orders.router, prefix="/orders", tags=["orders"])
app.include_router(links.router, prefix="/links", tags=["links"])
app.include_router(entities.router, prefix="/entities", tags=["entities"])
app.include_router(admin.router, prefix="/admin", tags=["admin"])
app.include_router(chat.router)
app.include_router(team.router)
app.include_router(complaints.router)

@app.get("/", tags=["root"])
def read_root():
    return {"Hello": "World", "message": "API is running. Access /docs for swagger UI."}

@app.get("/health", tags=["health"])
def healthcheck():
    return {"status": "healthy"}
