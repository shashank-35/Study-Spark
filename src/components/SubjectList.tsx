import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

type Subject = {
  id: number;
  name?: string;
  subject_name?: string;
  description: string;
  progress?: number;
  completion?: number;
  next_topic?: string;
  est_time?: string;
  level?: string;
  difficulty?: string;
  semester?: number;
  credits?: number;
};

export default function SubjectList() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubjects();

    // Set up realtime subscription
    const channel = supabase
      .channel('subjects_changes')
      .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'subjects' },
          () => {
            fetchSubjects();
          }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('id', { ascending: true });
      
      if (error) throw error;
      setSubjects(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4">Loading subjects...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Available Subjects</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map((subject) => (
          <Card key={subject.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{subject.name ?? subject.subject_name ?? 'Untitled'}</CardTitle>
                <Badge variant={
                  (subject.difficulty ?? subject.level) === 'Beginner' ? 'default' :
                  (subject.difficulty ?? subject.level) === 'Intermediate' ? 'secondary' :
                  'destructive'
                }>
                  {subject.difficulty ?? subject.level ?? 'Beginner'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">{subject.description}</p>
              
              {/* Progress bar */}
              <div className="space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${subject.completion}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{subject.completion ?? 0}% Complete</span>
                  <span>{subject.progress ?? 0} Topics Done</span>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Next Topic:</span>
                  <span className="font-medium">{subject.next_topic || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Est. Time:</span>
                  <span className="font-medium">{subject.est_time || 'N/A'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {subjects.length === 0 && (
          <div className="col-span-full text-center py-8 text-gray-500">
            No subjects available yet.
          </div>
        )}
      </div>
    </div>
  );
}