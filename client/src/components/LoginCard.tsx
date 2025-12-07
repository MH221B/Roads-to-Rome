import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthProvider';
import { FaGithub, FaEye, FaEyeSlash } from 'react-icons/fa';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Swal from 'sweetalert2';

type FormValues = {
  email: string;
  password: string;
};

const LoginCard = () => {
  const navigate = useNavigate();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>();
  const { login } = useAuth();

  const mutation: UseMutationResult<void, unknown, FormValues, unknown> = useMutation<
    void,
    unknown,
    FormValues
  >({
    mutationFn: ({ email, password }: FormValues) => login(email, password),
    onSuccess: () => {
      Swal.fire({
        title: 'Success!',
        text: 'You have logged in successfully.',
        icon: 'success',
        confirmButtonText: 'OK',
      }).then((result) => {
        if (result.isConfirmed) {
          navigate('/');
        }
      });
    },
    onError: (err: any) => {
      const message = err?.response?.data?.message ?? err?.message ?? 'Login failed';
      Swal.fire({
        title: 'Login Error',
        text: message,
        icon: 'error',
        confirmButtonText: 'OK',
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    mutation.mutate(data);
  };

  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>Enter your email below to login to your account</CardDescription>
          <CardAction>
            <Button variant="link" onClick={() => navigate('/signup')}>
              Sign Up
            </Button>
          </CardAction>
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
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Invalid email address',
                    },
                  })}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{(errors.email as any)?.message}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={passwordVisible ? 'text' : 'password'}
                    className="pr-12"
                    {...register('password', {
                      required: 'Password is required',
                      minLength: { value: 6, message: 'Password must be at least 6 characters' },
                    })}
                  />
                  <button
                    type="button"
                    aria-label={passwordVisible ? 'Hide password' : 'Show password'}
                    onClick={() => setPasswordVisible((v) => !v)}
                    className="absolute top-1/2 right-2 z-20 -translate-y-1/2 bg-transparent text-gray-500 hover:text-gray-700"
                  >
                    {passwordVisible ? (
                      <FaEyeSlash className="h-4 w-4" />
                    ) : (
                      <FaEye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500">{(errors.password as any)?.message}</p>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="mt-5 flex-col gap-2">
            <Button type="submit" className="w-full" disabled={mutation.status === 'pending'}>
              {mutation.status === 'pending' ? 'Logging in...' : 'Login'}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              type="button"
              onClick={() =>
                (window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/github`)
              }
            >
              <FaGithub className="mr-2 h-4 w-4" />
              Login with GitHub
            </Button>
            <Button type="button" variant="link" onClick={() => navigate('/forgot-password')}>
              Forgot password?
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default LoginCard;
