'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    async function handleCallback() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error) throw error
        
        if (user) {
          // Check if profile exists
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, role')
            .eq('id', user.id)
            .single()
          
          // If no profile, create one
          if (!profile) {
            await supabase
              .from('profiles')
              .insert({
                id: user.id,
                full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student',
                student_number: `STU${Date.now().toString().slice(-6)}`,
                campus: 'UMP',
                phone_number: 'Not provided',
                role: 'student'
              })
            
            // Fetch the profile again to get the role
            const { data: newProfile } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', user.id)
              .single()
            
            if (newProfile?.role === 'admin') {
              router.push('/admin')
            } else {
              router.push('/dashboard')
            }
          } else {
            // Redirect based on role
            if (profile.role === 'admin') {
              router.push('/admin')
            } else {
              router.push('/dashboard')
            }
          }
        } else {
          router.push('/auth')
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        router.push('/auth')
      }
    }
    
    handleCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="size-12 animate-spin text-brand mx-auto mb-4" />
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  )
}