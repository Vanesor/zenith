'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { Spinner } from '@/components/Spinner';

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  maxPoints: number;
  instructions: string;
  club: string;
  assignedBy: string;
  status: 'pending' | 'submitted' | 'overdue';
  submittedAt?: string;
  grade?: number;
  feedback?: string;
  assignmentType: string;
  timeLimit: number;
  allowNavigation: boolean;
  passingScore: number;
  isProctored: boolean;
}

export default function AssignmentDetails() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const assignmentId = params.id as string;

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchAssignment = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/assignments/${assignmentId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch assignment');
        }

        const data = await response.json();
        setAssignment(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load assignment');
      } finally {
        setLoading(false);
      }
    };

    fetchAssignment();
  }, [assignmentId, router, user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-50 dark:bg-red-900 p-4 rounded-lg">
          <h1 className="text-xl font-semibold text-red-700 dark:text-red-300">Error</h1>
          <p>{error}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-lg">
          <h1 className="text-xl font-semibold">Assignment Not Found</h1>
          <p>The requested assignment could not be found.</p>
          <Link href="/assignments" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            View All Assignments
          </Link>
        </div>
      </div>
    );
  }

  // Format due date
  const dueDate = new Date(assignment.dueDate);
  const formattedDueDate = dueDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  // Format due time
  const formattedDueTime = dueDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold">{assignment.title}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">{assignment.club}</p>
          </div>
          
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            assignment.status === 'submitted' ? 'bg-green-100 text-green-800' :
            assignment.status === 'overdue' ? 'bg-red-100 text-red-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            {assignment.status === 'submitted' ? 'Submitted' : 
             assignment.status === 'overdue' ? 'Overdue' : 'Pending'}
          </div>
        </div>

        <div className="prose dark:prose-dark max-w-none mb-6">
          <p>{assignment.description}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <p className="font-medium">Due Date</p>
            <p>{formattedDueDate} at {formattedDueTime}</p>
          </div>
          
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <p className="font-medium">Maximum Points</p>
            <p>{assignment.maxPoints} points</p>
          </div>
          
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <p className="font-medium">Assigned By</p>
            <p>{assignment.assignedBy}</p>
          </div>
          
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <p className="font-medium">Assignment Type</p>
            <p className="capitalize">{assignment.assignmentType || 'Regular'}</p>
          </div>
          
          {assignment.timeLimit && (
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <p className="font-medium">Time Limit</p>
              <p>{assignment.timeLimit} minutes</p>
            </div>
          )}
          
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <p className="font-medium">Passing Score</p>
            <p>{assignment.passingScore || 60}%</p>
          </div>
        </div>

        {assignment.status === 'submitted' && (
          <div className="mb-6 p-4 border-l-4 border-green-500 bg-green-50 dark:bg-green-900 dark:border-green-700">
            <h2 className="text-lg font-semibold mb-2">Submission Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <p className="text-sm font-medium">Submitted On</p>
                <p>{new Date(assignment.submittedAt || '').toLocaleString()}</p>
              </div>
              
              {assignment.grade !== undefined && (
                <div>
                  <p className="text-sm font-medium">Grade</p>
                  <p>{assignment.grade} / {assignment.maxPoints} ({Math.round((assignment.grade / assignment.maxPoints) * 100)}%)</p>
                </div>
              )}
            </div>
            
            {assignment.feedback && (
              <div className="mt-2">
                <p className="text-sm font-medium">Feedback</p>
                <p className="whitespace-pre-line">{assignment.feedback}</p>
              </div>
            )}
          </div>
        )}

        {assignment.instructions && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Instructions</h2>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded whitespace-pre-line">
              {assignment.instructions}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3 mt-6">
          <Link href="/assignments" className="px-4 py-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-700">
            Back to Assignments
          </Link>
          
          {assignment.status === 'pending' && (
            <Link
              href={`/assignments/${assignmentId}/take`}
              className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ${
                new Date() > new Date(assignment.dueDate) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Start Assignment
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
