import React, { useEffect, useState } from 'react'
import SubjectCard from '../components/SubjectCard'
import { getSubjects, supabase } from '../lib/supabaseClient'
import { useUser } from '@clerk/clerk-react'

export default function ClientHome() {
  const { user } = useUser()
  const [subjects, setSubjects] = useState([])

  const fetchSubjects = async () => {
    try {
      const data = await getSubjects()
      setSubjects(data || [])
    } catch (e) { console.error(e) }
  }

  useEffect(() => {
    fetchSubjects()
    const subscription = supabase
      .channel('public:subjects')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subjects' }, payload => {
        fetchSubjects()
      })
      .subscribe()

    return () => { subscription.unsubscribe() }
  }, [])

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Subjects</h2>
        <div>{user ? <span className="text-sm">{user.primaryEmailAddress?.emailAddress}</span> : null}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {subjects.map(s => (
          <SubjectCard key={s.id} subject={s} readonly />
        ))}
      </div>
    </div>
  )
}
