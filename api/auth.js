import supabase from './_supabase.js';
import jwt from 'jsonwebtoken';

// Middleware to verify Supabase JWT token
export async function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Missing token' });
  }
  try {
    // Supabase issues JWTs signed with its secret; we can verify via supabase.auth.api.getUser
    const { data: user, error } = await supabase.auth.api.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    req.user = user; // attach user info
    next();
  } catch (e) {
    console.error('Auth verification error', e);
    return res.status(500).json({ error: 'Auth verification failed' });
  }
}

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}
