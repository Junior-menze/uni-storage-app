import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Create a Supabase client with the service role key for admin access
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Query the auth.users table using the admin API
    // Note: This requires the service role key to be set in environment variables
    const { data: users, error } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', email)
      .maybeSingle()

    // Alternative approach: Check if the user exists by trying to get their profile
    // Since we can't directly query auth.users, we'll check the profiles table
    // and also try to find the user via the admin API
    
    // Use the admin API to list users (requires service role key)
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        },
      }
    )
    
    if (!response.ok) {
      // If admin API fails, fallback to checking profiles table
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('id', email)
        .maybeSingle()
      
      return NextResponse.json({ exists: !!profile })
    }
    
    const data = await response.json()
    const userExists = data?.users?.some((user: any) => user.email === email) ?? false
    
    return NextResponse.json({ exists: userExists })
  } catch (error) {
    console.error('Error checking email:', error)
    
    // Fallback: Return false on error
    return NextResponse.json({ exists: false })
  }
}