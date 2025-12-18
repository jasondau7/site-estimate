from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from jose import JWTError, jwt
from jose.exceptions import ExpiredSignatureError
from datetime import datetime, timedelta
import bcrypt
from pymongo import MongoClient
from pymongo.errors import PyMongoError

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



# Simple root for quick testing
@app.get("/hello")
def hello():
    return {"message": "Hello from FastAPI"}