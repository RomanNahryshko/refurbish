'use client';

import { useState } from 'react';

export function ApiTest() {
  const [results, setResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const testEndpoint = async (name: string, url: string) => {
    setLoading(prev => ({ ...prev, [name]: true }));
    try {
      const response = await fetch(url);
      const data = await response.json();
      setResults(prev => ({ 
        ...prev, 
        [name]: { 
          status: response.status, 
          ok: response.ok, 
          data: response.ok ? data : data.error || 'Unknown error'
        } 
      }));
    } catch (error) {
      setResults(prev => ({ 
        ...prev, 
        [name]: { 
          status: 'error', 
          ok: false, 
          data: error instanceof Error ? error.message : 'Unknown error'
        } 
      }));
    } finally {
      setLoading(prev => ({ ...prev, [name]: false }));
    }
  };

  const endpoints = [
    { name: 'Profile API', url: '/api/user/profile' },
    { name: 'Health Check', url: '/api/health' },
  ];

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 bg-white border border-gray-300 p-4 rounded-lg shadow-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">🧪 API Test</h3>
      <div className="space-y-2">
        {endpoints.map(endpoint => (
          <div key={endpoint.name} className="flex items-center justify-between">
            <span className="text-xs">{endpoint.name}:</span>
            <div className="flex items-center space-x-2">
              {loading[endpoint.name] && <div className="animate-spin w-3 h-3 border border-blue-500 border-t-transparent rounded-full"></div>}
              <button
                onClick={() => testEndpoint(endpoint.name, endpoint.url)}
                disabled={loading[endpoint.name]}
                className="px-2 py-1 bg-blue-500 text-white rounded text-xs disabled:opacity-50"
              >
                Test
              </button>
            </div>
          </div>
        ))}
        {Object.keys(results).length > 0 && (
          <div className="mt-4 border-t pt-2">
            <h4 className="font-semibold mb-1">Results:</h4>
            {Object.entries(results).map(([name, result]) => (
              <div key={name} className="text-xs">
                <span className="font-medium">{name}:</span>
                <span className={`ml-1 ${result.ok ? 'text-green-600' : 'text-red-600'}`}>
                  {result.status} - {result.ok ? 'OK' : 'Error'}
                </span>
                {!result.ok && (
                  <div className="text-red-500 mt-1">{result.data}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
