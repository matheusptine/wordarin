import { useContext } from 'react';
import { AuthContext } from './_context';

export function useAuth() {
  return useContext(AuthContext);
}
