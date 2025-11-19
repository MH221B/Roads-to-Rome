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

const HomePage: React.FC = () => {
  const { accessToken, isAuthenticated } = useAuth();
  const payload = React.useMemo(() => decodeJwtPayload(accessToken), [accessToken]);
  const roles: string[] = Array.isArray(payload?.roles)
    ? payload.roles
    : payload?.roles
    ? [payload.roles]
    : [];

  const showAdmin = roles.includes("ADMIN");
  const email = payload?.username ?? payload?.sub ?? null;

  return (
    <div className="min-h-screen flex flex-col">
      <HeaderComponent showAdmin={showAdmin} />
      <main className="flex-1">
        {isAuthenticated && (
          <div className="max-w-4xl mx-auto px-4 py-6">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Dashboard</CardTitle>
                  <CardDescription>Account overview and roles</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <div className="text-sm text-muted-foreground">Email</div>
                    <div className="font-medium">{email ?? "Unknown"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Roles</div>
                    <div className="font-medium">{roles.length ? roles.join(", ") : "None"}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default HomePage;
