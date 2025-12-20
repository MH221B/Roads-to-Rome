import { Spinner } from './ui/spinner';

export default function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner className="h-12 w-12" />
    </div>
  );
}
