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

interface AuthPageProps {
  onLogin: (email: string, password: string) => boolean;
  onSignup: (email: string, password: string, name: string) => boolean;
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

  const handleLogin = (values: LoginFormValues) => {
    setError('');
    const success = onLogin(values.email, values.password);
    if (success) {
      setLocation('/my-status');
    } else {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.');
    }
  };

  const handleSignup = (values: SignupFormValues) => {
    setError('');
    const success = onSignup(values.email, values.password, values.name);
    if (success) {
      setLocation('/my-status');
    } else {
      setError('이미 사용 중인 이메일입니다.');
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
              {isLogin ? (
                <Form {...loginForm}>
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
                      className="w-full gap-2"
                      data-testid="button-submit"
                    >
                      <LogIn className="h-4 w-4" />
                      로그인
                    </Button>
                  </form>
                </Form>
              ) : (
                <Form {...signupForm}>
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
                      className="w-full gap-2"
                      data-testid="button-submit"
                    >
                      <UserPlus className="h-4 w-4" />
                      회원가입
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
