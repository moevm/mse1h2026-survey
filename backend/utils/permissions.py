from fastapi import HTTPException, Depends
from models import UserRole, User
from utils.auth import get_current_user_required

class RoleChecker:
    def __init__(self, allowed_roles: list[UserRole]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: User = Depends(get_current_user_required)):
        if user.role not in self.allowed_roles:
            raise HTTPException(status_code=403, detail="Доступ запрещен")
        return user