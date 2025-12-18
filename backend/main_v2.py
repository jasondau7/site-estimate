from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from jose import JWTError, jwt
from jose.exceptions import ExpiredSignatureError
from datetime import datetime, timedelta
import bcrypt
from pymongo import MongoClient
from pymongo.errors import PyMongoError
from fastapi.middleware.cors import CORSMiddleware


# --- MongoDB connection ---
uri = "mongodb+srv://mgcarlson27_db_user:8byUmhUQziXhF3sB@cluster0.jwaq3g8.mongodb.net/"
client = MongoClient(uri)
db = client["cs3720db"] # Database name
collection = db["robots"] # Collection name (not robots.json, just robots)

#config for jwt
SECRET_KEY = "SUPER_SECRET_KEY_PLZ_CHANGE"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 120

# ======== BCRYPT HELPERS (NO PASSLIB) ========
def hash_password(password: str) -> str:
    # bcrypt works with bytes
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    # store as string
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8")
    )

# ======== SIMPLE USER "DB" (in-memory for demo) ========
fake_users_db = {}   # key: email, value: hashed_password

def save_user_to_db(email: str, hashed_pw: str):
    fake_users_db[email] = hashed_pw

    # Debugging
    print(fake_users_db)

def get_user_by_email(email: str):
    hashed_pw = fake_users_db.get(email)
    if not hashed_pw:
        return None
    return {"email": email, "hashed_password": hashed_pw}

# ======== Pydantic MODELS ========
class UserCreate(BaseModel):
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    token: str

# ======== OAUTH2 SCHEME (WHERE TOKEN COMES FROM) ========
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")  

# ======== JWT HELPERS ========
def create_jwt_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

app = FastAPI()

#Simple root for quick testing
@app.get("/hello")
def hello():
    return {"message": "Hello From FastAPI"}


# Optional: enable CORS if you’ll connect from React/React Native
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # or specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ======== Pydantic MODELS ========
class UserCreate(BaseModel):
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    token: str

# --- Minimal Pydantic model ---
class Robot(BaseModel):
    name: str
    price: float
    description: str
    imageUrl: str

# ======== 1) Implement Signup ========
@app.post("/signup")
def signup(user: UserCreate):
    # Check if user exists
    if user.email in fake_users_db:
        # Debugging
        print("New user :"+f" {user.email} already exists.")
        raise HTTPException(status_code=400, detail="User already exists")

    # Debugging
    print("New user :"+f" {user.email} {user.password}")

    hashed_pw = hash_password(user.password)
    save_user_to_db(user.email, hashed_pw)
    # Debugging
    print("DB :",fake_users_db)
    return {"msg": "signup ok"}

# ======== 2) Implement Login ========
@app.post("/login", response_model=Token)
def login(user: UserLogin):
    db_user = get_user_by_email(user.email)
    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid credentials-User")

    if not verify_password(user.password, db_user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials-Password")

    # sub = subject (usually the user id or email)
    token = create_jwt_token({"sub": db_user["email"]})
    # Debugging
    print("Token :",token)
    # Debugging
    print("DB :",fake_users_db)
    return {"token": token}

# ======== 3) JWT Auth Dependency ========
def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")

        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")

        user = get_user_by_email(email)
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        
        return email
    
    except ExpiredSignatureError:
        # Token is valid but expired
        raise HTTPException(status_code=401, detail="Token expired")

    except JWTError:
        # Any other JWT problem (bad signature, malformed, etc.)
        raise HTTPException(status_code=401, detail="Invalid token")

# ======== 4) FastAPI Protected Route EXAMPLE ========
@app.get("/protected")
def read_protected_data(current_user: str = Depends(get_current_user)):
    # current_user is the email returned from get_current_user
    return {"msg": f"Hello {current_user}, this is protected data!"}

#== 5 ==
@app.get("/robots")
def get_robots():
    try:
        # Try to retrieve all documents from MongoDB
        robots = list(collection.find())
        # Force a runtime error
        # x = 1 / 0
        # Convert ObjectId to string for each robot
        for r in robots:
            r["_id"] = str(r["_id"])
        return robots
    except PyMongoError as e:
        print("Database error:", e)
        raise HTTPException(status_code=503, detail="Database not reachable")
    
    except Exception as e:
        print("Unexpected error:", e)
        raise HTTPException(status_code=500, detail="Internal server error")

#== 6 ==
@app.post("/robots", status_code=status.HTTP_201_CREATED)
def add_robot(robot: Robot):
    try:
        # --- Check if robot already exists ---
        existing = collection.find_one({"name": robot.name})
        if existing:
            raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail="Robot already exists"
        )
        # --- Insert into database ---
        collection.insert_one(robot.dict())
        return {"message": "Robot added successfully"}

    # --- Database connection or query failure ---
    except PyMongoError as e:
        print("Database error:", e)
        raise HTTPException(status_code=503, detail="Database not reachable")
    
    # --- Any unexpected Python error ---
    except Exception as e:
        print("Unexpected error:", e)
        raise HTTPException(status_code=500, detail="Internal server error")



# ======== 7) FastAPI Protected Route PUT /robots/name ========
@app.put("/robots/{name}", status_code=status.HTTP_200_OK)
def update_robot(name: str, robot: Robot, current_user: str = Depends(get_current_user)):
    try:
        # The next is only for DEBUGGing
        import sys
        # Force flush output
        print(f"\n=== PUT REQUEST RECEIVED ===", file=sys.stderr)
        print(f"Path parameter 'name': '{name}'", file=sys.stderr)
        print(f"Name length: {len(name)}", file=sys.stderr)
        print(f"Name repr: {repr(name)}", file=sys.stderr)
        sys.stderr.flush()

        # Trim whitespace and try to find the robot
        name = name.strip()
        existing = collection.find_one({"name": name})
        if not existing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Robot not found")
       
        # Only update price, description, imageUrl
        updates = {
            "price": robot.price,
            "description": robot.description,
            "imageUrl": robot.imageUrl
        }
        collection.update_one({"name": name}, {"$set": updates})
        return {"message": "Robot updated successfully"}
    
    # HTTPException inherits from Exception
    except HTTPException:
        # Re-throw so FastAPI can return the intended status code
        raise
    # --- Database-level error ---
    except PyMongoError as e:
        print("Database error:", e)
        raise HTTPException(status_code=503, detail="Database not reachable")
    # --- Any unexpected Python error ---
    except Exception as e:
      print("Unexpected error:", e)
      raise HTTPException(status_code=500, detail="Internal server error")