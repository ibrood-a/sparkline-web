'use server'

import { db } from '@/lib/db'
import { getUserByEmail } from '@/data/user'
import { getVerificationTokenByToken } from '@/data/verification-token'
import { NextRequest, NextResponse } from 'next/server'

export const route = async (token: string) => {
  // if no token, display message
  const exisitingToken = await getVerificationTokenByToken(token)

  if (!exisitingToken) {
    return { error: 'Token does not exisit!' }
  }
  // if token has expired, display message
  const hasExpired = new Date(exisitingToken.expires) < new Date()

  if (hasExpired) {
    return { error: 'Token has expired!' }
  }
  // if user does not exist, display message
  const existingUser = await getUserByEmail(exisitingToken.email)

  if (!existingUser) {
    return { error: 'User does not exisit!' }
  }
  // update email value when they verify
  await db.user.update({
    where: { id: existingUser.id },
    data: {
      emailVerified: new Date(),
      email: exisitingToken.email
    }
  })
  // delete token
  await db.verificationToken.delete({
    where: { id: exisitingToken.id }
  })

  return { success: 'Email verified! Login to continue' }
}

export async function POST(req: NextRequest) {
  if (req.method !== 'POST') {
    return new NextResponse('Method not allowed', { status: 405 })
  }

  try {

    const body = await req.json() // Parse the JSON body
    const exisitingToken = await getVerificationTokenByToken(body)

    // make sure fields meet requirements
    if (!exisitingToken) {
      return new NextResponse('Token does not exist' , { status: 400 })
    }

    // if token has expired, display message
    if (new Date(exisitingToken.expires) < new Date()) {
      return new NextResponse('Token has expired' , { status: 400 })
    }

    // if user does not exist, display message
    const existingUser = await getUserByEmail(exisitingToken.email)
    if (!existingUser) {
      return new NextResponse('User does not exist' , { status: 400 })
    }

    // update email value when they verify
    await db.user.update({
      where: { id: existingUser.id },
      data: {
        emailVerified: new Date(),
        email: exisitingToken.email
      }
    })

    // delete token
    await db.verificationToken.delete({
      where: { id: exisitingToken.id }
    })

    return new NextResponse('Check your email to reset your password', { status: 200 })
  } catch (error) {
    console.error(error)
    return new NextResponse( 'Internal server error', { status: 500 })
  }
}