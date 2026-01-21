'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { addDays, format, startOfWeek } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Check, Edit2, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DEPARTMENTS } from '@/constants';

type GreetingRow = { weekday: number; members: string[] };
type AttendanceStatus = 'on_time' | 'late' | 'absent';
type AttendanceRow = {
  name: string;
  checked: boolean;
  status?: AttendanceStatus | null;
  checked_at?: string | null;
  excused?: boolean | null;
  excuse_reason?: string | null;
  excused_at?: string | null;
  evidence_url?: string | null;
  evidence_path?: string | null;
  evidence_name?: string | null;
  evidence_type?: string | null;
  evidence_size?: number | null;
  evidence_uploaded_at?: string | null;
};
type SkipRow = { date: string; reason?: string };
type MemberDraft = { department: string; name: string };

const WEEKDAYS = [
  { value: 1, label: '월요일' },
  { value: 2, label: '화요일' },
  { value: 3, label: '수요일' },
  { value: 4, label: '목요일' },
  { value: 5, label: '금요일' },
] as const;

const parseMember = (member: string) => {
  const parts = member.split('/').map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return { department: parts[0], name: parts.slice(1).join('/') };
  }
  return { department: '', name: member.trim() };
};

const formatMember = (member: string) => {
  const parsed = parseMember(member);
  if (parsed.department && parsed.name) {
    return `${parsed.department}/${parsed.name}`;
  }
  return member;
};

export default function MorningGreeting({
  selectedDate,
  isAdmin,
}: {
  selectedDate: Date;
  isAdmin?: boolean;
}) {
  const [schedule, setSchedule] = useState<Record<number, string[]>>({});
  const [editMode, setEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [attendance, setAttendance] = useState<Record<string, AttendanceRow>>({});
  const [isAttendanceLoading, setIsAttendanceLoading] = useState(false);
  const [drafts, setDrafts] = useState<Record<number, MemberDraft>>({});
  const [skipMap, setSkipMap] = useState<Record<string, string>>({});
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [excuseDrafts, setExcuseDrafts] = useState<Record<string, string>>({});
  const [previewOpen, setPreviewOpen] = useState<Record<string, boolean>>({});
  const [previewError, setPreviewError] = useState<Record<string, boolean>>({});

  const selectedWeekday = useMemo(() => {
    const day = selectedDate.getDay();
    return day === 0 ? 7 : day;
  }, [selectedDate]);

  const weekStart = useMemo(
    () => startOfWeek(selectedDate, { weekStartsOn: 1 }),
    [selectedDate]
  );

  const weekDates = useMemo(
    () =>
      WEEKDAYS.map((day, idx) => ({
        weekday: day.value,
        label: day.label,
        date: addDays(weekStart, idx),
      })),
    [weekStart]
  );

  useEffect(() => {
    const fetchGreeting = async () => {
      try {
        const res = await fetch('/api/greetings');
        if (!res.ok) return;
        const data: GreetingRow[] = await res.json();
        const next: Record<number, string[]> = {};
        data.forEach((row) => {
          next[row.weekday] = row.members ?? [];
        });
        setSchedule(next);
      } catch (error) {
        console.error('Failed to fetch greetings:', error);
      }
    };

    fetchGreeting();
  }, []);

  useEffect(() => {
    const fetchSkips = async () => {
      try {
        const start = format(weekStart, 'yyyy-MM-dd');
        const end = format(addDays(weekStart, 4), 'yyyy-MM-dd');
        const res = await fetch(`/api/greetings/skips?start=${start}&end=${end}`);
        if (!res.ok) return;
        const data: SkipRow[] = await res.json();
        const next: Record<string, string> = {};
        data.forEach((row) => {
          next[row.date] = row.reason ?? '생략';
        });
        setSkipMap(next);
      } catch (error) {
        console.error('Failed to fetch skips:', error);
      }
    };

    fetchSkips();
  }, [weekStart]);

  useEffect(() => {
    if (!editMode) return;
    setDrafts((prev) => {
      const next = { ...prev };
      WEEKDAYS.forEach((day) => {
        if (!next[day.value]) {
          next[day.value] = {
            department: DEPARTMENTS[0] ?? '',
            name: '',
          };
        }
      });
      return next;
    });
  }, [editMode]);

  const loadAttendance = useCallback(async (dateKey: string, members: string[]) => {
    if (members.length === 0) {
      setAttendance({});
      return;
    }

    setIsAttendanceLoading(true);
    try {
      const res = await fetch(`/api/greetings/attendance?date=${dateKey}`);
      if (!res.ok) return;
      const data: AttendanceRow[] = await res.json();
      const next: Record<string, AttendanceRow> = {};
      data.forEach((row) => {
        next[row.name] = {
          name: row.name,
          checked: Boolean(row.checked),
          status: row.status ?? null,
          checked_at: row.checked_at ?? null,
          excused: row.excused ?? null,
          excuse_reason: row.excuse_reason ?? null,
          excused_at: row.excused_at ?? null,
          evidence_url: row.evidence_url ?? null,
          evidence_path: row.evidence_path ?? null,
          evidence_name: row.evidence_name ?? null,
          evidence_type: row.evidence_type ?? null,
          evidence_size: row.evidence_size ?? null,
          evidence_uploaded_at: row.evidence_uploaded_at ?? null,
        };
      });
      setAttendance(next);
      setExcuseDrafts((prev) => {
        const nextDrafts = { ...prev };
        data.forEach((row) => {
          if (!(row.name in nextDrafts)) {
            nextDrafts[row.name] = row.excuse_reason ?? '';
          }
        });
        return nextDrafts;
      });
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
    } finally {
      setIsAttendanceLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchAttendance = async () => {
      const weekday = selectedWeekday;
      if (weekday < 1 || weekday > 5) {
        setAttendance({});
        return;
      }

      const dateKey = format(selectedDate, 'yyyy-MM-dd');
      if (skipMap[dateKey]) {
        setAttendance({});
        return;
      }

      const members = schedule[weekday] ?? [];
      await loadAttendance(dateKey, members);
    };

    fetchAttendance();
  }, [selectedDate, schedule, selectedWeekday, skipMap, loadAttendance]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload: GreetingRow[] = WEEKDAYS.map((day) => ({
        weekday: day.value,
        members: schedule[day.value] ?? [],
      }));
      const res = await fetch('/api/greetings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '저장에 실패했습니다.');
      }
      setEditMode(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : '저장에 실패했습니다.';
      alert(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleAttendance = async (name: string) => {
    if (!isAdmin) return;
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const previous = attendance[name];
    const nextChecked = !previous?.checked;
    setAttendance((prev) => ({
      ...prev,
      [name]: {
        name,
        checked: nextChecked,
        status: nextChecked ? previous?.status ?? null : null,
        checked_at: nextChecked ? previous?.checked_at ?? null : null,
        excused: nextChecked ? previous?.excused ?? null : null,
        excuse_reason: nextChecked ? previous?.excuse_reason ?? null : null,
        excused_at: nextChecked ? previous?.excused_at ?? null : null,
      },
    }));

    try {
      const res = await fetch('/api/greetings/attendance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateKey, name, checked: nextChecked }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update');
      }
      const members = schedule[selectedWeekday] ?? [];
      await loadAttendance(dateKey, members);
    } catch (err) {
      setAttendance((prev) => ({
        ...prev,
        [name]:
          previous ?? {
            name,
            checked: !nextChecked,
            status: null,
            checked_at: null,
            excused: null,
            excuse_reason: null,
            excused_at: null,
          },
      }));
      const message = err instanceof Error ? err.message : '출석 체크 저장에 실패했습니다.';
      alert(message);
    }
  };

  const handleExcuseReasonChange = (name: string, value: string) => {
    setExcuseDrafts((prev) => ({ ...prev, [name]: value }));
  };

  const handleExcuse = async (name: string, status: AttendanceStatus) => {
    if (!isAdmin) return;
    const reason = (excuseDrafts[name] ?? '').trim() || null;
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const previous = attendance[name];
    setAttendance((prev) => ({
      ...prev,
      [name]: {
        name,
        checked: true,
        status,
        checked_at: previous?.checked_at ?? null,
        excused: true,
        excuse_reason: reason,
        excused_at: previous?.excused_at ?? null,
      },
    }));

    try {
      const res = await fetch('/api/greetings/attendance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: dateKey,
          name,
          checked: true,
          status,
          excused: true,
          excuse_reason: reason,
          checked_at: previous?.checked_at ?? null,
          excused_at: previous?.excused_at ?? null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update');
      }
      const members = schedule[selectedWeekday] ?? [];
      await loadAttendance(dateKey, members);
    } catch (err) {
      setAttendance((prev) => ({
        ...prev,
        [name]:
          previous ?? {
            name,
            checked: false,
            status: null,
            checked_at: null,
            excused: null,
            excuse_reason: null,
            excused_at: null,
          },
      }));
      const message = err instanceof Error ? err.message : '면제 저장에 실패했습니다.';
      alert(message);
    }
  };

  const handleClearExcuse = async (name: string) => {
    if (!isAdmin) return;
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const previous = attendance[name];
    if (!previous) return;
    setAttendance((prev) => ({
      ...prev,
      [name]: {
        ...previous,
        excused: false,
        excuse_reason: null,
        excused_at: null,
      },
    }));

    try {
      const res = await fetch('/api/greetings/attendance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: dateKey,
          name,
          checked: previous.checked,
          status: previous.status ?? null,
          excused: false,
          excuse_reason: null,
          checked_at: previous.checked_at ?? null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update');
      }
      const members = schedule[selectedWeekday] ?? [];
      await loadAttendance(dateKey, members);
    } catch (err) {
      setAttendance((prev) => ({ ...prev, [name]: previous }));
      const message = err instanceof Error ? err.message : '면제 취소에 실패했습니다.';
      alert(message);
    }
  };

  const handleDownloadEvidence = async (record: AttendanceRow) => {
    if (!record.evidence_path) return;
    try {
      const res = await fetch(
        `/api/greetings/attendance/download?path=${encodeURIComponent(record.evidence_path)}&name=${encodeURIComponent(
          record.evidence_name || 'evidence'
        )}`
      );
      if (!res.ok) {
        throw new Error('다운로드 실패');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = record.evidence_name || 'evidence';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      const message = err instanceof Error ? err.message : '다운로드에 실패했습니다.';
      alert(message);
    }
  };

  const handleTogglePreview = (name: string) => {
    setPreviewError((prev) => ({ ...prev, [name]: false }));
    setPreviewOpen((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const buildPreviewSrc = (record: AttendanceRow) => {
    if (record.evidence_path) {
      const type = record.evidence_type || 'image/jpeg';
      return `/api/greetings/attendance/preview?path=${encodeURIComponent(record.evidence_path)}&type=${encodeURIComponent(
        type
      )}`;
    }
    if (record.evidence_url) {
      return record.evidence_url;
    }
    return null;
  };

  const handleSaveEvidenceLink = async (name: string) => {
    if (!isAdmin) return;
    const url = window.prompt('인증 사진 링크를 입력하세요 (http/https)')?.trim();
    if (!url) return;
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const previous = attendance[name];
    try {
      const res = await fetch('/api/greetings/attendance/evidence', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateKey, name, url }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '링크 저장에 실패했습니다.');
      }
      const members = schedule[selectedWeekday] ?? [];
      await loadAttendance(dateKey, members);
    } catch (err) {
      setAttendance((prev) => ({ ...prev, [name]: previous ?? prev[name] }));
      const message = err instanceof Error ? err.message : '링크 저장에 실패했습니다.';
      alert(message);
    }
  };

  const handleUploadEvidence = async (name: string, file: File | null) => {
    if (!file) return;
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const members = schedule[selectedWeekday] ?? [];
    setUploading((prev) => ({ ...prev, [name]: true }));
    try {
      const formData = new FormData();
      formData.append('date', dateKey);
      formData.append('name', name);
      formData.append('file', file);
      const res = await fetch('/api/greetings/attendance/upload', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '업로드에 실패했습니다.');
      }
      await loadAttendance(dateKey, members);
    } catch (err) {
      const message = err instanceof Error ? err.message : '업로드에 실패했습니다.';
      alert(message);
    } finally {
      setUploading((prev) => ({ ...prev, [name]: false }));
    }
  };

  const handleRemoveEvidence = async (name: string) => {
    if (!isAdmin) return;
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    try {
      const res = await fetch(
        `/api/greetings/attendance/evidence?date=${encodeURIComponent(dateKey)}&name=${encodeURIComponent(name)}`,
        { method: 'DELETE' }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '증빙 삭제에 실패했습니다.');
      }
      setPreviewOpen((prev) => ({ ...prev, [name]: false }));
      setPreviewError((prev) => ({ ...prev, [name]: false }));
      const members = schedule[selectedWeekday] ?? [];
      await loadAttendance(dateKey, members);
    } catch (err) {
      const message = err instanceof Error ? err.message : '증빙 삭제에 실패했습니다.';
      alert(message);
    }
  };

  const handleRemoveMember = (weekday: number, member: string) => {
    setSchedule((prev) => ({
      ...prev,
      [weekday]: (prev[weekday] ?? []).filter((item) => item !== member),
    }));
  };

  const handleAddMember = (weekday: number) => {
    const draft = drafts[weekday];
    if (!draft) return;
    const name = draft.name.trim();
    const department = draft.department.trim();
    if (!department || !name) return;

    const entry = `${department}/${name}`;
    setSchedule((prev) => {
      const list = prev[weekday] ?? [];
      if (list.includes(entry)) return prev;
      return { ...prev, [weekday]: [...list, entry] };
    });

    setDrafts((prev) => ({
      ...prev,
      [weekday]: { ...draft, name: '' },
    }));
  };

  const toggleSkip = async (dateKey: string) => {
    if (!isAdmin) return;
    const isSkipped = Boolean(skipMap[dateKey]);
    setSkipMap((prev) => {
      const next = { ...prev };
      if (isSkipped) {
        delete next[dateKey];
      } else {
        next[dateKey] = '생략';
      }
      return next;
    });

    try {
      if (isSkipped) {
        const res = await fetch(`/api/greetings/skips?date=${dateKey}`, { method: 'DELETE' });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to delete');
        }
      } else {
        const res = await fetch('/api/greetings/skips', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: dateKey, reason: '생략' }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to save');
        }
      }
    } catch (err) {
      setSkipMap((prev) => {
        const next = { ...prev };
        if (isSkipped) {
          next[dateKey] = '생략';
        } else {
          delete next[dateKey];
        }
        return next;
      });
      const message = err instanceof Error ? err.message : '생략 저장에 실패했습니다.';
      alert(message);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 mt-3">
      <div className="glass rounded-2xl border border-white/15 p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-foreground">아침인사</p>
            <p className="text-xs text-muted-foreground">
              {format(selectedDate, 'M월 d일 (EEE)', { locale: ko })} 기준 · 1~2학년 학생회
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCollapsed((prev) => !prev)}
              className="rounded-full px-3 py-1.5 text-xs font-semibold bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors"
            >
              {isCollapsed ? '열기' : '닫기'}
            </button>
            {isAdmin && (
              <button
                onClick={() => (editMode ? handleSave() : setEditMode(true))}
                disabled={isSaving}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                  editMode
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary/60 text-muted-foreground hover:text-foreground'
                )}
              >
                {editMode ? <Check size={14} /> : <Edit2 size={14} />}
                {editMode ? (isSaving ? '저장 중...' : '저장') : '편집'}
              </button>
            )}
          </div>
        </div>

        {isCollapsed ? (
          <div className="mt-3 text-xs text-muted-foreground">
            아침인사가 접혀 있습니다. “열기”를 눌러 확인하세요.
          </div>
        ) : (
          <>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {weekDates.map((day) => {
            const members = schedule[day.weekday] ?? [];
            const isToday = selectedWeekday === day.weekday;
            const dateKey = format(day.date, 'yyyy-MM-dd');
            const isSkipped = Boolean(skipMap[dateKey]);
            const draft = drafts[day.weekday] ?? { department: DEPARTMENTS[0] ?? '', name: '' };

            return (
              <div
                key={day.weekday}
                className={cn(
                  'rounded-xl border border-white/10 bg-white/40 p-3 text-xs text-foreground dark:bg-white/5',
                  isToday && 'ring-2 ring-primary/60'
                )}
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{day.label}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {format(day.date, 'M/d', { locale: ko })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {editMode && (
                      <button
                        type="button"
                        onClick={() => toggleSkip(dateKey)}
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors',
                          isSkipped
                            ? 'bg-red-500 text-white'
                            : 'bg-red-100 text-red-600 hover:bg-red-200'
                        )}
                      >
                        생략
                      </button>
                    )}
                    <span className="text-[11px] text-muted-foreground">
                      {members.length ? `${members.length}명` : '미정'}
                    </span>
                  </div>
                </div>

                {isSkipped && !editMode ? (
                  <p className="text-[11px] font-semibold text-red-500">생략</p>
                ) : editMode ? (
                  <>
                    {members.length > 0 ? (
                      <ul className="space-y-1">
                        {members.map((member) => (
                          <li
                            key={`${day.weekday}-${member}`}
                            className="flex items-center justify-between gap-2 rounded-lg border border-white/10 px-2 py-1 text-[12px]"
                          >
                            <span>{formatMember(member)}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(day.weekday, member)}
                              className="text-muted-foreground hover:text-foreground"
                              aria-label="삭제"
                            >
                              <X size={12} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[11px] text-muted-foreground">등록된 인원이 없습니다.</p>
                    )}

                    <div className="mt-2 flex flex-col gap-2">
                      <select
                        value={draft.department}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [day.weekday]: { ...draft, department: e.target.value },
                          }))
                        }
                        className="w-full rounded-lg border border-border bg-background/80 px-2 py-1 text-xs text-foreground"
                      >
                        {DEPARTMENTS.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <input
                          value={draft.name}
                          onChange={(e) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [day.weekday]: { ...draft, name: e.target.value },
                            }))
                          }
                          placeholder="이름 입력"
                          className="flex-1 rounded-lg border border-border bg-background/80 px-2 py-1 text-xs text-foreground"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddMember(day.weekday)}
                          className="inline-flex items-center gap-1 rounded-lg bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground"
                        >
                          <Plus size={12} />
                          추가
                        </button>
                      </div>
                      <p className="text-[10px] text-muted-foreground">형식: 부서/이름</p>
                    </div>
                  </>
                ) : members.length ? (
                  <ul className="space-y-1">
                    {members.map((member, idx) => (
                      <li key={`${day.weekday}-${idx}`} className="text-[12px] text-foreground">
                        • {formatMember(member)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[11px] text-muted-foreground">등록된 인원이 없습니다.</p>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-white/40 p-3 text-xs text-foreground dark:bg-white/5">
          <div className="flex items-center justify-between">
            <span className="font-semibold">오늘 참여 확인</span>
            <span className="text-[11px] text-muted-foreground">
              {selectedWeekday >= 1 && selectedWeekday <= 5 ? '평일' : '주말'}
            </span>
          </div>
          {selectedWeekday < 1 || selectedWeekday > 5 ? (
            <p className="mt-2 text-[11px] text-muted-foreground">주말에는 아침인사가 없습니다.</p>
          ) : skipMap[format(selectedDate, 'yyyy-MM-dd')] ? (
            <p className="mt-2 text-[11px] font-semibold text-red-500">오늘은 아침인사가 생략되었습니다.</p>
          ) : isAttendanceLoading ? (
            <p className="mt-2 text-[11px] text-muted-foreground">불러오는 중...</p>
          ) : (schedule[selectedWeekday] ?? []).length === 0 ? (
            <p className="mt-2 text-[11px] text-muted-foreground">등록된 인원이 없습니다.</p>
          ) : (
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {(schedule[selectedWeekday] ?? []).map((member) => {
                const record = attendance[member];
                const checked = Boolean(record?.checked);
                const status = record?.status ?? (checked ? 'on_time' : null);
                const excused = Boolean(record?.excused);
                const hasEvidence = Boolean(record?.evidence_url || record?.evidence_path);
                const isUploading = Boolean(uploading[member]);
                const statusLabel = !checked
                  ? '미체크'
                  : excused
                  ? status === 'late'
                    ? '지각 면제'
                    : status === 'absent'
                    ? '결석 면제'
                    : '면제'
                  : status === 'late'
                  ? '지각'
                  : status === 'absent'
                  ? '결석'
                  : '정상';
                const timeLabel =
                  record?.checked_at && !excused ? format(new Date(record.checked_at), 'HH:mm') : null;
                const label = checked && timeLabel ? `${statusLabel} · ${timeLabel}` : statusLabel;
                const statusClass = checked
                  ? excused
                    ? 'bg-slate-500/15 text-slate-600 dark:text-slate-300'
                    : status === 'late'
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                    : status === 'absent'
                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300'
                    : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                  : 'bg-transparent text-foreground';
                return (
                  <div key={member} className="space-y-1">
                    <button
                      type="button"
                      onClick={() => handleToggleAttendance(member)}
                      disabled={!isAdmin}
                      className={cn(
                        'flex items-center justify-between rounded-lg border border-white/10 px-3 py-2 text-left text-xs transition-colors',
                        statusClass,
                        !isAdmin && 'cursor-default'
                      )}
                    >
                      <span>{formatMember(member)}</span>
                      <span className="text-[10px] font-semibold">{label}</span>
                    </button>
                    {record?.excuse_reason && (
                      <p className="text-[10px] text-muted-foreground">사유: {record.excuse_reason}</p>
                    )}
                    {hasEvidence && (
                      <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                        <span className="font-semibold text-foreground">증빙</span>
                        {record?.evidence_url && (
                          <a
                            href={record.evidence_url}
                            target="_blank"
                            rel="noreferrer"
                            className="underline underline-offset-2"
                          >
                            링크 보기
                          </a>
                        )}
                        {record?.evidence_path && (
                          <button
                            type="button"
                            onClick={() => handleDownloadEvidence(record)}
                            className="underline underline-offset-2"
                          >
                            사진 다운로드
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleTogglePreview(member)}
                            className="underline underline-offset-2"
                          >
                            {previewOpen[member] ? '미리보기 닫기' : '미리보기'}
                          </button>
                        )}
                      </div>
                    )}
                    {isAdmin && hasEvidence && previewOpen[member] && (
                      <div className="mt-2">
                        {buildPreviewSrc(record) ? (
                          <img
                            src={buildPreviewSrc(record) ?? ''}
                            alt="증빙 사진 미리보기"
                            className="h-20 w-20 rounded-lg border border-white/10 object-cover"
                            loading="lazy"
                            onError={() => setPreviewError((prev) => ({ ...prev, [member]: true }))}
                          />
                        ) : null}
                        {previewError[member] && (
                          <p className="text-[10px] text-rose-500">미리보기에 실패했습니다.</p>
                        )}
                      </div>
                    )}
                    {isAdmin && (
                      <>
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            value={excuseDrafts[member] ?? ''}
                            onChange={(event) => handleExcuseReasonChange(member, event.target.value)}
                            placeholder="면제 사유 입력 (선택)"
                            className="min-w-[120px] flex-1 rounded-lg border border-border bg-background/80 px-2 py-1 text-[11px] text-foreground"
                          />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {record?.excused ? (
                            <button
                              type="button"
                              onClick={() => handleClearExcuse(member)}
                              className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
                            >
                              면제 취소
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleExcuse(member, 'late')}
                                className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
                              >
                                지각 면제
                              </button>
                              <button
                                type="button"
                                onClick={() => handleExcuse(member, 'absent')}
                                className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
                              >
                                결석 면제
                              </button>
                            </>
                          )}
                        </div>
                      </>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <label className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground cursor-pointer">
                        {isUploading ? '업로드 중...' : '사진 업로드'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(event) => {
                            const file = event.currentTarget.files?.[0] ?? null;
                            event.currentTarget.value = '';
                            if (!file) return;
                            handleUploadEvidence(member, file);
                          }}
                          disabled={isUploading}
                        />
                      </label>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleSaveEvidenceLink(member)}
                          className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
                        >
                          링크 등록
                        </button>
                      )}
                      {isAdmin && hasEvidence && (
                        <button
                          type="button"
                          onClick={() => handleRemoveEvidence(member)}
                          className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
                        >
                          증빙 삭제
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <p className="mt-2 text-[11px] text-muted-foreground">
            07:40 이후 체크는 지각, 08:10 이후 체크는 결석으로 처리됩니다.
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">사진 증빙은 3일 후 자동 삭제됩니다.</p>
          {!isAdmin && (
            <p className="mt-2 text-[11px] text-muted-foreground">
              출석 체크는 관리자만 가능합니다.
            </p>
          )}
        </div>
          </>
        )}
      </div>
    </div>
  );
}
