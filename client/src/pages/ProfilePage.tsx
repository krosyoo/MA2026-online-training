import { useState } from 'react';
import { Link } from 'wouter';
import { User } from '@shared/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { UserCircle, KeyRound, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { AuthResult } from '@/contexts/AuthContext';

interface ProfilePageProps {
  user: User | null;
  onChangePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<AuthResult>;
}

export function ProfilePage({ user, onChangePassword }: ProfilePageProps) {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center justify-center p-3 bg-brand-light rounded-full mb-4">
              <UserCircle className="h-8 w-8 text-brand-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">로그인이 필요합니다</h1>
            <Link href="/auth">
              <Button variant="default" data-testid="button-login" asChild>
                <span className="cursor-pointer">로그인하기</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('새 비밀번호가 서로 일치하지 않습니다.');
      return;
    }
    if (newPassword.length < 8) {
      setError('새 비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }
    if (newPassword === currentPassword) {
      setError('새 비밀번호가 현재 비밀번호와 같습니다.');
      return;
    }

    setIsSubmitting(true);
    const result = await onChangePassword(currentPassword, newPassword);
    setIsSubmitting(false);

    if (result.ok) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast({
        title: '비밀번호를 변경했습니다',
        description: '다른 기기에서 로그인되어 있었다면 모두 로그아웃됩니다.',
      });
    } else {
      setError(result.message || '비밀번호를 변경하지 못했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-10">
            <div className="inline-flex items-center justify-center p-3 bg-brand-light rounded-full mb-4">
              <UserCircle className="h-8 w-8 text-brand-primary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-2" data-testid="text-page-title">
              내 정보
            </h1>
          </div>

          {user.mustChangePassword && (
            <Card className="mb-6 border-destructive" data-testid="banner-must-change-password">
              <div className="p-4 flex gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">
                    임시 비밀번호를 사용 중입니다
                  </p>
                  <p className="text-sm text-muted-foreground">
                    관리자가 발급한 임시 비밀번호는 다른 사람이 알고 있을 수 있습니다.
                    아래에서 본인만 아는 비밀번호로 바꿔주세요.
                  </p>
                </div>
              </div>
            </Card>
          )}

          <Card className="mb-6">
            <div className="p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">이름</span>
                <span className="font-medium text-foreground" data-testid="text-profile-name">
                  {user.name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">이메일</span>
                <span className="font-medium text-foreground" data-testid="text-profile-email">
                  {user.email}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">역할</span>
                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                  {user.role === 'admin' ? '관리자' : '학생'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">수강 중인 강의</span>
                <span className="font-medium text-foreground">
                  {user.enrolledCourses.length}개 (완료 {user.completedCourses.length}개)
                </span>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <KeyRound className="h-5 w-5 text-brand-primary" />
                <h2 className="text-xl font-semibold text-foreground">비밀번호 변경</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="current-password">현재 비밀번호</Label>
                  <Input
                    id="current-password"
                    type="password"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    data-testid="input-current-password"
                  />
                </div>
                <div>
                  <Label htmlFor="new-password">새 비밀번호 (8자 이상)</Label>
                  <Input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    data-testid="input-new-password"
                  />
                </div>
                <div>
                  <Label htmlFor="confirm-password">새 비밀번호 확인</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    data-testid="input-confirm-password"
                  />
                </div>

                {error && (
                  <div className="text-sm text-destructive" data-testid="text-error">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full gap-2"
                  data-testid="button-change-password"
                >
                  <KeyRound className="h-4 w-4" />
                  {isSubmitting ? '변경 중…' : '비밀번호 변경'}
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
