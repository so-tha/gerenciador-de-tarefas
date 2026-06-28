import { getSession } from './db';

export async function createContext(req: Request) {
  const authHeader = req.headers.get('authorization');
  let user = null;
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const t = authHeader.substring(7);
    const session = await getSession(t);
    if (session) {
      user = {
        id: session.userId,
        username: session.username,
      };
      token = t;
    }
  }

  return {
    user,
    token,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
