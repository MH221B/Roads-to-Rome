import React, { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import MultipleChoiceAnswer from "./questions/QuestionMultiple";
import SingleChoiceAnswer from "./questions/QuestionSingle";
import ImageChoiceAnswer from "./questions/QuestionImage";
import DragDropAnswer from "./questions/QuestionDragDrop";
import type { Question } from "@/types/question";
import HeaderComponent from "./HeaderComponent";
import { useParams, useNavigate } from 'react-router-dom';
import { getLessonsByCourse } from "@/services/lessonService";
import { getQuizById, submitQuiz, getQuizHistory } from "@/services/quizService";
import QuizLeft from './QuizLeft';
import QuizMain from './QuizMain';
import QuizRight from './QuizRight';
import HistorySelector from './HistorySelector';



function renderQuestion(q: Question, onAnswered: (answer: any) => void, disabled = false) {
    switch (q.type) {
        case "multiple":
            return <MultipleChoiceAnswer item={q} onAnswered={onAnswered} disabled={disabled} />;
        case "single":
            return <SingleChoiceAnswer item={q} onAnswered={onAnswered} disabled={disabled} />;
        case "image":
            return <ImageChoiceAnswer item={q} onAnswered={onAnswered} disabled={disabled} />;
        case "dragdrop":
            return <DragDropAnswer item={q} onAnswered={onAnswered} disabled={disabled} />;
        default:
            return null;
    }
}

function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
}


export default function QuizPage() {
    // use route params to determine course and lesson
    const { courseId, quizId } = useParams<{ courseId: string; quizId: string }>();
    const navigate = useNavigate();
    const [openLesson, setOpenLesson] = useState<string | null>(null);
    const [activeQuiz, setActiveQuiz] = useState<string>(quizId || "");
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
        const payloadAnswers = (questions || []).map(q => ({
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
                setQuestions(q as Question[]);
                setTimeRemaining(typeof quiz.timelimit === 'number' ? Math.max(0, quiz.timelimit) : 1200);
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
        setAnswers(prev => {
            // avoid unnecessary object overwrite if same value
            const prevVal = prev[id];
            const newVal = answer;
            const equal = JSON.stringify(prevVal) === JSON.stringify(newVal);
            if (equal) return prev;
            return { ...prev, [id]: newVal };
        });

        setAnsweredQuestions(prev => {
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
                    handleAutoSubmit();   // ⬅ auto submit khi hết giờ
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
                const initialLessonId = data.find((lesson: any) =>
                    lesson.quizzes && lesson.quizzes.some((q: any) => q.id === quizId)
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
        return () => { mounted = false; };
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
        <div className="min-h-screen bg-background pb-10">
            <HeaderComponent />
            <div className="w-full h-screen grid grid-cols-12 bg-gray-50">
                <QuizLeft lessons={lessons} openLesson={openLesson} setOpenLesson={setOpenLesson} activeQuiz={activeQuiz} setActiveQuiz={setActiveQuiz} onSelectQuiz={handleSelectQuiz} courseId={courseId} />

                <QuizMain activeQuiz={activeQuiz} questions={questions} questionRefs={questionRefs} renderQuestion={renderQuestion} handleAnswered={handleAnswered} locked={locked} reviewMode={reviewMode} selectedAttempt={selectedAttempt} started={started} />
                <QuizRight questions={questions} questionRefs={questionRefs} answeredQuestions={answeredQuestions} reviewMode={reviewMode} selectedAttempt={selectedAttempt} timeRemaining={timeRemaining} locked={locked} handleSubmit={handleSubmit} openHistory={openHistory} onRetry={retryQuiz} isSubmitting={isSubmitting} isSubmitted={isSubmitted} submissionResult={submissionResult} started={started} startQuiz={startQuiz} />
            </div>

            {/* Confirm submit modal */}
            {showConfirmSubmit && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg w-96 p-6">
                        <h3 className="text-lg font-semibold mb-3">Confirm Submit</h3>
                        <p className="text-sm text-gray-700 mb-4">Are you sure you want to submit the quiz? You won't be able to change answers after submitting.</p>
                        <div className="flex justify-end gap-2">
                            <button className="px-4 py-2" onClick={() => setShowConfirmSubmit(false)}>Cancel</button>
                            <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => doSubmit(false)} disabled={isSubmitting}>{isSubmitting ? 'Submitting...' : 'Confirm'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Auto-submit notification modal */}
            {showAutoSubmitted && (
                <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg w-96 p-6">
                        <h3 className="text-lg font-semibold mb-3">Time's up</h3>
                        <p className="text-sm text-gray-700 mb-4">Time is up and your quiz was auto-submitted. You can review your attempt now.</p>
                        <div className="flex justify-end">
                            <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => setShowAutoSubmitted(false)}>OK</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm switch quiz modal (when leaving a started, unsent attempt) */}
            {showConfirmSwitch && pendingSwitch && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg w-96 p-6">
                        <h3 className="text-lg font-semibold mb-3">Xác nhận rời bài</h3>
                        <p className="text-sm text-gray-700 mb-4">Bạn đã bắt đầu làm bài; rời đi sẽ bỏ tiến trình hiện tại và không nộp. Bạn có muốn tiếp tục và chuyển sang quiz khác không?</p>
                        <div className="flex justify-end gap-2">
                            <button className="px-4 py-2" onClick={() => { setShowConfirmSwitch(false); setPendingSwitch(null); }}>Hủy</button>
                            <button className="px-4 py-2 bg-red-600 text-white rounded" onClick={() => {
                                // proceed with switch
                                navigate(`/courses/${courseId}/quiz/${pendingSwitch.id}`);
                                setActiveQuiz(pendingSwitch.id);
                                setOpenLesson(pendingSwitch.lessonId);
                                setShowConfirmSwitch(false);
                                setPendingSwitch(null);
                                // reset interactive state for new quiz
                                setStarted(false);
                                setReviewMode(false);
                                setIsSubmitted(false);
                                setSubmissionResult(null);
                            }}>Tiếp tục</button>
                        </div>
                    </div>
                </div>
            )}

            <HistorySelector open={historyOpen} historyData={historyData} onClose={() => setHistoryOpen(false)} onSelect={(attempt) => {
                setSelectedAttempt(attempt);
                setReviewMode(true);
                setHistoryOpen(false);
            }} />
        </div>
    );
}
