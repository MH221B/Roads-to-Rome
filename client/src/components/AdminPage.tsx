import * as React from "react";
import HeaderComponent from "@/components/HeaderComponent";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthProvider";

function decodeJwtPayload(token: string | null): any | null {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

const AdminPage: React.FC = () => {
  const { accessToken } = useAuth();

  const payload = React.useMemo(() => decodeJwtPayload(accessToken), [accessToken]);
  const rawRoles = payload?.roles ?? payload?.role;
  const roles: string[] = (Array.isArray(rawRoles) ? rawRoles : rawRoles ? [rawRoles] : []).map((r) => String(r).toUpperCase());
  const email: string | undefined = payload?.username ?? payload?.sub ?? undefined;

  return (
    <div className="min-h-screen flex flex-col">
      <HeaderComponent />

      <main className="flex-1 max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

        <section className="mb-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Account</CardTitle>
                <CardDescription>Currently signed-in user</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <div className="text-sm text-muted-foreground">Email</div>
                  <div className="font-medium">{email ?? 'Unknown user'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Roles</div>
                  <div className="font-medium">{roles.length ? roles.join(', ') : 'None'}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Roles</h2>
          <div className="mt-2">
            {roles.length === 0 ? (
              <p>No roles present in token.</p>
            ) : (
              <ul className="list-disc pl-6">
                {roles.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminPage;
