'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, Video, AlertCircle, ArrowRight, GraduationCap } from 'lucide-react';
import { getTestByCode } from '@/lib/storage';

export default function Home() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const test = getTestByCode(code.trim().toUpperCase());
    if (!test) {
      setError('Fant ingen prøve med denne koden. Sjekk at koden er riktig.');
      return;
    }
    
    router.push(`/test/${code.trim().toUpperCase()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 md:p-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Muntlig Vurdering
          </h1>
          <p className="text-gray-600">
            Digitalt verktøy for muntlige prøver
          </p>
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-8 rounded-r-lg">
          <div className="flex items-start">
            <AlertCircle className="w-6 h-6 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-800 mb-2">
                Viktig - Før du starter:
              </h3>
              <ul className="space-y-2 text-yellow-700 text-sm">
                <li className="flex items-start">
                  <Video className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Sørg for at du er logget inn på <strong>Microsoft Teams</strong></span>
                </li>
                <li className="flex items-start">
                  <Mic className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Gå inn i riktig <strong>breakout room</strong> (grupperom)</span>
                </li>
                <li className="flex items-start">
                  <Video className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Når du er klar, trykk på <strong>"Start opptak"</strong> i Teams</span>
                </li>
                <li className="flex items-start">
                  <Mic className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Snakk klart og tydelig inn i mikrofonen</span>
                </li>
                <li className="flex items-start">
                  <Video className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Trykk <strong>"Avslutt opptak"</strong> i Teams når du er ferdig</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
              Skriv inn prøvekoden:
            </label>
            <input
              type="text"
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="F.eks. ABC123"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg text-center uppercase tracking-wider text-gray-900 placeholder-gray-400 bg-white"
              style={{ color: '#111827' }}
              maxLength={10}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!code.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
          >
            Start Prøve
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-gray-200 text-center">
          <a
            href="/admin"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Lærer? Gå til administrasjonspanel →
          </a>
        </div>
      </div>
    </div>
  );
}
