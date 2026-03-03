import React, { useEffect, useState } from 'react'
import { useUser, SignedIn, SignedOut, SignInButton, SignOutButton } from '@clerk/clerk-react'
import SubjectCard from '../components/SubjectCard'
import { getSubjects, addSubject, updateSubject, deleteSubject, supabase } from '../lib/supabaseClient'

export default function AdminDashboard() {
  const { user } = useUser()
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(null as any)
  const [form, setForm] = useState({ subject_name: '', description: '', progress: 0, completion: 0, next_topic: '', est_time: '', level: 'Beginner' })

  const fetchSubjects = async () => {
    setLoading(true)
    try {
      const data = await getSubjects()
      setSubjects(data || [])
    } catch (e) {
      console.error(e)
      alert('Failed to fetch subjects')
    } finally { setLoading(false) }
  }

  useEffect(() => {
    fetchSubjects()

    // real-time updates (bonus)
    const subscription = supabase
      .channel('public:subjects')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subjects' }, payload => {
        fetchSubjects()
      })
      .subscribe()

    return () => { subscription.unsubscribe() }
  }, [])

  const handleAdd = async () => {
    try {
      const created = await addSubject(form)
      setForm({ subject_name: '', description: '', progress: 0, completion: 0, next_topic: '', est_time: '', level: 'Beginner' })
      fetchSubjects()
      alert('Subject added')
    } catch (e) { console.error(e); alert('Add failed') }
  }

  const handleUpdate = async () => {
    if (!editing) return
    try {
      await updateSubject(editing.id, form)
      setEditing(null)
      setForm({ subject_name: '', description: '', progress: 0, completion: 0, next_topic: '', est_time: '', level: 'Beginner' })
      fetchSubjects()
      alert('Subject updated')
    } catch (e) { console.error(e); alert('Update failed') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this subject?')) return
    try {
      await deleteSubject(id)
      fetchSubjects()
      alert('Deleted')
    } catch (e) { console.error(e); alert('Delete failed') }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Admin Dashboard</h2>
        <div className="flex gap-2 items-center">
          {user ? <span className="text-sm">{user.emailAddresses?.[0]?.emailAddress}</span> : null}
          <SignOutButton />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-1 md:col-span-1">
          <h3 className="text-lg font-semibold mb-2">Add / Edit Subject</h3>
          <input className="w-full mb-2 p-2 border rounded" placeholder="Subject name" value={form.subject_name} onChange={e => setForm({ ...form, subject_name: e.target.value })} />
          <textarea className="w-full mb-2 p-2 border rounded" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <input type="number" className="w-full mb-2 p-2 border rounded" placeholder="Progress" value={form.progress} onChange={e => setForm({ ...form, progress: Number(e.target.value) })} />
          <input type="number" className="w-full mb-2 p-2 border rounded" placeholder="Completion %" value={form.completion} onChange={e => setForm({ ...form, completion: Number(e.target.value) })} />
          <input className="w-full mb-2 p-2 border rounded" placeholder="Next topic" value={form.next_topic} onChange={e => setForm({ ...form, next_topic: e.target.value })} />
          <input className="w-full mb-2 p-2 border rounded" placeholder="Estimated time" value={form.est_time} onChange={e => setForm({ ...form, est_time: e.target.value })} />
          <select className="w-full mb-2 p-2 border rounded" value={form.level} onChange={e => setForm({ ...form, level: e.target.value })}>
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>

          <div className="flex gap-2">
            {!editing ? <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={handleAdd}>Add</button>
            : <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={handleUpdate}>Save</button>}
            <button className="px-3 py-1 bg-gray-300 rounded" onClick={() => { setEditing(null); setForm({ subject_name: '', description: '', progress: 0, completion: 0, next_topic: '', est_time: '', level: 'Beginner' }) }}>Reset</button>
          </div>
        </div>

        <div className="col-span-2">
          <h3 className="text-lg font-semibold mb-2">Subjects</h3>
          {loading ? <div>Loading...</div> : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subjects.map(s => (
                <SubjectCard key={s.id} subject={s} onEdit={(sub) => { setEditing(sub); setForm(sub) }} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
