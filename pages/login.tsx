import { useState } from 'react';
import { useRouter } from 'next/router';

console.log('Login component version: v3 - NO SUPABASE CLIENT');

// Mock supabase object to catch any accidental usage
const supabase = {
  from: (table: string) => {
    console.error('BLOCKED: Attempted to query table:', table);
    throw new Error(`Blocked database query to ${table} - login should be demo only!`);
  }
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Simple demo authentication - bypass database for now
      if (email === 'admin@menuca.local' && password === 'password123') {
        // Store demo user session
        localStorage.setItem('menuca_user', JSON.stringify({
          id: 'demo-user-id',
          email: 'admin@menuca.local',
          role: 'admin',
          tenant: {
            id: 'demo-tenant',
            name: 'Demo Restaurant',
            domain: 'demo.menuca.local'
          }
        }));
        
        console.log('Demo login successful, redirecting to dashboard...');
        router.push('/dashboard');
      } else {
        setError('Invalid email or password');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            MenuCA Dashboard
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Multi-tenant Restaurant Management Platform
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <div className="bg-blue-50 p-4 rounded-md">
            <p className="text-sm text-blue-700">
              <strong>Demo Credentials:</strong><br />
              Email: admin@menuca.local<br />
              Password: password123
            </p>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>

        <div className="mt-8 bg-gray-100 p-4 rounded-md">
          <h3 className="text-sm font-medium text-gray-900 mb-2">System Status</h3>
          <div className="text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Database:</span>
              <span className="text-green-600">✅ Connected</span>
            </div>
            <div className="flex justify-between">
              <span>API:</span>
              <span className="text-green-600">✅ Active</span>
            </div>
            <div className="flex justify-between">
              <span>Multi-tenant:</span>
              <span className="text-green-600">✅ Ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}