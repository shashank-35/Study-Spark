import { createClient } from '@supabase/supabase-js'

// NOTE: Set these environment variables in your .env file (Vite uses VITE_ prefix)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('[StudySpark] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env — Supabase calls will fail.')
}

// For admin operations, we'll use a service role approach or authenticated requests
// For now, let's create a client that can handle both anon and authenticated operations
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Helper function to get authenticated client (for admin operations)
export async function getAuthenticatedSupabase() {
  // For demo purposes, we'll try to use the anon key with a service role approach
  // In production, you would authenticate users and use their session tokens
  return supabase
}

// CRUD helpers exported for convenience
export async function getSubjects() {
  const { data, error } = await supabase.from('subjects').select('*').order('id', { ascending: true })
  if (error) throw error
  return data
}

export interface Subject {
  id: number;
  subject_name: string;
  description: string;
  progress: number;
  completion: number;
  next_topic: string;
  est_time: string;
  level: string;
  created_at: string;
  updated_at: string;
}

export async function addSubject(subject: Omit<Subject, 'id' | 'created_at' | 'updated_at'>) {
  // For admin operations, we need to handle authentication properly
  // For now, we'll use a direct approach that works with the current setup
  try {
    const { data, error } = await supabase
      .from('subjects')
      .insert([subject])
      .select();
    if (error) throw error;
    return data?.[0] as Subject;
  } catch (error) {
    console.error('Error adding subject:', error);
    // For demo purposes, let's try a different approach
    // In a real app, you would authenticate the user first
    throw new Error('Authentication required for admin operations. Please ensure you are logged in as an admin user.');
  }
}

export async function updateSubject(id: number, updates: Partial<Subject>) {
  try {
    const { data, error } = await supabase
      .from('subjects')
      .update(updates)
      .eq('id', id)
      .select();
    if (error) throw error;
    return data?.[0] as Subject;
  } catch (error) {
    console.error('Error updating subject:', error);
    throw new Error('Authentication required for admin operations. Please ensure you are logged in as an admin user.');
  }
}

export async function deleteSubject(id: number) {
  try {
    const { error } = await supabase.from('subjects').delete().eq('id', id)
    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting subject:', error);
    throw new Error('Authentication required for admin operations. Please ensure you are logged in as an admin user.');
  }
}

// Study Materials CRUD Operations
export interface StudyMaterial {
  id: string;
  subject_name: string;
  file_name: string;
  file_size: number;
  file_url?: string;
  file_data?: string; // Base64 for small files
  file_type: string;
  uploaded_at: string;
  created_at?: string;
  updated_at?: string;
}

export async function getStudyMaterials(subjectName?: string) {
  try {
    let query = supabase.from('study_materials').select('*').order('uploaded_at', { ascending: false });
    
    if (subjectName) {
      query = query.eq('subject_name', subjectName);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data as StudyMaterial[];
  } catch (error) {
    console.error('Error fetching study materials:', error);
    return [];
  }
}

export async function addStudyMaterial(material: Omit<StudyMaterial, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const { data, error } = await supabase
      .from('study_materials')
      .insert([material])
      .select();
    if (error) throw error;
    return data?.[0] as StudyMaterial;
  } catch (error) {
    console.error('Error adding study material:', error);
    throw error;
  }
}

export async function deleteStudyMaterial(id: string) {
  try {
    const { error } = await supabase
      .from('study_materials')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting study material:', error);
    throw error;
  }
}

export async function subscribeToStudyMaterials(callback: (materials: StudyMaterial[]) => void) {
  const subscription = supabase
    .channel('study_materials_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'study_materials' },
      async () => {
        const materials = await getStudyMaterials();
        callback(materials);
      }
    )
    .subscribe();
  
  return subscription;
}
