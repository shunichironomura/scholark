from fastapi import HTTPException, Request, status
from fastapi.openapi.models import OAuthFlowPassword as OAuthFlowPasswordModel
from fastapi.openapi.models import OAuthFlows as OAuthFlowsModel
from fastapi.security import OAuth2
from fastapi.security.utils import get_authorization_scheme_param


class OAuth2PasswordBearerCookie(OAuth2):
    def __init__(
        self,
        *,
        tokenUrl: str,  # noqa: N803
        scheme_name: str | None = None,
        description: str | None = None,
        auto_error: bool = True,
    ) -> None:
        flows = OAuthFlowsModel(password=OAuthFlowPasswordModel(tokenUrl=tokenUrl, scopes={}))
        super().__init__(flows=flows, scheme_name=scheme_name, auto_error=auto_error, description=description)

    async def __call__(self, request: Request) -> str | None:
        # 1️⃣  check the cookie first
        if token := request.cookies.get("access_token"):
            # We stored the plain JWT string, so we're done.
            return token

        # 2️⃣  fall back to the usual header for docs / tests
        auth = request.headers.get("Authorization")
        scheme, param = get_authorization_scheme_param(auth)
        if auth and scheme.lower() == "bearer":
            return param

        if self.auto_error:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return None
