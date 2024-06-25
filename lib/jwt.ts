import jwt from 'jwt-simple'

export function encode(payload: any) {
  return jwt.encode(payload, process.env.AUTH_SECRET!!, "HS256");
}

export function decode(token: string) {
  return jwt.decode(token, process.env.AUTH_SECRET!!, false, "HS256");
}