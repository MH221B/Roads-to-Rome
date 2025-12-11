import { api } from './axiosClient';

export type QuizDto = {
  id: string;
  lesson_id?: string;
  course_id?: string;
  title?: string;
  timelimit?: number; // seconds
  questions?: Array<any>;
};
export type SubmitQuizDto = {
  quizId: string;
  answers: Array<{
    questionId: string;
    // answer can be a string, array or object depending on question type
    answer: any;
  }>;
  duration: number; // seconds
};

export async function getQuizById(quizId: string): Promise<QuizDto> {
  const resp = await api.get(`/api/quiz/${quizId}`);
  return resp.data as QuizDto;
}

export async function submitQuiz(data: SubmitQuizDto): Promise<any> {
  console.log("SUBMIT PAYLOAD:", data);
  const resp = await api.post(`/api/quiz/${data.quizId}`, data);
  return resp.data;
}

export async function getQuizHistory(quizId: string): Promise<any[]> {
  const resp = await api.get(`/api/quiz/${quizId}/history`);
  return resp.data as any[];
}

export default { getQuizById, submitQuiz };
