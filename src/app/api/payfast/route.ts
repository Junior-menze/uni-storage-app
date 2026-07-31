import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const { bookingId, amount, email, name } = await request.json()
    
    // PayFast merchant details (get these from PayFast after registration)
    const MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID || '10000100'
    const MERCHANT_KEY = process.env.PAYFAST_MERCHANT_KEY || 'your_merchant_key'
    const isTest = process.env.PAYFAST_MODE === 'test'
    
    // Build the data string for signature
    const data = {
      merchant_id: MERCHANT_ID,
      merchant_key: MERCHANT_KEY,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/booking`,
      notify_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payfast/notify`,
      name_first: name,
      email_address: email,
      m_payment_id: bookingId,
      amount: amount.toFixed(2),
      item_name: 'Uni-Storage Booking',
      item_description: `Storage booking ${bookingId}`
    }
    
    // Generate signature
    const dataString = Object.entries(data)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&')
    
    const signature = crypto
      .createHash('md5')
      .update(dataString + '&passphrase=' + (process.env.PAYFAST_PASSPHRASE || ''))
      .digest('hex')
    
    const payfastUrl = isTest 
      ? 'https://sandbox.payfast.co.za/eng/process'
      : 'https://www.payfast.co.za/eng/process'
    
    return NextResponse.json({
      url: payfastUrl,
      data: {
        ...data,
        signature
      }
    })
  } catch (error) {
    console.error('PayFast error:', error)
    return NextResponse.json(
      { error: 'Failed to initialize payment' },
      { status: 500 }
    )
  }
}