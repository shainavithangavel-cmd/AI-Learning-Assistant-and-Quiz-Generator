import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';

// Pages
import Login from '../pages/Login';
import AdminDashboard from '../pages/AdminDashboard';
import UsersPage from '../pages/UsersPage';
import TrainerDashboard from '../pages/TrainerDashboard';
import TopicsAndNotesPage from '../pages/TopicsAndNotesPage';
import CreateQuizPage from '../pages/CreateQuizPage';
import QuestionReviewPage from '../pages/QuestionReviewPage';
import AssignQuizPage from '../pages/AssignQuizPage';
import TrainerQuizzesPage from '../pages/TrainerQuizzesPage';
import StudentDashboard from '../pages/StudentDashboard';
import AssignedQuizzesPage from '../pages/AssignedQuizzesPage';
import AttemptQuizPage from '../pages/AttemptQuizPage';
import ResultPage from '../pages/ResultPage';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Admin */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin/users" element={
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <UsersPage />
        </ProtectedRoute>
      } />

      {/* Trainer */}
      <Route path="/trainer" element={
        <ProtectedRoute allowedRoles={['TRAINER']}>
          <TrainerDashboard />
        </ProtectedRoute>
      } />
      <Route path="/trainer/topics" element={
        <ProtectedRoute allowedRoles={['TRAINER']}>
          <TopicsAndNotesPage />
        </ProtectedRoute>
      } />
      <Route path="/trainer/create-quiz" element={
        <ProtectedRoute allowedRoles={['TRAINER']}>
          <CreateQuizPage />
        </ProtectedRoute>
      } />
      <Route path="/trainer/quizzes" element={
        <ProtectedRoute allowedRoles={['TRAINER']}>
          <TrainerQuizzesPage />
        </ProtectedRoute>
      } />
      <Route path="/trainer/questions/:quizId" element={
        <ProtectedRoute allowedRoles={['TRAINER']}>
          <QuestionReviewPage />
        </ProtectedRoute>
      } />
      <Route path="/trainer/assign/:quizId" element={
        <ProtectedRoute allowedRoles={['TRAINER']}>
          <AssignQuizPage />
        </ProtectedRoute>
      } />

      {/* Student */}
      <Route path="/student" element={
        <ProtectedRoute allowedRoles={['STUDENT']}>
          <StudentDashboard />
        </ProtectedRoute>
      } />
      <Route path="/student/quizzes" element={
        <ProtectedRoute allowedRoles={['STUDENT']}>
          <AssignedQuizzesPage />
        </ProtectedRoute>
      } />
      <Route path="/student/attempt/:assignmentId" element={
        <ProtectedRoute allowedRoles={['STUDENT']}>
          <AttemptQuizPage />
        </ProtectedRoute>
      } />
      <Route path="/student/result/:attemptId" element={
        <ProtectedRoute allowedRoles={['STUDENT']}>
          <ResultPage />
        </ProtectedRoute>
      } />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
