import { Button } from "@/components/ui/button";
import { useNavigate, useParams, useLocation } from "react-router-dom";
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
  newPassword: string;
  confirmPassword: string;
};

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const ResetPassword = () => {
  const navigate = useNavigate();
  const { token: paramToken } = useParams();
  const query = useQuery();
  const token = paramToken ?? query.get('token') ?? '';

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>();

  const mutation = useMutation({
    mutationFn: (data: { token: string; newPassword: string }) => api.post('/api/auth/change-password', data),
    onSuccess: () => {
      Swal.fire({ title: 'Password changed', text: 'Your password has been updated.', icon: 'success', confirmButtonText: 'OK' })
        .then(() => navigate('/login'));
    },
    onError: (err: any) => {
      const message = err?.response?.data?.message ?? err?.message ?? 'Request failed';
      Swal.fire({ title: 'Error', text: message, icon: 'error', confirmButtonText: 'OK' });
    }
  });

  const onSubmit = (data: FormValues) => {
    if (!token) {
      Swal.fire({ title: 'Missing token', text: 'Reset token is missing. Use the link from your email.', icon: 'error', confirmButtonText: 'OK' });
      return;
    }
    mutation.mutate({ token, newPassword: data.newPassword });
  };

  const newPassword = watch('newPassword', '');

  return (
    <div className="flex flex-col items-center justify-center flex-1 p-4 min-h-screen">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>Provide a new password for your account.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="newPassword">New password</Label>
                <Input id="newPassword" type="password" {...register('newPassword', { required: 'Password is required', minLength: { value: 6, message: 'Password must be at least 6 characters' } })} />
                {errors.newPassword && <p className="text-sm text-red-500">{(errors.newPassword as any)?.message}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input id="confirmPassword" type="password" {...register('confirmPassword', { required: 'Please confirm password', validate: v => v === newPassword || 'Passwords do not match' })} />
                {errors.confirmPassword && <p className="text-sm text-red-500">{(errors.confirmPassword as any)?.message}</p>}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-2 mt-5">
            <Button type="submit" className="w-full" disabled={mutation.status === 'pending'}>
              {mutation.status === 'pending' ? 'Updating...' : 'Change password'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default ResetPassword;
