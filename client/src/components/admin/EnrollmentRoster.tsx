import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { EnrollmentRecord } from '@shared/types';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Download, CheckCircle2, Circle } from 'lucide-react';

type StatusFilter = 'all' | 'completed' | 'in-progress';

/** Formats an ISO timestamp as YYYY-MM-DD in the viewer's locale offset. */
function formatDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Escapes a CSV field.
 *
 * Quoting alone protects the file's structure but not its contents: Excel and
 * LibreOffice strip the surrounding quotes and then evaluate any field that
 * starts with `=`, `+`, `-` or `@` as a formula. Student names come straight
 * from self-registration, so a name like `=HYPERLINK(...)` would execute in
 * the admin's spreadsheet — with the roster's other names and emails in
 * adjacent cells. A leading apostrophe forces Excel to treat the value as
 * literal text.
 */
function csvField(value: string): string {
  const literal = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${literal.replace(/"/g, '""')}"`;
}

function toCsv(rows: EnrollmentRecord[]): string {
  const header = ['학기', '강의', '이름', '이메일', '수강신청일', '완료여부', '완료일'];
  const body = rows.map((r) =>
    [
      r.semesterTitle,
      r.courseTitle,
      r.userName,
      r.userEmail,
      formatDate(r.enrolledAt),
      r.completed ? '완료' : '수강중',
      formatDate(r.completedAt),
    ]
      .map(csvField)
      .join(','),
  );
  return [header.map(csvField).join(','), ...body].join('\r\n');
}

export function EnrollmentRoster() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');

  const { data, isLoading, error } = useQuery<EnrollmentRecord[]>({
    queryKey: ['/api/admin/enrollments'],
  });

  const rows = useMemo(() => data ?? [], [data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (status === 'completed' && !r.completed) return false;
      if (status === 'in-progress' && r.completed) return false;
      if (!q) return true;
      return (
        r.userName.toLowerCase().includes(q) ||
        r.userEmail.toLowerCase().includes(q) ||
        r.courseTitle.toLowerCase().includes(q) ||
        r.semesterTitle.toLowerCase().includes(q)
      );
    });
  }, [rows, search, status]);

  // Grouped by course so the admin reads it as a class roster rather than a
  // flat log — that is how attendance is actually taken.
  const byCourse = useMemo(() => {
    interface CourseGroup {
      courseId: number;
      title: string;
      semester: string;
      records: EnrollmentRecord[];
    }
    const groups: CourseGroup[] = [];
    const index = new Map<number, CourseGroup>();

    for (const r of filtered) {
      const existing = index.get(r.courseId);
      if (existing) {
        existing.records.push(r);
      } else {
        // `filtered` preserves the server's semester/course ordering, so
        // pushing in encounter order keeps the roster in curriculum order.
        const group: CourseGroup = {
          courseId: r.courseId,
          title: r.courseTitle,
          semester: r.semesterTitle,
          records: [r],
        };
        groups.push(group);
        index.set(r.courseId, group);
      }
    }
    return groups;
  }, [filtered]);

  const handleExport = () => {
    // The BOM makes Excel open the file as UTF-8 instead of mangling Hangul.
    const blob = new Blob(['﻿' + toCsv(filtered)], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `수강현황_${formatDate(new Date().toISOString())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalCompleted = filtered.filter((r) => r.completed).length;

  return (
    <Card className="mb-12" data-testid="card-enrollment-roster">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <ClipboardList className="h-5 w-5 text-brand-primary" />
          <h2 className="text-xl font-semibold text-foreground">수강 현황</h2>
        </div>

        {error ? (
          <p className="text-sm text-destructive" data-testid="text-roster-error">
            수강 현황을 불러오지 못했습니다.
          </p>
        ) : isLoading ? (
          <p className="text-sm text-muted-foreground">불러오는 중…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground" data-testid="text-roster-empty">
            아직 수강 신청이 없습니다.
          </p>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <Input
                placeholder="이름, 이메일, 강의명으로 검색"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="sm:max-w-xs"
                data-testid="input-roster-search"
              />
              <div className="flex gap-2">
                {(
                  [
                    ['all', '전체'],
                    ['in-progress', '수강중'],
                    ['completed', '완료'],
                  ] as const
                ).map(([key, label]) => (
                  <Button
                    key={key}
                    variant={status === key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatus(key)}
                    data-testid={`button-roster-filter-${key}`}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 sm:ml-auto"
                onClick={handleExport}
                disabled={filtered.length === 0}
                data-testid="button-roster-export"
              >
                <Download className="h-4 w-4" />
                CSV 내보내기
              </Button>
            </div>

            <p className="text-sm text-muted-foreground mb-4" data-testid="text-roster-summary">
              {filtered.length}건 (완료 {totalCompleted}건
              {filtered.length > 0
                ? ` · ${Math.round((totalCompleted / filtered.length) * 100)}%`
                : ''}
              )
            </p>

            {byCourse.length === 0 ? (
              <p className="text-sm text-muted-foreground" data-testid="text-roster-no-match">
                검색 조건에 맞는 수강 내역이 없습니다.
              </p>
            ) : (
              <div className="space-y-6">
                {byCourse.map((group) => (
                  <div
                    key={group.courseId}
                    data-testid={`section-roster-course-${group.courseId}`}
                  >
                    <div className="flex flex-wrap items-baseline gap-2 mb-2">
                      <h3 className="font-semibold text-foreground">{group.title}</h3>
                      <span className="text-xs text-muted-foreground">{group.semester}</span>
                      <span className="text-xs text-muted-foreground">
                        · {group.records.length}명 (완료{' '}
                        {group.records.filter((r) => r.completed).length}명)
                      </span>
                    </div>
                    <div className="border rounded-lg divide-y">
                      {group.records.map((r) => (
                        <div
                          key={`${r.userId}-${r.courseId}`}
                          className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
                          data-testid={`row-roster-${r.courseId}-${r.userId}`}
                        >
                          <div className="min-w-0">
                            <span className="font-medium text-foreground">{r.userName}</span>
                            <span className="text-sm text-muted-foreground ml-2 break-all">
                              {r.userEmail}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xs text-muted-foreground">
                              신청 {formatDate(r.enrolledAt)}
                            </span>
                            {r.completed ? (
                              <Badge variant="default" className="gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                완료 {formatDate(r.completedAt)}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="gap-1">
                                <Circle className="h-3 w-3" />
                                수강중
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
