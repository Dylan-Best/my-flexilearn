from passlib.context import CryptContext 
import dns.resolver
import random

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

"""_hashage de mot de passe_
"""
def hash_password(password : str ):
    return pwd_context.hash(password)

"""_vérifier si les mots de passe correspondent_
"""
def verify_password(plain_paswword,hashed_password):
    return pwd_context.verify(plain_paswword,hashed_password) 

"""_verfiier si le mail existe vraiment 
"""
import dns.resolver

def check_email_domain(email: str) -> bool:
    try:
        # Vérification format basique
        if "@" not in email:
            return False

        domain = email.split("@")[1]

        # Vérifie les enregistrements MX
        records = dns.resolver.resolve(domain, "MX")
        return len(records) > 0

    except dns.resolver.NXDOMAIN:
        return False
    except dns.resolver.NoAnswer:
        return False
    except dns.resolver.Timeout:
        return False
    except Exception as e:
        print("Erreur DNS:", e)
        return False
    

def generate_4_digit_code():
    return str(random.randint(1000, 9999))