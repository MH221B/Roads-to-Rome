import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useMutation } from '@tanstack/react-query'
import api from '@/services/axiosClient'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from 'sweetalert2'

type FormValues = {
  email: string;
};

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>();

  const mutation = useMutation({
    mutationFn: (data: FormValues) => api.post('/api/auth/forgot-password', data),
    onSuccess: () => {
      Swal.fire({
        title: 'Email sent',
        text: 'If that email exists we sent password reset instructions. Check your inbox.',
        icon: 'success',
        confirmButtonText: 'OK'
      }).then(() => navigate('/'));
    },
    onError: (err: any) => {
      const message = err?.response?.data?.message ?? err?.message ?? 'Request failed';
      Swal.fire({ title: 'Error', text: message, icon: 'error', confirmButtonText: 'OK' });
    }
  });

  const onSubmit = (data: FormValues) => mutation.mutate(data);

  return (
    <div className="flex flex-col items-center justify-center flex-1 p-4 min-h-screen">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Forgot Password</CardTitle>
          <CardDescription>Enter your account email to receive reset instructions.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  {...register('email', { required: 'Email is required', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email address' } })}
                />
                {errors.email && <p className="text-sm text-red-500">{(errors.email as any)?.message}</p>}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-2 mt-5">
            <Button type="submit" className="w-full" disabled={mutation.status === 'pending'}>
              {mutation.status === 'pending' ? 'Sending...' : 'Send reset email'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default ForgotPassword;
