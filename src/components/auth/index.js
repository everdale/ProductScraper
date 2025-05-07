/**
 * Authentication Components Export
 * This file exports all authentication-related components for easier imports
 */

import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import ResetPasswordForm from './ResetPasswordForm';
import UpdatePasswordForm from './UpdatePasswordForm';
import ProfileForm from './ProfileForm';
import ProtectedRoute from './ProtectedRoute';
import { AuthProvider, useAuth } from '../../hooks/useAuth';

export {
  LoginForm,
  SignupForm,
  ResetPasswordForm,
  UpdatePasswordForm,
  ProfileForm,
  ProtectedRoute,
  AuthProvider,
  useAuth
}; 