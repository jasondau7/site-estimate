from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from fastapi.security import OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from jose import JWTError, jwt
from passlib.context import CryptContext
from pymongo import MongoClient
from datetime import datetime, timedelta
from typing import List, Optional
from bson import ObjectId

# --- Configuration & Database ---
# CONNECTION STRING FROM YOUR OLD FILE
URI = "mongodb+srv://dauj_db_user:OCeIlVI7Y5pq0hZK@cluster0.uqu3qfd.mongodb.net/"
DB_NAME = "finaldb"

client = MongoClient(URI)
db = client[DB_NAME]

try:
    client.admin.command('ping')
    print("✅ MongoDB Connected Successfully!")
except Exception as e:
    print(f"❌ MongoDB Connection Failed: {e}")

users_collection = db["users"]
materials_collection = db["materials"]
projects_collection = db["projects"]

SECRET_KEY = "SUPER_SECRET_KEY_PLZ_CHANGE" # In production, use env var
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 400

# --- Auth Helpers ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# --- Pydantic Models ---
class UserCreate(BaseModel):
    email: str
    password: str
    username: str

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class Material(BaseModel):
    name: str
    unit: str
    coverage: float
    imageUrl: Optional[str] = None # Base64 string

class MaterialInDB(Material):
    id: str
    created_by: str

class Project(BaseModel):
    title: str
    date: datetime = Field(default_factory=datetime.utcnow)
    dimensions: dict # {"length": 10, "width": 10}
    calculated_materials: List[dict] # [{"name": "Paint", "qty": 2}]

class ProjectInDB(Project):
    id: str
    user_id: str

# --- WebSocket Manager ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

# --- App Init ---
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Dependencies ---
def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = users_collection.find_one({"email": email})
    if user is None:
        raise credentials_exception
    return {"email": user["email"], "id": str(user["_id"]), "username": user.get("username", "User")}

# --- Auth Endpoints ---
@app.post("/signup")
def signup(user: UserCreate):
    print("🚀 FRONTEND REACHED THE BACKEND!")

    if users_collection.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pw = get_password_hash(user.password)
    user_dict = user.dict()
    user_dict["hashed_password"] = hashed_pw
    del user_dict["password"]
    
    result = users_collection.insert_one(user_dict)
    return {"msg": "User created", "id": str(result.inserted_id)}

@app.post("/login", response_model=Token)
def login(user: UserLogin):
    db_user = users_collection.find_one({"email": user.email})
    if not db_user or not verify_password(user.password, db_user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": db_user["email"]}, expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me")
def read_users_me(current_user: dict = Depends(get_current_user)):
    return current_user

# --- Material Endpoints (The CRUD Feature) ---
@app.get("/materials", response_model=List[MaterialInDB])
def get_materials():
    mats = list(materials_collection.find())
    results = []
    for m in mats:
        m["id"] = str(m["_id"])
        results.append(m)
    return results

@app.post("/materials", status_code=201)
def create_material(material: Material, current_user: dict = Depends(get_current_user)):
    mat_dict = material.dict()
    mat_dict["created_by"] = current_user["id"]
    result = materials_collection.insert_one(mat_dict)
    return {"msg": "Material added", "id": str(result.inserted_id)}

@app.delete("/materials/{material_id}")
def delete_material(material_id: str, current_user: dict = Depends(get_current_user)):
    # Optional: Check if current_user created it
    result = materials_collection.delete_one({"_id": ObjectId(material_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Material not found")
    return {"msg": "Deleted"}

# --- Project Endpoints (Saving Calculations) ---
@app.post("/projects")
def save_project(project: Project, current_user: dict = Depends(get_current_user)):
    proj_dict = project.dict()
    proj_dict["user_id"] = current_user["id"]
    projects_collection.insert_one(proj_dict)
    return {"msg": "Project saved"}

@app.get("/projects")
def get_my_projects(current_user: dict = Depends(get_current_user)):
    # Fetch projects for logged-in user
    projs = list(projects_collection.find({"user_id": current_user["id"]}))
    for p in projs:
        p["_id"] = str(p["_id"])
    return projs

# --- WebSocket Chat ---
@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Broadcast format: "Username: Message"
            await manager.broadcast(f"{client_id}: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        await manager.broadcast(f"{client_id} left the chat")