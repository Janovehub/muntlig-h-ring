'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Test, Question, TestSession } from '@/types';
import { getTestByCode, saveSession, clearSession, getSession } from '@/lib/storage';
import { ChevronLeft, ChevronRight, Clock, AlertCircle, Video, Maximize, Minimize } from 'lucide-react';

const SHOW_TIMER_THRESHOLD = 5 * 60; // 5 minutes in seconds

export default function TestPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;
  
  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showTimer, setShowTimer] = useState(false);
  const [showTimeUpModal, setShowTimeUpModal] = useState(false);
  const [timeHasRunOut, setTimeHasRunOut] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showLevelSelection, setShowLevelSelection] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<'easy' | 'medium' | 'hard' | null>(null);
  const [answeredQuestions, setAnsweredQuestions] = useState<string[]>([]);

  // Load test data
  useEffect(() => {
    const testData = getTestByCode(code);
    if (!testData) {
      router.push('/');
      return;
    }

    setTest(testData);
    
    // Shuffle questions if needed
    let shuffledQuestions = [...testData.questions];
    if (testData.shuffle) {
      shuffledQuestions = shuffledQuestions.sort(() => Math.random() - 0.5);
    }
    setQuestions(shuffledQuestions);

    // Check for existing session
    const session = getSession();
    if (session && session.testId === testData.id) {
      setTimeRemaining(session.timeRemaining);
      setShowTimer(session.showTimer);
      setSelectedLevel(session.selectedLevel || null);
      setAnsweredQuestions(session.answeredQuestions || []);
      
      // Get current question based on mode
      if (testData.mode === 'level-based' && testData.allowStudentLevelChoice && !session.selectedLevel) {
        setShowLevelSelection(true);
        setCurrentQuestion(null);
      } else {
        const q = getNextQuestion(shuffledQuestions, session.selectedLevel || null, session.answeredQuestions || []);
        setCurrentQuestion(q);
        setShowLevelSelection(false);
      }
    } else {
      // New session
      const initialTime = testData.totalTime * 60;
      setTimeRemaining(initialTime);
      setShowTimer(initialTime <= SHOW_TIMER_THRESHOLD);
      
      // Check if student needs to select level first
      if (testData.mode === 'level-based' && testData.allowStudentLevelChoice) {
        setShowLevelSelection(true);
        setCurrentQuestion(null);
      } else {
        const q = getNextQuestion(shuffledQuestions, null, []);
        setCurrentQuestion(q);
        setShowLevelSelection(false);
      }
      
      const newSession: TestSession = {
        testId: testData.id,
        currentQuestionIndex: 0,
        startTime: new Date().toISOString(),
        questionStartTime: new Date().toISOString(),
        timeRemaining: initialTime,
        showTimer: initialTime <= SHOW_TIMER_THRESHOLD,
        isComplete: false,
      };
      saveSession(newSession);
    }

    setIsLoading(false);
  }, [code, router]);

  // Get next question based on level and already answered questions
  const getNextQuestion = (allQuestions: Question[], level: 'easy' | 'medium' | 'hard' | null, answered: string[]): Question | null => {
    let availableQuestions = allQuestions.filter(q => !answered.includes(q.id));
    
    if (level) {
      availableQuestions = availableQuestions.filter(q => q.level === level);
    }
    
    if (availableQuestions.length === 0) {
      return null;
    }
    
    return availableQuestions[0];
  };

  // Handle level selection
  const handleLevelSelect = (level: 'easy' | 'medium' | 'hard') => {
    setSelectedLevel(level);
    setShowLevelSelection(false);
    
    const q = getNextQuestion(questions, level, answeredQuestions);
    setCurrentQuestion(q);
    
    const session = getSession();
    if (session) {
      saveSession({
        ...session,
        selectedLevel: level,
      });
    }
  };

  // Timer countdown
  useEffect(() => {
    if (!test || isLoading) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1;
        
        if (newTime <= SHOW_TIMER_THRESHOLD && !showTimer) {
          setShowTimer(true);
        }
        
        if (newTime <= 0 && !timeHasRunOut) {
          setTimeHasRunOut(true);
          setShowTimeUpModal(true);
          return 0;
        }
        
        const session = getSession();
        if (session) {
          saveSession({
            ...session,
            timeRemaining: Math.max(0, newTime),
            showTimer: newTime <= SHOW_TIMER_THRESHOLD,
          });
        }
        
        return Math.max(0, newTime);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [test, isLoading, showTimer, timeHasRunOut]);

  const goToNextQuestion = useCallback(() => {
    if (!currentQuestion) return;
    
    const newAnswered = [...answeredQuestions, currentQuestion.id];
    setAnsweredQuestions(newAnswered);
    
    let nextQ: Question | null;
    
    if (test?.mode === 'level-based' && test?.allowStudentLevelChoice) {
      // Show level selection again for next question
      setShowLevelSelection(true);
      setCurrentQuestion(null);
      nextQ = null;
    } else {
      // Continue with regular flow
      nextQ = getNextQuestion(questions, selectedLevel, newAnswered);
      setCurrentQuestion(nextQ);
    }
    
    setShowTimeUpModal(false);
    
    const session = getSession();
    if (session) {
      saveSession({
        ...session,
        answeredQuestions: newAnswered,
        questionStartTime: new Date().toISOString(),
      });
    }
  }, [currentQuestion, answeredQuestions, questions, selectedLevel, test]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressColor = () => {
    const totalTimeSeconds = test!.totalTime * 60;
    const percentage = timeRemaining / totalTimeSeconds;
    if (percentage > 0.5) return 'bg-green-500';
    if (percentage > 0.25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (isLoading || !test) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laster prøve...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Timer - only shown when <= 5 minutes */}
      {showTimer && (
        <div className="bg-gray-100 border-b border-gray-200 transition-all duration-500">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-gray-700">
                <Clock className="w-5 h-5" />
                <span className="font-medium">Tid igjen:</span>
                <span className={`text-2xl font-bold font-mono ${
                  timeRemaining <= 60 ? 'text-red-600 animate-pulse' : 'text-gray-900'
                }`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
              <span className="text-sm text-gray-500">
                {answeredQuestions.length + (currentQuestion ? 1 : 0)} av {test.questions.length} spørsmål
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${getProgressColor()}`}
                style={{ 
                  width: `${(timeRemaining / (test.totalTime * 60)) * 100}%` 
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-6 md:p-12">
          <div className="max-w-4xl w-full">
            {showLevelSelection ? (
              /* Level Selection Screen */
              <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Velg nivå
                </h2>
                <p className="text-gray-600 mb-8 text-lg">
                  Velg hvilket nivå du vil svare på:
                </p>
                
                <div className="flex flex-col md:flex-row gap-4 justify-center">
                  <button
                    onClick={() => handleLevelSelect('easy')}
                    className="px-8 py-6 bg-green-100 hover:bg-green-200 text-green-800 rounded-xl font-semibold text-xl transition-colors"
                  >
                    <div className="text-2xl mb-2">Lett</div>
                    <div className="text-sm font-normal">
                      {questions.filter(q => q.level === 'easy' && !answeredQuestions.includes(q.id)).length} spørsmål tilgjengelig
                    </div>
                  </button>
                  
                  <button
                    onClick={() => handleLevelSelect('medium')}
                    className="px-8 py-6 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-xl font-semibold text-xl transition-colors"
                  >
                    <div className="text-2xl mb-2">Medium</div>
                    <div className="text-sm font-normal">
                      {questions.filter(q => q.level === 'medium' && !answeredQuestions.includes(q.id)).length} spørsmål tilgjengelig
                    </div>
                  </button>
                  
                  <button
                    onClick={() => handleLevelSelect('hard')}
                    className="px-8 py-6 bg-red-100 hover:bg-red-200 text-red-800 rounded-xl font-semibold text-xl transition-colors"
                  >
                    <div className="text-2xl mb-2">Vanskelig</div>
                    <div className="text-sm font-normal">
                      {questions.filter(q => q.level === 'hard' && !answeredQuestions.includes(q.id)).length} spørsmål tilgjengelig
                    </div>
                  </button>
                </div>
              </div>
            ) : currentQuestion ? (
              /* Question Display */
              <div className="text-center">
                {test.mode === 'level-based' && currentQuestion.level && !test.allowStudentLevelChoice && (
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-6 ${
                    currentQuestion.level === 'easy' ? 'bg-green-100 text-green-800' :
                    currentQuestion.level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {currentQuestion.level === 'easy' ? 'Lett' :
                     currentQuestion.level === 'medium' ? 'Medium' : 'Vanskelig'}
                  </span>
                )}
                
                {test.mode === 'level-based' && test.allowStudentLevelChoice && selectedLevel && (
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-6 ${
                    selectedLevel === 'easy' ? 'bg-green-100 text-green-800' :
                    selectedLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    Valgt nivå: {selectedLevel === 'easy' ? 'Lett' : selectedLevel === 'medium' ? 'Medium' : 'Vanskelig'}
                  </span>
                )}
                
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                  {currentQuestion.text}
                </h1>
              </div>
            ) : (
              /* No more questions */
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Prøven er ferdig!
                </h2>
                <p className="text-gray-600 text-lg">
                  Du har svart på alle tilgjengelige spørsmål.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="border-t border-gray-200 bg-gray-50 p-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex-1">
              {/* Left side - empty or info */}
            </div>

            <div className="flex items-center gap-4">
              <span className="text-gray-500">
                {answeredQuestions.length + (currentQuestion ? 1 : 0)} / {test.questions.length}
              </span>
              
              <button
                onClick={toggleFullscreen}
                className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg"
                title={isFullscreen ? 'Avslutt fullskjerm' : 'Fullskjerm'}
              >
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
            </div>

            {currentQuestion && !showLevelSelection && (
              <button
                onClick={goToNextQuestion}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Neste spørsmål
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Time Up Modal */}
      {showTimeUpModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Video className="w-8 h-8 text-red-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Tiden er ute!
            </h2>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="font-semibold text-yellow-800 mb-1">
                    Viktig - Husk å stoppe opptaket!
                  </p>
                  <p className="text-yellow-700 text-sm">
                    Gå til Teams og trykk på <strong>"Avslutt opptak"</strong> nå.
                  </p>
                </div>
              </div>
            </div>

            <p className="text-gray-600 mb-6">
              Spørsmålet er fortsatt synlig. Du kan fortsette å svare, eller gå videre til neste spørsmål.
            </p>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowTimeUpModal(false)}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
              >
                Fortsett på dette spørsmålet
              </button>
              <button
                onClick={() => {
                  setShowTimeUpModal(false);
                  goToNextQuestion();
                }}
                disabled={!currentQuestion}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors"
              >
                Neste spørsmål
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit button */}
      <button
        onClick={() => {
          if (confirm('Er du sikker på at du vil avslutte prøven?')) {
            clearSession();
            router.push('/');
          }
        }}
        className="fixed top-4 right-4 p-2 bg-white/80 hover:bg-white shadow-lg rounded-lg text-gray-600 hover:text-gray-900 z-40"
      >
        Avslutt
      </button>
    </div>
  );
}
