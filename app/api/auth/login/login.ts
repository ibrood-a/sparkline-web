'use server'
import * as z from 'zod'
import { LoginSchema } from '@/schemas'
import { signIn } from '@/auth'
import { AuthError } from 'next-auth'
import { generateVerificationToken } from '@/lib/tokens'
import { getUserByEmail } from '@/data/user'
import { sendVerificationEmail } from '@/lib/mail'

export const login = async (values: z.infer<typeof LoginSchema>) => {
  // Validate fields
  const validatedFields = LoginSchema.safeParse(values)

  // If fields are not valid
  if (!validatedFields.success) {
    return { error: 'Invalid fields' }
  }
  // If fields are valid
  const { email, password } = validatedFields.data
  const existingUser = await getUserByEmail(email)

  if (!existingUser || !existingUser.email || !existingUser.password) {
    return { error: 'Email does not exist' }
  }

  if (!existingUser.emailVerified) {
    const verificationToken = await generateVerificationToken(
      existingUser.email
    )

    await sendVerificationEmail(
      verificationToken.email,
      verificationToken.token
    )

    return { success: 'Email not verified, resending confirmation email' }
  }

  try {
    const result = await signIn('credentials', {
      redirect: false,
      email,
      password
    })

    console.log(result)
    if (result?.error) {
      return { error: result.error }
    }

    return { success: 'Logged In!' }
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { error: 'Invalid credentials' }
        default:
          return { error: 'Something went wrong' }
      }
    }
    throw error
  }
}

import { NextRequest, NextResponse } from 'next/server'


export async function POST(req: NextRequest) {
  if (req.method !== 'POST') {
    return new NextResponse('Method not allowed', { status: 405 })
  }

  try {
    // Validate fields
    const body = await req.json() // Parse the JSON body

    const validatedFields = LoginSchema.safeParse(body)

    // If fields are not valid
    if (!validatedFields.success) {
      return new NextResponse( 'Invalid fields', { status: 400 })
    }

    // If fields are valid
    const { email, password } = validatedFields.data
    const existingUser = await getUserByEmail(email)

    if (!existingUser || !existingUser.email || !existingUser.password) {
      return new NextResponse( 'Email does not exist', { status: 400 })
    }

    if (!existingUser.emailVerified) {
      const verificationToken = await generateVerificationToken(
        existingUser.email
      )

      await sendVerificationEmail(
        verificationToken.email,
        verificationToken.token
      )

      return new NextResponse('Email not verified, resending confirmation email', { status: 200 })
    }

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password
      })

      console.log(result)
      if (result?.error) {
        return new NextResponse( result.error, { status: 400 })
      }

      return new NextResponse('Logged In!', { status: 200 })
    } catch (error) {
      if (error instanceof AuthError) {
        switch (error.type) {
          case 'CredentialsSignin':
            return new NextResponse( 'Invalid credentials', { status: 400 })
          default:
            return new NextResponse( 'Internal server error', { status: 400 })
        }
      }
      throw error
    }
  } catch (error) {
    console.error(error)
    return new NextResponse( 'Internal server error', { status: 500 })
  }
}