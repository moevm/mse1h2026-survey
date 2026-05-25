from fastapi import Depends

from models import User, UserRole
from utils import auth
from utils.permissions import RoleChecker


def public_access():
    return None


def authenticated_access(current_user: User = Depends(auth.get_current_user_required)):
    return current_user


admin_access = RoleChecker([UserRole.ADMIN])
