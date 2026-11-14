import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Github, Globe, Shield } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="brutal-card p-8 bg-white">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b-4 border-ink">
          <div className="w-16 h-16 rounded-full bg-finn border-4 border-ink flex items-center justify-center font-heading font-extrabold text-2xl">
            {user?.name?.[0] || 'U'}
          </div>
          <div>
            <h1 className="text-3xl font-extrabold font-heading">{user?.name}</h1>
            <span className="brutal-badge bg-jake text-ink text-xs">{user?.role}</span>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="font-bold text-xs uppercase text-gray-500 mb-1">Email (Private)</h3>
            <p className="font-mono font-medium">{user?.email}</p>
          </div>

          <div>
            <h3 className="font-bold text-xs uppercase text-gray-500 mb-2">Technical Skills</h3>
            <div className="flex flex-wrap gap-2">
              {user?.skills?.length ? (
                user.skills.map((s) => (
                  <span key={s} className="brutal-badge bg-paper text-ink">
                    {s}
                  </span>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No skills listed yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
