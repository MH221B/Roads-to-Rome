import submitQuizModel from "../models/submitQuiz.model";

interface ISubmitQuizService{
    submitQuiz(quizId: string, userId: string, answers: Array<{ questionId: string; answer: string }>, score: number, duration: number): Promise<unknown>;
}

const submitQuizService: ISubmitQuizService = {
    submitQuiz: async (quizId, userId, answers, score, duration) => {
        const submitQuiz = new submitQuizModel({
            quizId,
            userId,
            answers,
            score,
            duration
        });
        return await submitQuiz.save();
    }
};

// Add helper to fetch submissions by quiz and user
async function getSubmissionsByQuizAndUser(quizId: string, userId: string) {
    return await submitQuizModel.find({ quizId, userId }).sort({ submittedAt: -1 }).lean().exec();
}

const exportObj = Object.assign(submitQuizService, { getSubmissionsByQuizAndUser });

export default exportObj;
