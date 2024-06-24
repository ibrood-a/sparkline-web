import { db } from '@/lib/db'

export const getVerificationTokenByToken = async (token: string) => {
  // Get Verification Token
  try {
    return await db.verificationToken.findUnique({
      where: { token }
    })
  } catch {
    return null
  }
}

export const getVerificationTokenByEmail = async (email: string) => {
  // Get Email Verification
  try {
    return await db.verificationToken.findFirst({
      where: { email }
    })
  } catch {
    return null
  }
}
