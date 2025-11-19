import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from 'sweetalert2'
import { registerUser } from "@/services/authService";

type FormValues = {
  email: string;
  password: string;
  confirmPassword: string;
};

const RegisterCard = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      const result = await registerUser(data.email, data.password);
      console.log("Registration successful:", result);
      await Swal.fire({
        title: 'Account created!',
        text: 'Your account has been created successfully.',
        icon: 'success',
        confirmButtonText: 'OK'
      });
      navigate('/login');
    } catch (error: any) {
      let message = 'An error occurred while creating the account.';
      if (error) {
        const backendError = error?.response?.data ?? error;

        if (backendError?.error === 'Conflict' || error?.response?.status === 409) {
          message = 'Email already registered!';
        } else if (typeof backendError === 'string') {
          message = backendError;
        } else if (backendError?.message) {
          message = backendError.message;
        } else if (backendError?.error) {
          message = String(backendError.error);
        }
      }
      Swal.fire({ title: 'Registration failed!', text: message, icon: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center flex-1 p-4 min-h-screen">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>Enter your details to create a new account</CardDescription>
          <CardAction>
            <Button variant="link" onClick={() => navigate('/login')}>
              Log In
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
                  {...register('email', { required: true })}
                />
                {errors.email && <span className="text-sm text-red-600">Email is required</span>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'Password must be at least 8 characters!' },
                    pattern: {
                      value: /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+/,
                      message: 'Password must include uppercase, lowercase, number and special character!',
                    },
                  })}
                />
                {errors.password && (
                  <span className="text-sm text-red-600">{String(errors.password.message)}</span>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...register('confirmPassword', {
                    required: true,
                    validate: (value) => value === watch('password') || 'Passwords do not match!',
                  })}
                />
                {errors.confirmPassword && <span className="text-sm text-red-600">{String(errors.confirmPassword.message ?? 'Confirm your password')}</span>}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-2 mt-5">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing up...' : 'Sign Up'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default RegisterCard;
