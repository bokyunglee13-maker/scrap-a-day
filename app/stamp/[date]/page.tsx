'use client';

// app/stamp/[date]/page.tsx
// Phase 4 — detail screen for a single date's stamp. PRD §06.
//
// LoadState (PRD §11 §9.4.3):
//   undefined  → loading
//   null       → empty (no active stamp for this date)
//   Stamp      → success
//
// All edits route through dialog components in components/editor/. No
// "사진 변경" UI here — there is intentionally NO <input type="file">
// anywhere on this page. PRD §06 §3.4 absolute rule. Changing the photo
// requires delete + re-register.

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  ChevronLeft,
  Crop,
  MessageSquare,
  Palette,
  Sparkles,
  Trash2,
  Users,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Stamp as StampView } from '@/components/stamp/Stamp';
import { useStampByDate } from '@/hooks/useStamp';
import type { Mood, Stamp } from '@/types';
import { cn } from '@/lib/utils';

import { EditMemoDialog } from '@/components/editor/EditMemoDialog';
import { EditMoodDialog } from '@/components/editor/EditMoodDialog';
import { EditStyleDialog } from '@/components/editor/EditStyleDialog';
import { EditCompanionsDialog } from '@/components/editor/EditCompanionsDialog';
import { RecropDialog } from '@/components/editor/RecropDialog';
import { DeleteStampDialog } from '@/components/editor/DeleteStampDialog';
import { ExportStamp } from '@/components/share/ExportStamp';

interface PageProps {
  // Next 16: dynamic route params are exposed as a Promise.
  params: Promise<{ date: string }>;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

interface MoodSpec {
  label: string;
  bg: string;
}

const MOOD_MAP: Record<Mood, MoodSpec> = {
  joy: { label: '기쁨', bg: 'bg-mood-joy' },
  calm: { label: '평온', bg: 'bg-mood-calm' },
  serene: { label: '차분', bg: 'bg-mood-serene' },
  blue: { label: '우울', bg: 'bg-mood-blue' },
  flutter: { label: '설렘', bg: 'bg-mood-flutter' },
};

function formatLongDate(iso: string): string {
  try {
    return format(parseISO(iso), 'yyyy년 M월 d일 (EEEE)', { locale: ko });
  } catch {
    return iso;
  }
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-md px-4 py-6 pb-12 md:py-10">
      <header className="flex items-center justify-between">
        <Link
          href="/"
          aria-label="캘린더로 돌아가기"
          className="inline-flex items-center gap-1 rounded-sm p-2 text-sm text-stamp-ink/70 hover:bg-stamp-ink/5 hover:text-stamp-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronLeft className="size-5" />
          <span>뒤로</span>
        </Link>
        <span className="w-12" aria-hidden />
      </header>
      {children}
    </main>
  );
}

function InvalidDate() {
  return (
    <PageShell>
      <div className="mt-16 flex flex-col items-center gap-4 text-center">
        <p className="font-handwriting text-2xl text-stamp-ink">
          잘못된 날짜
        </p>
        <Link
          href="/"
          className="inline-flex h-12 items-center rounded-md bg-stamp-ink px-6 text-base text-stamp-paper"
        >
          캘린더로 돌아가기
        </Link>
      </div>
    </PageShell>
  );
}

function Loading() {
  return (
    <PageShell>
      <div className="mt-16 flex flex-col items-center gap-3 text-sm text-stamp-ink/50">
        <div className="size-48 animate-pulse rounded-md bg-stamp-ink/5" />
        <p>불러오는 중…</p>
      </div>
    </PageShell>
  );
}

function EmptyState({ date }: { date: string }) {
  return (
    <PageShell>
      <div className="mt-16 flex flex-col items-center gap-6 text-center">
        <p className="font-handwriting text-2xl text-stamp-ink/70">
          이 날짜엔 우표가 없어요
        </p>
        <p className="text-sm text-stamp-ink/50">{formatLongDate(date)}</p>
        <Link
          href={`/new?date=${date}`}
          className="inline-flex h-12 items-center rounded-md bg-stamp-ink px-6 text-base text-stamp-paper"
        >
          우표 붙이기
        </Link>
      </div>
    </PageShell>
  );
}

function MoodBadge({ stamp }: { stamp: Stamp }) {
  if (!stamp.mood) return null;
  const spec = MOOD_MAP[stamp.mood];
  return (
    <div className="inline-flex items-center gap-2 text-sm text-stamp-ink/70">
      <span
        className={cn(
          'inline-block size-3 rounded-full',
          spec.bg,
        )}
        aria-hidden
      />
      <span>{spec.label}</span>
      {!stamp.moodVisible && (
        <span className="text-xs text-stamp-ink/40">(숨김)</span>
      )}
    </div>
  );
}

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

function ActionButton({ icon, label, onClick }: ActionButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      className="h-12 w-full justify-start gap-2 px-4"
    >
      {icon}
      <span>{label}</span>
    </Button>
  );
}

function StampDetailView({ stamp }: { stamp: Stamp }) {
  const router = useRouter();
  const [recropOpen, setRecropOpen] = useState(false);
  const [memoOpen, setMemoOpen] = useState(false);
  const [moodOpen, setMoodOpen] = useState(false);
  const [styleOpen, setStyleOpen] = useState(false);
  const [companionsOpen, setCompanionsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const companions = stamp.companions ?? [];

  return (
    <PageShell>
      <section className="mt-6 flex flex-col items-center gap-5">
        <div className="w-[70%] max-w-xs">
          <StampView stamp={stamp} size="full" showDate showMood />
        </div>

        <h1 className="font-serif text-2xl text-stamp-ink">
          {formatLongDate(stamp.date)}
        </h1>

        <MoodBadge stamp={stamp} />

        {stamp.memo && (
          <p className="max-w-prose whitespace-pre-wrap break-words text-center text-base text-stamp-ink/80">
            {stamp.memo}
          </p>
        )}

        {companions.length > 0 && (
          <div className="flex max-w-prose flex-col items-center gap-2">
            <h2 className="text-sm font-medium text-stamp-ink/60">
              함께한 사람
            </h2>
            <ul className="flex flex-wrap justify-center gap-1.5">
              {companions.map((name) => (
                <li key={name}>
                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        `/search?companion=${encodeURIComponent(name)}`,
                      )
                    }
                    className="rounded-full bg-stamp-ink/10 px-2 py-0.5 text-xs text-stamp-ink hover:bg-stamp-ink/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`${name} 우표 검색`}
                  >
                    {name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <hr className="my-8 border-stamp-ink/10" />

      {/* Action grid. 2 columns on mobile keeps every target ≥ 44px tall and
          large enough to tap without misfires. */}
      <section className="grid grid-cols-2 gap-3">
        <ActionButton
          icon={<Crop className="size-4" />}
          label="크롭 다시"
          onClick={() => setRecropOpen(true)}
        />
        <ActionButton
          icon={<MessageSquare className="size-4" />}
          label="메모 수정"
          onClick={() => setMemoOpen(true)}
        />
        <ActionButton
          icon={<Sparkles className="size-4" />}
          label="감정 변경"
          onClick={() => setMoodOpen(true)}
        />
        <ActionButton
          icon={<Palette className="size-4" />}
          label="스타일 변경"
          onClick={() => setStyleOpen(true)}
        />
        <ActionButton
          icon={<Users className="size-4" />}
          label="함께한 사람"
          onClick={() => setCompanionsOpen(true)}
        />
        <ExportStamp stamp={stamp} />
        <Button
          type="button"
          variant="destructive"
          onClick={() => setDeleteOpen(true)}
          className="h-12 gap-2"
        >
          <Trash2 className="size-4" />
          삭제
        </Button>
      </section>

      {/* Dialogs — each is uncontrolled-content/controlled-open. */}
      <RecropDialog
        open={recropOpen}
        onOpenChange={setRecropOpen}
        stamp={stamp}
      />
      <EditMemoDialog
        open={memoOpen}
        onOpenChange={setMemoOpen}
        stamp={stamp}
      />
      <EditMoodDialog
        open={moodOpen}
        onOpenChange={setMoodOpen}
        stamp={stamp}
      />
      <EditStyleDialog
        open={styleOpen}
        onOpenChange={setStyleOpen}
        stamp={stamp}
      />
      <EditCompanionsDialog
        open={companionsOpen}
        onOpenChange={setCompanionsOpen}
        stamp={stamp}
      />
      <DeleteStampDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        stamp={stamp}
      />
    </PageShell>
  );
}

export default function StampDetailPage({ params }: PageProps) {
  const { date } = use(params);

  if (!DATE_RE.test(date)) {
    return <InvalidDate />;
  }

  // Hook order is preserved: state below in StampDetailView only mounts on
  // success branch, but the LoadState branches above don't introduce any
  // conditional hooks here in the page component itself.
  const stamp = useStampByDate(date);

  if (stamp === undefined) return <Loading />;
  if (stamp === null) return <EmptyState date={date} />;
  return <StampDetailView stamp={stamp} />;
}
