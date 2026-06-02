"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styled, { createGlobalStyle, keyframes } from "styled-components";
import { MdLibraryMusic } from "react-icons/md";
import Link from "next/link";
import { useAuth } from "../context/auth";

const GlobalStyle = createGlobalStyle`
  html, body {
    margin: 0;
    padding: 0;
    background-color: #0b0b10;
    font-family: "Roboto", "Segoe UI", Arial, sans-serif;
  }
`;

const slideUp = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
`;

const Page = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  background-color: #0b0b10;
`;

const Card = styled.div`
  width: 100%;
  max-width: 400px;
  background: #0f111a;
  border: 1px solid #1f1f2a;
  padding: 36px 32px 32px;
  animation: ${slideUp} 0.25s ease;
`;

const BrandRow = styled(Link)`
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  margin-bottom: 28px;
`;

const BrandIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 24px;
  background: #f5f5f5;
  color: #0b0b10;
  font-size: 12px;
`;

const BrandName = styled.span`
  font-size: 18px;
  font-weight: 800;
  color: #f5f5f5;
  letter-spacing: 0.3px;
`;

const Tabs = styled.div`
  display: flex;
  gap: 4px;
  background: #1a1d29;
  padding: 4px;
  margin-bottom: 28px;
`;

const Tab = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 9px 0;
  border: none;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  background: ${(p) => (p.$active ? "#2a2f3d" : "transparent")};
  color: ${(p) => (p.$active ? "#f5f5f5" : "#8b90a0")};
  &:hover { color: #f5f5f5; }
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
`;

const Label = styled.label`
  font-size: 12px;
  font-weight: 600;
  color: #8b90a0;
  letter-spacing: 0.5px;
  text-transform: uppercase;
`;

const Input = styled.input`
  padding: 11px 14px;
  border: 1px solid #2a2f3d;
  background: #141824;
  color: #f5f5f5;
  font-size: 14px;
  outline: none;
  transition: border-color 0.15s;
  &:focus { border-color: #a78bfa; }
  &::placeholder { color: #4b5563; }
`;

const ErrorMsg = styled.p`
  font-size: 13px;
  color: #f87171;
  margin: 0 0 16px;
  padding: 10px 14px;
  background: rgba(248, 113, 113, 0.08);
  border: 1px solid rgba(248, 113, 113, 0.2)
`;

const SubmitBtn = styled.button`
  width: 100%;
  padding: 12px;
  margin-top: 4px;
  border: none;
  background: #a78bfa;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s, opacity 0.15s;
  &:hover:not(:disabled) { background: #9061f9; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

type Mode = "signin" | "register";

export default function SignInPage() {
  const router = useRouter();
  const { user, signIn, signUp } = useAuth();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);


  useEffect(() => {
    if (user) router.replace("/");
  }, [user, router]);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError("");
    setEmail("");
    setUsername("");
    setPassword("");
    setPasswordConfirm("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (mode === "register" && password !== passwordConfirm) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      if (mode === "signin") {
        await signIn(email, password);
      } else {
        await signUp(email, username, password, passwordConfirm);
      }
      router.replace("/");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <GlobalStyle />
      <Page>
        <Card>
          <BrandRow href="/">
            <BrandIcon><MdLibraryMusic /></BrandIcon>
            <BrandName>TypingMIXX</BrandName>
          </BrandRow>

          <Tabs>
            <Tab $active={mode === "signin"} onClick={() => switchMode("signin")}>
              Sign in
            </Tab>
            <Tab $active={mode === "register"} onClick={() => switchMode("register")}>
              Register
            </Tab>
          </Tabs>

          <form onSubmit={handleSubmit}>
            <Field>
              <Label htmlFor="auth-email">Email</Label>
              <Input
                id="auth-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </Field>

            {mode === "register" && (
              <Field>
                <Label htmlFor="auth-username">Username</Label>
                <Input
                  id="auth-username"
                  type="text"
                  placeholder="your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                />
              </Field>
            )}

            <Field>
              <Label htmlFor="auth-password">Password</Label>
              <Input
                id="auth-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Field>

            {mode === "register" && (
              <Field>
                <Label htmlFor="auth-confirm">Confirm password</Label>
                <Input
                  id="auth-confirm"
                  type="password"
                  placeholder="••••••••"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  required
                />
              </Field>
            )}

            {error && <ErrorMsg>{error}</ErrorMsg>}

            <SubmitBtn type="submit" disabled={busy}>
              {busy
                ? mode === "signin" ? "Signing in…" : "Creating account…"
                : mode === "signin" ? "Sign in"    : "Create account"}
            </SubmitBtn>
          </form>
        </Card>
      </Page>
    </>
  );
}
