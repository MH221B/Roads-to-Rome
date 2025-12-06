import React, { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MultipleChoiceAnswer from "./questions/QuestionMultiple";
import SingleChoiceAnswer from "./questions/QuestionSingle";
import ImageChoiceAnswer from "./questions/QuestionImage";
import DragDropAnswer from "./questions/QuestionDragDrop";
import type { Question } from "@/types/question";



function renderQuestion(q: Question) {
    switch (q.type) {
        case "multiple":
            return <MultipleChoiceAnswer item={q} />;
        case "single":
            return <SingleChoiceAnswer item={q} />;
        case "image":
            return <ImageChoiceAnswer item={q} />;
        case "dragdrop":
            return <DragDropAnswer item={q} />;
        default:
            return null;
    }
}
// Generate 5 mock questions per quiz id
function generateMockQuestions(quizId: string): Question[] {
    const types: Question['type'][] = ["multiple", "single", "image", "dragdrop"];
    const imageOptions = [
        "https://picsum.photos/200?random=1",
        "https://picsum.photos/200?random=2",
        "https://picsum.photos/200?random=3",
        "https://picsum.photos/200?random=4"
    ];

    return Array.from({ length: 5 }).map((_, i) => {
        const type = types[i % types.length];
        const id = `${quizId}-q${i + 1}`;
        let options: string[] = [];

        if (type === "image") {
            options = imageOptions;
        } else if (type === "dragdrop") {
            options = ["Step 1", "Step 2", "Step 3"];
        } else if (type === "multiple") {
            options = ["Option A", "Option B", "Option C", "Option D"];
        } else {
            options = ["A", "B", "C", "D"];
        }

        return {
            id,
            type,
            text: `${quizId} - Mock question ${i + 1} (${type})`,
            options
        } as Question;
    });
}


export default function QuizPage() {
    // Lesson mở sẵn là lesson 1, quiz mặc định 1.1
    const [openLesson, setOpenLesson] = useState<number | null>(1);
    const [activeQuiz, setActiveQuiz] = useState<string>("1.1");
    const [questions, setQuestions] = useState<Question[]>(() => generateMockQuestions(activeQuiz));
    const questionRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        setQuestions(generateMockQuestions(activeQuiz));
        // reset refs array when quiz changes
        questionRefs.current = [];
    }, [activeQuiz]);
    return (
        <div className="w-full h-screen grid grid-cols-12 bg-gray-50">
            <aside className="col-span-3 border-r p-4 overflow-y-auto">
                <h2 className="text-xl font-semibold mb-4">Lessons</h2>

                <Card className="shadow-sm">
                    <CardContent className="p-4 space-y-4">
                        {[1, 2, 3].map((lesson) => (
                            <div key={lesson} className="border-b pb-2">
                                <div
                                    className="flex justify-between items-center cursor-pointer"
                                    onClick={() => setOpenLesson(openLesson === lesson ? null : lesson)}
                                >
                                    <h3 className="font-semibold mb-2">Lesson {lesson}</h3>
                                    <span>{openLesson === lesson ? "-" : "+"}</span>
                                </div>

                                {openLesson === lesson && (
                                    <div className="space-y-1 ml-2 mt-2">
                                        {[1, 2, 3].map((quiz) => {
                                            const id = `${lesson}.${quiz}`;
                                            return (
                                                <div
                                                    key={id}
                                                    onClick={() => {
                                                        setActiveQuiz(id);
                                                        setOpenLesson(lesson);
                                                    }}
                                                    className={`text-sm cursor-pointer p-1 rounded-md transition-colors duration-150 ${activeQuiz === id
                                                        ? "bg-blue-100 text-blue-700 font-semibold"
                                                        : "hover:underline hover:bg-gray-50"
                                                        }`}
                                                >
                                                    Quiz {lesson}.{quiz}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </aside>

            <main className="col-span-6 p-6 overflow-y-auto">
                <h1 className="text-2xl font-bold mb-4">Quiz {activeQuiz}</h1>

                {questions.map((q, index) => (
                    <div key={q.id} ref={(el) => { questionRefs.current[index] = el; }}>
                        <Card className="mb-6">
                            <CardContent className="p-6 space-y-6">
                                <h2 className="text-lg font-semibold">Question {index + 1}</h2>
                                <p>{q.text}</p>

                                {/* Render đúng câu trả lời */}
                                {renderQuestion(q)}

                                {/* <Button className="mt-6 w-full">Submit Answer</Button> */}
                            </CardContent>
                        </Card>
                    </div>
                ))}
            </main>

            <aside className="col-span-3 border-l p-4 flex flex-col gap-6">
                <Card className="shadow-sm">
                    <CardContent className="p-4 text-center">
                        <h3 className="text-lg font-semibold mb-2">Time Remaining</h3>
                        <div className="text-3xl font-bold">12:34</div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardContent className="p-4">
                        <h3 className="text-lg font-semibold mb-3">Questions</h3>
                        <div className="grid grid-cols-5 gap-2">
                            {questions.map((q, i) => (
                                <button
                                    key={q.id}
                                    onClick={() => questionRefs.current[i]?.scrollIntoView({ behavior: "smooth", block: "center" })}
                                    className="border rounded-lg p-2 text-sm hover:bg-gray-100"
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </aside>
        </div>
    );
}
