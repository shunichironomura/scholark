import { createCookieSessionStorage } from "react-router";

type SessionData = {
  accessToken: string;
  username: string;
  isSuperUser: boolean;
};

type SessionFlashData = {
  error: string;
};

const { getSession, commitSession, destroySession } = createCookieSessionStorage<SessionData, SessionFlashData>({
  // a Cookie from `createCookie` or the CookieOptions to create one
  cookie: {
    name: "__session",

    // all of these are optional
    // TODO: Configure the domain
    // domain: "reactrouter.com",
    // Expires can also be set (although maxAge overrides it when used in combination).
    // Note that this method is NOT recommended as `new Date` creates only one date on each server deployment, not a dynamic date in the future!
    //
    // expires: new Date(Date.now() + 60_000),
    httpOnly: true,
    maxAge: 3600 * 24 * 365, // 1 year
    path: "/",
    sameSite: "lax",
    secrets: [
      process.env.SCHOLARK_SESSION_SECRET ??
        (() => {
          throw new Error("SCHOLARK_SESSION_SECRET is not set");
        })(),
    ],
    secure: true,
  },
});

export { getSession, commitSession, destroySession };
