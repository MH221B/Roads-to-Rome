import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Wand2 } from 'lucide-react';
import api from '@/services/axiosClient';
import HeaderComponent from '@/components/HeaderComponent';

type FormValues = {
  instruction: string;
};

interface QuizResponse {
  title: string;
  description?: string;
  questions: Array<{
      id: string;
      type: string;
      text: string;
      options?: string[];
      slotCount?: number;
      correctAnswers: string[];
      explanation?: string;
  }>;
  order: number; // order of the quiz in the lesson
}

const AIQuizCreator = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>();
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (data: FormValues) => {
    setIsGenerating(true);
    setError(null);
    try {
      const resp = await api.post<QuizResponse>('/api/instructor/ai-quiz', {
        instruction: data.instruction,
      });
      const quiz = resp.data;

      // Adapt server quiz shape to the QuizCreator form shape and redirect there so user can edit
      const adapted = {
        title: quiz.title || 'AI Generated Quiz',
        description: quiz.description || '',
        order: quiz.order ?? 1,
        targetType: 'course',
        courseId: '',
        lessonId: undefined,
        // Transform questions into the QuizCreator's question format
        questions: (quiz.questions || []).map((q: any) => {
          const opts = Array.isArray(q.options) ? q.options : [];
          const options = [opts[0] ?? '', opts[1] ?? '', opts[2] ?? '', opts[3] ?? ''];
          const correctArr: string[] = Array.isArray(q.correctAnswers) ? q.correctAnswers : [];

          // Determine correctAnswer letter for single-choice
          let correctLetter: 'A' | 'B' | 'C' | 'D' = 'A';
          if (correctArr.length === 1) {
            const idx = options.indexOf(correctArr[0]);
            if (idx >= 0 && idx < 4) correctLetter = (['A','B','C','D'] as const)[idx];
          }

          const multiCorrect = correctArr.length > 1 ? correctArr.map((ans) => {
            const idx = options.indexOf(ans);
            return idx >= 0 && idx < 4 ? (['A','B','C','D'] as const)[idx] : undefined;
          }).filter(Boolean) as ('A'|'B'|'C'|'D')[] : undefined;

          return {
            question: q.text || '',
            optionA: options[0],
            optionB: options[1],
            optionC: options[2],
            optionD: options[3],
            correctAnswer: correctLetter,
            multiCorrect,
            type: (q.type === 'multiple' || (multiCorrect && multiCorrect.length > 0)) ? 'multiple' : 'single',
            slotCount: q.slotCount,
            explanation: q.explanation || '',
            id: q.id ?? undefined,
          };
        }),
      };

      // Redirect to Quiz Creator and pass prefill data via location state
      navigate('/quizzes/new', { state: { prefill: adapted } });
    } catch (err: any) {
      // Try to extract meaningful message
      const msg = err?.response?.data?.message ?? err?.message ?? 'Unknown error';
      setError(`Failed to generate quiz: ${msg}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-background min-h-screen pb-10">
      <HeaderComponent />
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">AI Quiz Generator</h1>
          <p className="text-gray-600">Generate multiple choice questions from lesson text or course summary</p>
        </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Generate MCQ from Lesson Text
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="lessonText">Lesson Text / Course Summary</Label>
              <Textarea
                id="lessonText"
                placeholder="Paste your lesson text or course summary here..."
                className="min-h-[200px] max-h-[400px] resize-none mt-1 overflow-y-scroll flex flex-row items-start"
                {...register('instruction', { required: 'Lesson text is required' })}
              />
              {errors.instruction && (
                <p className="text-red-500 text-sm mt-1">{errors.instruction.message}</p>
              )}
            </div>
            <div>
              <Button type="submit" disabled={isGenerating} className="w-full">
                {isGenerating ? (
                  <>
                    <Wand2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Questions...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate MCQ
                  </>
                )}
              </Button>
              {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
            </div>
          </form>
        </CardContent>
      </Card>


      </div>
    </div>
  );
};

export default AIQuizCreator;
