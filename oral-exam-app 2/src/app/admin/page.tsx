'use client';

import { useState, useEffect } from 'react';
import { Test, Question } from '@/types';
import { getTests, saveTest, deleteTest, generateCode } from '@/lib/storage';
import { Plus, Trash2, Edit, Copy, Check, X, GraduationCap, Settings, List } from 'lucide-react';

export default function AdminPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    setTests(getTests());
  }, []);

  const handleDelete = (testId: string) => {
    if (confirm('Er du sikker på at du vil slette denne prøven?')) {
      deleteTest(testId);
      setTests(getTests());
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-3 rounded-lg">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Lærer Dashboard</h1>
              <p className="text-gray-600">Administrer muntlige prøver</p>
            </div>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Ny Prøve
          </button>
        </div>

        {isCreating && (
          <TestEditor
            onClose={() => setIsCreating(false)}
            onSave={() => {
              setTests(getTests());
              setIsCreating(false);
            }}
          />
        )}

        {editingTest && (
          <TestEditor
            test={editingTest}
            onClose={() => setEditingTest(null)}
            onSave={() => {
              setTests(getTests());
              setEditingTest(null);
            }}
          />
        )}

        <div className="grid gap-6">
          {tests.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <List className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Ingen prøver ennå</h3>
              <p className="text-gray-600 mb-4">Opprett din første prøve for å komme i gang</p>
              <button
                onClick={() => setIsCreating(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Opprett Prøve
              </button>
            </div>
          ) : (
            tests.map((test) => (
              <div key={test.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{test.name}</h3>
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded">
                        {test.subject}
                      </span>
                      <span className={`px-2 py-1 text-sm rounded ${
                        test.mode === 'flat' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {test.mode === 'flat' ? 'Flat' : 'Nivåbasert'}
                      </span>
                      {test.mode === 'level-based' && test.allowStudentLevelChoice && (
                        <span className="px-2 py-1 bg-orange-100 text-orange-700 text-sm rounded">
                          Elev velger nivå
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                      <span>{test.questions.length} spørsmål</span>
                      <span>{test.totalTime} min totalt</span>
                      <span>{test.shuffle ? 'Tilfeldig rekkefølge' : 'Fast rekkefølge'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg px-4 py-2 flex items-center gap-3">
                        <span className="text-2xl font-mono font-bold text-blue-700">
                          {test.code}
                        </span>
                        <button
                          onClick={() => handleCopyCode(test.code)}
                          className="p-1 hover:bg-blue-100 rounded transition-colors"
                          title="Kopier kode"
                        >
                          {copiedCode === test.code ? (
                            <Check className="w-5 h-5 text-green-600" />
                          ) : (
                            <Copy className="w-5 h-5 text-blue-600" />
                          )}
                        </button>
                      </div>
                      {copiedCode === test.code && (
                        <span className="text-sm text-green-600">Kopiert!</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => setEditingTest(test)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Rediger"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(test.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Slett"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-8 text-center">
          <a
            href="/"
            className="text-gray-600 hover:text-gray-800 text-sm"
          >
            ← Tilbake til elev-side
          </a>
        </div>
      </div>
    </div>
  );
}

interface TestEditorProps {
  test?: Test;
  onClose: () => void;
  onSave: () => void;
}

function TestEditor({ test, onClose, onSave }: TestEditorProps) {
  const [name, setName] = useState(test?.name || '');
  const [subject, setSubject] = useState(test?.subject || '');
  const [mode, setMode] = useState<'flat' | 'level-based'>(test?.mode || 'flat');
  const [shuffle, setShuffle] = useState(test?.shuffle || false);
  const [totalTime, setTotalTime] = useState(test?.totalTime || 30);
  const [allowStudentLevelChoice, setAllowStudentLevelChoice] = useState(test?.allowStudentLevelChoice || false);
  const [questions, setQuestions] = useState<Question[]>(test?.questions || []);

  const handleAddQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      text: '',
      level: mode === 'level-based' ? 'easy' : undefined,
    };
    setQuestions([...questions, newQuestion]);
  };

  const handleUpdateQuestion = (id: string, text: string, level?: 'easy' | 'medium' | 'hard') => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, text, level } : q
    ));
  };

  const handleRemoveQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleSave = () => {
    if (!name.trim() || !subject.trim() || questions.length === 0) {
      alert('Vennligst fyll inn navn, fag og minst ett spørsmål');
      return;
    }

    const newTest: Test = {
      id: test?.id || Date.now().toString(),
      code: test?.code || generateCode(),
      name: name.trim(),
      subject: subject.trim(),
      mode,
      shuffle,
      totalTime,
      allowStudentLevelChoice: mode === 'level-based' ? allowStudentLevelChoice : false,
      questions: questions.filter(q => q.text.trim()),
      createdAt: test?.createdAt || new Date().toISOString(),
    };

    saveTest(newTest);
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {test ? 'Rediger Prøve' : 'Ny Prøve'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prøvens navn *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                placeholder="F.eks. Muntlig matte vår 2024"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fag/Emne *
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                placeholder="F.eks. Matematikk"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Modus
              </label>
              <select
                value={mode}
                onChange={(e) => {
                  setMode(e.target.value as 'flat' | 'level-based');
                  if (e.target.value === 'flat') {
                    setQuestions(questions.map(q => ({ ...q, level: undefined })));
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              >
                <option value="flat">Flat (alle like)</option>
                <option value="level-based">Nivåbasert</option>
              </select>
            </div>
            
            {mode === 'level-based' && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="allowLevelChoice"
                  checked={allowStudentLevelChoice}
                  onChange={(e) => setAllowStudentLevelChoice(e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="allowLevelChoice" className="ml-2 text-sm text-gray-700">
                  Eleven velger nivå selv
                </label>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total tid for prøven (min)
              </label>
              <input
                type="number"
                min="5"
                max="120"
                value={totalTime}
                onChange={(e) => setTotalTime(parseInt(e.target.value) || 5)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rekkefølge
              </label>
              <select
                value={shuffle.toString()}
                onChange={(e) => setShuffle(e.target.value === 'true')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="false">Fast rekkefølge</option>
                <option value="true">Tilfeldig rekkefølge</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Spørsmål ({questions.length})
              </label>
              <button
                onClick={handleAddQuestion}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Legg til spørsmål
              </button>
            </div>

            <div className="space-y-3">
              {questions.map((question, index) => (
                <div key={question.id} className="flex gap-3 items-start">
                  <span className="text-gray-500 font-medium mt-2 w-8">{index + 1}.</span>
                  <textarea
                    value={question.text}
                    onChange={(e) => handleUpdateQuestion(question.id, e.target.value, question.level)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    rows={2}
                    placeholder="Skriv spørsmålet her..."
                  />
                  {mode === 'level-based' && (
                    <select
                      value={question.level}
                      onChange={(e) => handleUpdateQuestion(question.id, question.text, e.target.value as 'easy' | 'medium' | 'hard')}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    >
                      <option value="easy">Lett</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Vanskelig</option>
                    </select>
                  )}
                  <button
                    onClick={() => handleRemoveQuestion(question.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>

            {questions.length === 0 && (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Ingen spørsmål ennå. Klikk "Legg til spørsmål" for å starte.</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Avbryt
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            {test ? 'Lagre endringer' : 'Opprett prøve'}
          </button>
        </div>
      </div>
    </div>
  );
}
