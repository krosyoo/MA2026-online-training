import { useState } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { LogIn, UserPlus } from 'lucide-react';
import type { AuthResult } from '@/contexts/AuthContext';

interface AuthPageProps {
  onLogin: (email: string, password: string) => Promise<AuthResult>;
  onSignup: (
    email: string,
    password: string,
    name: string,
  ) => Promise<AuthResult>;
}

const loginSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요.'),
  password: z.string().min(1, '비밀번호를 입력해주세요.'),
});

const signupSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요.'),
  email: z.string().email('유효한 이메일을 입력해주세요.'),
  password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다.'),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type SignupFormValues = z.infer<typeof signupSchema>;

export function AuthPage({ onLogin, onSignup }: AuthPageProps) {
  const [, setLocation] = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const handleLogin = async (values: LoginFormValues) => {
    setError('');
    setIsSubmitting(true);
    const result = await onLogin(values.email, values.password);
    setIsSubmitting(false);

    if (result.ok) {
      setLocation('/my-status');
    } else {
      setError(result.message || '이메일 또는 비밀번호가 올바르지 않습니다.');
    }
  };

  const handleSignup = async (values: SignupFormValues) => {
    setError('');
    setIsSubmitting(true);
    const result = await onSignup(values.email, values.password, values.name);
    setIsSubmitting(false);

    if (result.ok) {
      setLocation('/my-status');
    } else {
      setError(result.message || '회원가입에 실패했습니다.');
    }
  };

  const switchMode = (loginMode: boolean) => {
    setIsLogin(loginMode);
    setError('');
    loginForm.reset();
    signupForm.reset();
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <Card>
            <div className="p-8">
              {/* Toggle Tabs */}
              <div className="flex border-b mb-6">
                <button
                  className={`flex-1 py-3 text-center font-medium transition-all ${
                    isLogin
                      ? 'border-b-2 border-brand-primary text-brand-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => switchMode(true)}
                  data-testid="button-tab-login"
                >
                  로그인
                </button>
                <button
                  className={`flex-1 py-3 text-center font-medium transition-all ${
                    !isLogin
                      ? 'border-b-2 border-brand-primary text-brand-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => switchMode(false)}
                  data-testid="button-tab-signup"
                >
                  회원가입
                </button>
              </div>

              {/* Login Form */}
              {/* The two branches render the same component types in the same
                  positions, so without distinct keys React reconciles the login
                  form's Controllers into the signup form's instead of
                  remounting them. The fields then stay bound to the previous
                  form's control and silently reject all input. */}
              {isLogin ? (
                <Form key="login" {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>이메일</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder="example@email.com"
                              data-testid="input-email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>비밀번호</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="password"
                              placeholder="••••••••"
                              data-testid="input-password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {error && (
                      <div className="text-sm text-destructive" data-testid="text-error">
                        {error}
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full gap-2"
                      data-testid="button-submit"
                    >
                      <LogIn className="h-4 w-4" />
                      {isSubmitting ? '로그인 중…' : '로그인'}
                    </Button>
                  </form>
                </Form>
              ) : (
                <Form key="signup" {...signupForm}>
                  <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
                    <FormField
                      control={signupForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>이름</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="text"
                              placeholder="홍길동"
                              data-testid="input-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={signupForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>이메일</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder="example@email.com"
                              data-testid="input-email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={signupForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>비밀번호</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="password"
                              placeholder="••••••••"
                              data-testid="input-password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {error && (
                      <div className="text-sm text-destructive" data-testid="text-error">
                        {error}
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full gap-2"
                      data-testid="button-submit"
                    >
                      <UserPlus className="h-4 w-4" />
                      {isSubmitting ? '가입 중…' : '회원가입'}
                    </Button>
                  </form>
                </Form>
              )}

              {/* Demo Accounts Info */}
              <div className="mt-6 p-4 bg-brand-light/50 rounded-lg">
                <p className="text-sm font-medium text-foreground mb-2">테스트 계정</p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p data-testid="text-demo-student">학생: student@test.com / password</p>
                  <p data-testid="text-demo-admin">관리자: admin@test.com / password</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
