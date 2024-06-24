import { db } from '@/lib/db'

// token functionality
export const getPasswordResetTokenByToken = async (token: string) => {
  try {
    return await db.passwordResetToken.findUnique({
      where: { token }
    })
  } catch {
    return null
  }
}

// Token Email functionality (match emails)
export const getPasswordResetTokenByEmail = async (email: string) => {
  try {
    return await db.passwordResetToken.findFirst({
      where: { email }
    })
  } catch {
    return null
  }
}
