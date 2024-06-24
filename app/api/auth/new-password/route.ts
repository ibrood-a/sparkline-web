'use server'
import * as z from 'zod'
import { NewPasswordSchema } from '@/schemas'
import { getPasswordResetTokenByToken } from '@/data/password-reset-token'
import { getUserByEmail } from '@/data/user'
import bcrypt from 'bcrypt'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export const route = async (
  values: z.infer<typeof NewPasswordSchema>,
  token?: string | null
) => {
  // if error, return error
  if (!token) {
    return { error: 'Token is required' }
  }

  // validate fields
  const validatedFields = NewPasswordSchema.safeParse(values)

  // if not fields are not valid, return error
  if (!validatedFields.success) {
    return { error: 'Invalid Fields' }
  }

  // extract password
  const { password } = validatedFields.data

  // token validation
  const existingToken = await getPasswordResetTokenByToken(token)

  // if token not found, return error
  if (!existingToken) {
    return { error: 'Invalid Token' }
  }

  // check if token is expired (if it is less than the date we set, which is an hour)
  const hasExpired = new Date(existingToken.expires) < new Date()

  // if expired, return error
  if (hasExpired) {
    return { error: 'Token has expired' }
  }

  // check exisiting user
  const existingUser = await getUserByEmail(existingToken.email)

  // if user not found, return error
  if (!existingUser) {
    return { error: 'Email not found' }
  }
  // hash password
  const hashedPassword = await bcrypt.hash(password, 10)

  // update db
  await db.user.update({
    where: { id: existingUser.id },
    data: {
      password: hashedPassword
    }
  })

  // delete token
  await db.passwordResetToken.delete({
    where: { id: existingToken.id }
  })

  // return success message
  return { success: 'Password updated successfully' }
}

export async function POST(req: NextRequest) {
  if (req.method !== 'POST') {
    return new NextResponse('Method not allowed', { status: 405 })
  }

  try {

    const body = await req.json() // Parse the JSON body
    const validatedFields = NewPasswordSchema.safeParse(body.values)

    const token = body.token
    if (!token) {
      return new NextResponse('Token required', { status: 400 })
    }

    // if not fields are not valid, return error
    if (!validatedFields.success) {
      return new NextResponse('Invalid Fields', { status: 400 })
    }

    // extract password
    const { password } = validatedFields.data
    const existingToken = await getPasswordResetTokenByToken(token)

    // if token not found, return error
    if (!existingToken) {
      return new NextResponse('Invalid token', { status: 400 })
    }

    if (new Date(existingToken.expires) < new Date()) {
      return new NextResponse('Token has expired', { status: 400 })
    }

    // check exisiting user
    const existingUser = await getUserByEmail(existingToken.email)
    if (!existingUser) {
      return new NextResponse('Email not found', { status: 400 })
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // update db
    await db.user.update({
      where: { id: existingUser.id },
      data: {
        password: hashedPassword
      }
    })

    // delete token
    await db.passwordResetToken.delete({
      where: { id: existingToken.id }
    })

    return new NextResponse('Password updated successfully', { status: 200 })
  } catch (error) {
    console.error(error)
    return new NextResponse( 'Internal server error', { status: 500 })
  }
}