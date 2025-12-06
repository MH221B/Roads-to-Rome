import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
// Import Controller
import { useForm, Controller } from 'react-hook-form';
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
// Import Shadcn Select components
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Swal from 'sweetalert2';
import { registerUser } from '@/services/authService';

type FormValues = {
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
  username?: string;
  fullName?: string;
};

const RegisterCard = () => {
  const navigate = useNavigate();
  // Destructure 'control' here and set default role
  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { role: 'student' },
  });
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      const result = await registerUser(
        data.email,
        data.password,
        data.role,
        data.username,
        data.fullName
      );
      console.log('Registration successful:', result);
      await Swal.fire({
        title: 'Account created!',
        text: 'Your account has been created successfully.',
        icon: 'success',
        confirmButtonText: 'OK',
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
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center p-4">
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
                <Label htmlFor="username">Username</Label>
                <Input id="username" {...register('username', { required: true })} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input id="fullName" {...register('fullName', { required: true })} />
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
                      minLength: { value: 8, message: 'Password must be at least 8 characters!' },
                      pattern: {
                        value: /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+/,
                        message:
                          'Password must include uppercase, lowercase, number and special character!',
                      },
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
                  <span className="text-sm text-red-600">{String(errors.password.message)}</span>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Controller
                  name="role"
                  control={control}
                  rules={{ required: 'Role is required' }}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger id="role" className="w-full">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="instructor">Instructor</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.role && (
                  <span className="text-sm text-red-600">{String(errors.role.message)}</span>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={confirmVisible ? 'text' : 'password'}
                    className="pr-12"
                    {...register('confirmPassword', {
                      required: true,
                      validate: (value) => value === watch('password') || 'Passwords do not match!',
                    })}
                  />
                  <button
                    type="button"
                    aria-label={confirmVisible ? 'Hide password' : 'Show password'}
                    onClick={() => setConfirmVisible((v) => !v)}
                    className="absolute top-1/2 right-2 z-20 -translate-y-1/2 bg-transparent text-gray-500 hover:text-gray-700"
                  >
                    {confirmVisible ? (
                      <FaEyeSlash className="h-4 w-4" />
                    ) : (
                      <FaEye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <span className="text-sm text-red-600">
                    {String(errors.confirmPassword.message ?? 'Confirm your password')}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="mt-5 flex-col gap-2">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing up...' : 'Sign Up'}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              type="button"
              onClick={() => (window.location.href = `${import.meta.env.VITE_API_URL}/github`)}
            >
              <FaGithub className="mr-2 h-4 w-4" />
              Login with GitHub
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default RegisterCard;
