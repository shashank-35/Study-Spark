import { useUser } from '@clerk/clerk-react'

// Hook to get role from Clerk public metadata
export function useRole() {
  const { user } = useUser()
  // default to 'client' if no metadata
  const role = user?.publicMetadata?.role || 'client'
  return role
}
