import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FaStar } from 'react-icons/fa';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ReviewFormProps {
  onSubmit?: (data: { rating: number; content: string }) => void;
  submitting?: boolean;
  readOnly?: boolean;
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  onSubmit,
  submitting = false,
  readOnly = false,
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<{ rating: number; content: string }>({
    defaultValues: { rating: 0, content: '' },
  });

  const ratingValue = watch('rating');
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);

  const handleFormSubmit = (data: { rating: number; content: string }) => {
    if (!readOnly) onSubmit?.(data);
  };

  return (
    <Card className="mt-4 w-full border-none bg-white/50 shadow-xl ring-1 ring-slate-900/5 backdrop-blur-sm">
      <CardHeader className="pb-2 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
          How was your experience?
        </CardTitle>
        <CardDescription>Your feedback helps us improve.</CardDescription>
      </CardHeader>

      <CardContent className="px-6 pt-4 md:px-8">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="flex flex-col items-center space-y-3">
            <Label className="text-sm font-medium tracking-wider text-slate-500 uppercase">
              Rate your experience
            </Label>

            <input
              type="hidden"
              {...register('rating', {
                required: 'Please select a star rating',
                min: { value: 1, message: 'Please select at least 1 star' },
                valueAsNumber: true,
              })}
            />

            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => {
                const isActive = star <= (hoveredStar ?? ratingValue);
                return (
                  <button
                    key={star}
                    type="button"
                    className="p-1 transition-transform hover:scale-110 focus:outline-none"
                    onMouseEnter={readOnly ? undefined : () => setHoveredStar(star)}
                    onMouseLeave={readOnly ? undefined : () => setHoveredStar(null)}
                    onClick={
                      readOnly
                        ? undefined
                        : () => setValue('rating', star, { shouldValidate: true })
                    }
                    disabled={readOnly}
                    aria-disabled={readOnly}
                  >
                    <FaStar
                      className={cn(
                        'h-10 w-10 transition-colors duration-200',
                        isActive ? 'text-yellow-400' : 'text-slate-200'
                      )}
                    />
                  </button>
                );
              })}
            </div>
            {errors.rating && (
              <p className="animate-pulse text-sm font-medium text-red-500">
                {errors.rating.message as string}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Label htmlFor="content" className="font-semibold text-slate-700">
              Share your thoughts
            </Label>
            <Textarea
              id="content"
              placeholder="Tell us what you liked or what we can do better..."
              {...register('content', { required: 'Please leave a comment' })}
              className={`min-h-[140px] resize-none rounded-xl border-slate-200 bg-slate-50 p-4 text-base transition-all duration-200 placeholder:text-slate-400 focus:border-transparent focus:bg-white focus:ring-2 focus:ring-slate-900 ${
                readOnly ? 'pointer-events-none opacity-70' : ''
              }`}
              readOnly={readOnly}
              disabled={readOnly}
            />
            {errors.content && (
              <p className="text-xs font-medium text-red-500">{errors.content.message as string}</p>
            )}
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full rounded-xl bg-slate-900 text-lg font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-lg"
            disabled={submitting || isSubmitting || readOnly}
          >
            {readOnly
              ? 'Preview — Read Only'
              : submitting || isSubmitting
                ? 'Posting...'
                : 'Post Review'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ReviewForm;
