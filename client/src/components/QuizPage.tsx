import { useEffect, useState, useRef } from 'react';
import MultipleChoiceAnswer from './questions/QuestionMultiple';
import SingleChoiceAnswer from './questions/QuestionSingle';
import ImageChoiceAnswer from './questions/QuestionImage';
import DragDropAnswer from './questions/QuestionDragDrop';
import type { Question } from '@/types/question';
import HeaderComponent from './HeaderComponent';
import { useParams, useNavigate } from 'react-router-dom';
import { getLessonsByCourse } from '@/services/lessonService';
import { getQuizById, submitQuiz, getQuizHistory } from '@/services/quizService';
import QuizLeft from './QuizLeft';
import QuizMain from './QuizMain';
import QuizRight from './QuizRight';
import HistorySelector from './HistorySelector';
import { Button } from './ui/button';
import { FaClipboardList, FaClock, FaExclamationTriangle, FaBars, FaChevronLeft, FaTimes } from 'react-icons/fa';

function renderQuestion(q: Question, onAnswered: (answer: any) => void, disabled = false) {
  switch (q.type) {
    case 'multiple':
      return <MultipleChoiceAnswer item={q} onAnswered={onAnswered} disabled={disabled} />;
    case 'single':
      return <SingleChoiceAnswer item={q} onAnswered={onAnswered} disabled={disabled} />;
    case 'image':
      return <ImageChoiceAnswer item={q} onAnswered={onAnswered} disabled={disabled} />;
    case 'dragdrop':
      return <DragDropAnswer item={q} onAnswered={onAnswered} disabled={disabled} />;
    default:
      return null;
  }
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function QuizPage() {
  // use route params to determine course and lesson
  const { courseId, quizId } = useParams<{ courseId: string; quizId: string }>();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [openLesson, setOpenLesson] = useState<string | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<string>(quizId || '');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(new Set());
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeRemaining, setTimeRemaining] = useState(1200); // seconds
  const questionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [timeLimit, setTimeLimit] = useState<number>(1200); // default 20 minutes
  const [started, setStarted] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [selectedAttempt, setSelectedAttempt] = useState<any | null>(null);
  const [reviewMode, setReviewMode] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [showAutoSubmitted, setShowAutoSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingSwitch, setPendingSwitch] = useState<{ id: string; lessonId: string } | null>(null);
  const [showConfirmSwitch, setShowConfirmSwitch] = useState(false);

  // Show confirmation modal when user clicks Submit
  function handleSubmit() {
    setShowConfirmSubmit(true);
  }

  // Perform submission. If auto=true we consider it an auto-submit.
  async function doSubmit(auto = false) {
    if (!activeQuiz) return;
    setIsSubmitting(true);

    // Build answers, unanswered -> empty array
    const payloadAnswers = (questions || []).map((q) => ({
      questionId: q.id,
      answer: typeof answers[q.id] === 'undefined' ? [] : answers[q.id],
    }));

    const data = {
      quizId: activeQuiz,
      answers: payloadAnswers,
      duration: timeLimit - timeRemaining,
    };

    try {
      const result = await submitQuiz(data);
      setSubmissionResult(result);
      setIsSubmitted(true);

      // fetch and update history
      try {
        const hist = await getQuizHistory(activeQuiz);
        setHistoryData(hist);
      } catch (err) {
        // ignore history fetch errors
      }

      // Enter review mode and show the newly created submission (or latest history)
      if (result) {
        setSelectedAttempt(result);
      } else if (historyData && historyData.length > 0) {
        setSelectedAttempt(historyData[0]);
      }
      setReviewMode(true);
      setHistoryOpen(false);

      if (auto) {
        setShowAutoSubmitted(true);
      } else {
        setShowConfirmSubmit(false);
      }
    } catch (err) {
      console.error('Submit failed', err);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleAutoSubmit() {
    // Auto-submit immediately (no confirmation) and show notification modal
    doSubmit(true);
  }

  useEffect(() => {
    // when activeQuiz changes, fetch quiz details from server
    if (!activeQuiz) return;
    let mounted = true;
    (async () => {
      try {
        const quiz = await getQuizById(activeQuiz);
        if (!mounted) return;
        const q = Array.isArray(quiz.questions) ? quiz.questions : [];
        const quizTimeLimit = typeof quiz.timelimit === 'number' ? Math.max(0, quiz.timelimit) : 1200;
        setQuestions(q as Question[]);
        setTimeLimit(quizTimeLimit);
        setTimeRemaining(quizTimeLimit);
        setAnsweredQuestions(new Set());
        setAnswers({});
        questionRefs.current = [];
      } catch (err) {
        // fallback: clear questions
        setQuestions([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [activeQuiz]);

  function handleAnswered(id: string, answer: any) {
    setAnswers((prev) => {
      // avoid unnecessary object overwrite if same value
      const prevVal = prev[id];
      const newVal = answer;
      const equal = JSON.stringify(prevVal) === JSON.stringify(newVal);
      if (equal) return prev;
      return { ...prev, [id]: newVal };
    });

    setAnsweredQuestions((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }

  useEffect(() => {
    if (!started) return;
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit(); // ⬅ auto submit khi hết giờ
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [started]);

  // Fetch lessons for the course and pick initial quiz when available
  useEffect(() => {
    if (!courseId) return;
    let mounted = true;
    (async () => {
      try {
        const data = await getLessonsByCourse(courseId);
        if (!mounted) return;
        setLessons(data);

        // Determine which lesson to open: prefer route param, else first
        // initialLessonId is derived from quizId if available
        const initialLessonId = data.find(
          (lesson: any) => lesson.quizzes && lesson.quizzes.some((q: any) => q.id === quizId)
        )?.id;

        // pick quiz that is equal quizId from route param, else first quiz of first lesson
        setOpenLesson(initialLessonId ?? (data.length > 0 ? data[0].id : null));
        if (quizId) {
          setActiveQuiz(quizId);
        } else if (data.length > 0 && data[0].quizzes && data[0].quizzes.length > 0) {
          setActiveQuiz(data[0].quizzes[0].id);
        }
      } catch (err) {
        setLessons([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [courseId, quizId]);

  // reset interactive state when switching quizzes so quiz appears locked until started
  useEffect(() => {
    setStarted(false);
    setIsSubmitted(false);
    setSubmissionResult(null);
    setSelectedAttempt(null);
    setReviewMode(false);
  }, [activeQuiz]);

  const locked = isSubmitted || timeRemaining <= 0;

  async function openHistory() {
    setHistoryOpen(true);
    try {
      const hist = await getQuizHistory(activeQuiz);
      setHistoryData(hist);
    } catch (err) {
      setHistoryData([]);
    }
  }

  function startQuiz() {
    if (timeRemaining <= 0) setTimeRemaining(timeLimit);
    setStarted(true);
  }

  function retryQuiz() {
    // Reset state for a new attempt
    setIsSubmitted(false);
    setSubmissionResult(null);
    setSelectedAttempt(null);
    setReviewMode(false);
    setAnswers({});
    setAnsweredQuestions(new Set());
    setTimeRemaining(timeLimit);
    setStarted(true);
    questionRefs.current = [];
    // refetch quiz to reset questions if needed
    if (activeQuiz) {
      (async () => {
        try {
          const quiz = await getQuizById(activeQuiz);
          const q = Array.isArray(quiz.questions) ? quiz.questions : [];
          setQuestions(q as Question[]);
        } catch (err) {
          // ignore
        }
      })();
    }
  }

  function handleSelectQuiz(id: string, lessonId: string) {
    // If the user already started the quiz and hasn't submitted yet, show in-app confirmation modal
    if (started && !isSubmitted && !reviewMode) {
      setPendingSwitch({ id, lessonId });
      setShowConfirmSwitch(true);
      return;
    }
    // navigate and switch active quiz immediately
    navigate(`/courses/${courseId}/quiz/${id}`);
    setActiveQuiz(id);
    setOpenLesson(lessonId);
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 text-slate-900">
      <HeaderComponent />

      {/* Top Navigation Bar */}
      <header className="z-20 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/courses/${courseId}/lessons/${openLesson}`)}
            className="text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            title="Back to course details"
          >
            <FaChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <FaBars className="h-5 w-5" />
          </Button>
          <div className="flex flex-col">
            <span className="text-xs font-medium tracking-wider text-slate-500 uppercase">
              Quiz
            </span>
            <h1 className="max-w-[200px] truncate text-sm font-bold md:max-w-md md:text-base">
              {activeQuiz}
            </h1>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Sidebar (Burger Menu) */}
        <aside
          className={`absolute z-10 h-full overflow-hidden border-r border-slate-200 bg-white transition-all duration-300 ease-in-out md:relative ${isSidebarOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full md:w-0 md:translate-x-0'}`}
        >
          <div className="h-full w-80 overflow-y-auto p-4">
            <QuizLeft
              lessons={lessons}
              openLesson={openLesson}
              setOpenLesson={setOpenLesson}
              activeQuiz={activeQuiz}
              setActiveQuiz={setActiveQuiz}
              onSelectQuiz={handleSelectQuiz}
              courseId={courseId}
            />
          </div>
        </aside>

        {/* Content Area - Quiz Main and Right */}
        <div className="relative flex w-full flex-1 overflow-hidden">
          <QuizMain
            activeQuiz={activeQuiz}
            questions={questions}
            questionRefs={questionRefs}
            renderQuestion={renderQuestion}
            handleAnswered={handleAnswered}
            locked={locked}
            reviewMode={reviewMode}
            selectedAttempt={selectedAttempt}
            started={started}
          />
          <QuizRight
            questions={questions}
            questionRefs={questionRefs}
            answeredQuestions={answeredQuestions}
            reviewMode={reviewMode}
            selectedAttempt={selectedAttempt}
            timeRemaining={timeRemaining}
            locked={locked}
            handleSubmit={handleSubmit}
            openHistory={openHistory}
            onRetry={retryQuiz}
            isSubmitting={isSubmitting}
            isSubmitted={isSubmitted}
            submissionResult={submissionResult}
            started={started}
            startQuiz={startQuiz}
          />
        </div>
      </div>

      {/* Confirm submit modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <FaClipboardList className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-3 text-2xl font-bold text-slate-900">Confirm Submission</h3>
            <p className="mb-6 text-slate-600 leading-relaxed">
              Are you sure you want to submit the quiz? You won't be able to change your answers after submitting.
            </p>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1 border-slate-300 hover:bg-slate-100" 
                onClick={() => setShowConfirmSubmit(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-primary hover:bg-primary/90"
                onClick={() => doSubmit(false)}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Confirm'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-submit notification modal */}
      {showAutoSubmitted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
              <FaClock className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="mb-3 text-2xl font-bold text-slate-900">Time's Up!</h3>
            <p className="mb-6 text-slate-600 leading-relaxed">
              Time is up and your quiz was automatically submitted. You can review your attempt now.
            </p>
            <Button
              className="w-full bg-primary hover:bg-primary/90"
              onClick={() => setShowAutoSubmitted(false)}
              size="lg"
            >
              Review Answers
            </Button>
          </div>
        </div>
      )}

      {/* Confirm switch quiz modal (when leaving a started, unsent attempt) */}
      {showConfirmSwitch && pendingSwitch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <FaExclamationTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="mb-3 text-2xl font-bold text-slate-900">Xác nhận rời bài</h3>
            <p className="mb-6 text-slate-600 leading-relaxed">
              Bạn đã bắt đầu làm bài; rời đi sẽ bỏ tiến trình hiện tại và không nộp. Bạn có muốn tiếp tục và chuyển sang quiz khác không?
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-slate-300 hover:bg-slate-100"
                onClick={() => {
                  setShowConfirmSwitch(false);
                  setPendingSwitch(null);
                }}
              >
                Hủy
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700"
                onClick={() => {
                  navigate(`/courses/${courseId}/quiz/${pendingSwitch.id}`);
                  setActiveQuiz(pendingSwitch.id);
                  setOpenLesson(pendingSwitch.lessonId);
                  setShowConfirmSwitch(false);
                  setPendingSwitch(null);
                  setStarted(false);
                  setReviewMode(false);
                  setIsSubmitted(false);
                  setSubmissionResult(null);
                }}
              >
                Tiếp tục
              </Button>
            </div>
          </div>
        </div>
      )}

      <HistorySelector
        open={historyOpen}
        historyData={historyData}
        onClose={() => setHistoryOpen(false)}
        onSelect={(attempt) => {
          setSelectedAttempt(attempt);
          setReviewMode(true);
          setHistoryOpen(false);
        }}
      />
    </div>
  );
}
