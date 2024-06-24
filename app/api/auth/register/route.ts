import { NextRequest, NextResponse } from 'next/server'
import { RegisterSchema } from '@/schemas'
import bcrypt from 'bcrypt'
import { getUserByEmail } from '@/data/user'
import { db } from '@/lib/db'
import { generateVerificationToken } from '@/lib/tokens'
import { sendVerificationEmail } from '@/lib/mail'

export async function POST(req: NextRequest) {
  if (req.method !== 'POST') {
    return new NextResponse('Method not allowed', { status: 405 })
  }

  try {
    const body = await req.json() // Parse the JSON body
    const validatedFields = RegisterSchema.safeParse(body)

    if (!validatedFields.success) {
      return new NextResponse('Invalid fields', { status: 400 })
    }

    const { name, email, password } = validatedFields.data
    const hashedPassword = await bcrypt.hash(password, 10)

    const existingUser = await getUserByEmail(email)
    if (existingUser) {
      return new NextResponse('Email already exists', { status: 400 })
    }

    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    })

    const verificationToken = await generateVerificationToken(email)
    await sendVerificationEmail(verificationToken.email, verificationToken.token)

    return new NextResponse('Check your email for the verification email', { status: 200 })
  } catch (error) {
    return new NextResponse('Internal server error', { status: 500 })
  }
}