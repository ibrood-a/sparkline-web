'use server'
import { getUserByEmail } from '@/data/user'
import { ResetSchema } from '@/schemas'
import { sendPasswordResetEmail } from '@/lib/mail'
import { generatePasswordResetToken } from '@/lib/tokens'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  if (req.method !== 'POST') {
    return new NextResponse('Method not allowed', { status: 405 })
  }

  try {

    const body = await req.json() // Parse the JSON body
    const validatedFields = ResetSchema.safeParse(body)

    // make sure fields meet requirements
    if (!validatedFields.success) {
      return new NextResponse('Invalid email!' , { status: 400 })
    }

    const { email } = validatedFields.data
    const existingUser = await getUserByEmail(email)

    if (!existingUser) {
      return { error: 'Email does not exist!' }
    }

    //send reset email
    const passwordResetToken = await generatePasswordResetToken(email)
    await sendPasswordResetEmail(
      passwordResetToken.email,
      passwordResetToken.token
    )

    return new NextResponse('Check your email for the', { status: 200 })
  } catch (error) {
    console.error(error)
    return new NextResponse( 'Internal server error', { status: 500 })
  }
}