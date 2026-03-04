import React, { useEffect, useState } from 'react'
import { getSubjects, supabase } from '../lib/supabaseClient'
import { useUser } from '@clerk/clerk-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'

interface SubjectData {
  id: number;
  subject_name?: string;
  name?: string;
  description?: string;
  level?: string;
  difficulty?: string;
  completion?: number;
  progress?: number;
}

export default function ClientHome() {
  const { user } = useUser()
  const [subjects, setSubjects] = useState<SubjectData[]>([])

  const fetchSubjects = async () => {
    try {
      const data = await getSubjects()
      setSubjects(data || [])
    } catch (e) { console.error(e) }
  }

  useEffect(() => {
    fetchSubjects()
    const channel = supabase
      .channel('public:subjects')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subjects' }, () => {
        fetchSubjects()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Subjects</h2>
        <div>{user ? <span className="text-sm">{user.primaryEmailAddress?.emailAddress}</span> : null}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {subjects.map((s) => (
          <Card key={s.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{s.name ?? s.subject_name ?? 'Untitled'}</CardTitle>
                <Badge variant="secondary">{s.difficulty ?? s.level ?? 'Beginner'}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">{s.description || 'No description'}</p>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-500"
                  style={{ width: `${s.completion ?? s.progress ?? 0}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground mt-1 block">
                {s.completion ?? s.progress ?? 0}% Complete
              </span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
