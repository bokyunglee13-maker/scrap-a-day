'use client';

// app/new/page.tsx
// Stamp registration flow (Phase 3). Single-scroll page rather than a wizard —
// fewer screens to load on mobile, single back-button gesture cancels.
//
// Three internal phases:
//   pickPhoto → crop → meta
// Photo cannot be changed after pickPhoto (PRD §06 §3.4). The "사진 다시" button
// in `meta` only re-crops the same photo, never replaces it.
//
// Future-date guard returns the "내일을 기다려요" screen (PRD §05 등록 시점 정책).
// Failure handling per PRD §11 §9.2.2.

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PhotoCropper, type CropperPatch } from '@/components/editor/PhotoCropper';
import { MemoInput } from '@/components/editor/MemoInput';
import { MoodPicker } from '@/components/editor/MoodPicker';
import { StylePicker } from '@/components/editor/StylePicker';
import { StampPreview } from '@/components/editor/StampPreview';
import { validatePhotoFile } from '@/lib/photoValidation';
import { createStamp, type StampInput } from '@/lib/stamps';
import { incrementFailed } from '@/lib/usage';
import type { CropData, Mood, StampStyle } from '@/types';

type Phase = 'pickPhoto' | 'crop' | 'meta';

interface CropState {
  x: number;
  y: number;
  zoom: number;
  pixelArea: { x: number; y: number; width: number; height: number };
}

const INITIAL_CROP: CropState = {
  x: 0,
  y: 0,
  zoom: 1,
  pixelArea: { x: 0, y: 0, width: 0, height: 0 },
};

function todayKey(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

function isFutureDate(iso: string): boolean {
  // Compare on date-only granularity. `iso` is 'YYYY-MM-DD'; today's same fmt
  // makes a lexicographic compare safe.
  return iso > todayKey();
}

function formatDisplayDate(iso: string): string {
  try {
    return format(parseISO(iso), 'yyyy년 M월 d일', { locale: ko });
  } catch {
    return iso;
  }
}

function FutureGuard({ date }: { date: string }) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 py-10 text-center">
      <p className="font-handwriting text-3xl text-stamp-ink">
        내일을 기다려요
      </p>
      <p className="mt-3 text-sm text-stamp-ink/60">
        {formatDisplayDate(date)}은 아직 오지 않았어요.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex h-12 items-center rounded-md bg-stamp-ink px-6 text-base text-stamp-paper"
      >
        캘린더로 돌아가기
      </Link>
    </main>
  );
}

function NewStampInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get('date');
  const date = useMemo(
    () => (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : todayKey()),
    [dateParam],
  );

  const futureBlocked = isFutureDate(date);

  // Phase + draft state. Kept as discrete useState; no reducer needed.
  const [phase, setPhase] = useState<Phase>('pickPhoto');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState<CropState>(INITIAL_CROP);
  const [memo, setMemo] = useState<string>('');
  const [mood, setMood] = useState<Mood | null>(null);
  const [moodVisible, setMoodVisible] = useState<boolean>(true);
  const [style, setStyle] = useState<StampStyle>('minimal');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [showCancelDialog, setShowCancelDialog] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Blob URL hygiene: revoke when the URL changes or on unmount. PRD §15.5.4.
  useEffect(() => {
    if (!photoUrl) return;
    return () => {
      URL.revokeObjectURL(photoUrl);
    };
  }, [photoUrl]);

  const isDirty =
    photoFile !== null ||
    memo !== '' ||
    mood !== null ||
    style !== 'minimal';

  const handlePickPhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // reset so re-picking the same file fires again
    if (!file) return;
    const err = validatePhotoFile(file);
    if (err) {
      toast.error(err.message);
      return;
    }
    // Revoke any previous URL (e.g. user picked then went back).
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    const url = URL.createObjectURL(file);
    setPhotoFile(file);
    setPhotoUrl(url);
    setCrop(INITIAL_CROP);
    setPhase('crop');
  };

  const handleCropPatch = useCallback((patch: CropperPatch) => {
    setCrop((prev) => ({
      x: patch.x ?? prev.x,
      y: patch.y ?? prev.y,
      zoom: patch.zoom ?? prev.zoom,
      pixelArea: patch.pixelArea ?? prev.pixelArea,
    }));
  }, []);

  const handleCancelClick = () => {
    if (isDirty) {
      setShowCancelDialog(true);
    } else {
      router.push('/');
    }
  };

  const confirmCancel = () => {
    setShowCancelDialog(false);
    router.push('/');
  };

  const handleSubmit = async () => {
    if (!photoFile) return;
    setSubmitting(true);
    try {
      const cropData: CropData = {
        x: crop.x,
        y: crop.y,
        width: crop.pixelArea.width,
        height: crop.pixelArea.height,
        zoom: crop.zoom,
      };
      const input: StampInput = {
        date,
        photoBlob: photoFile,
        crop: cropData,
        memo,
        mood,
        moodVisible,
        style,
      };
      const result = await createStamp(input);
      if (result.ok) {
        toast.success('우표를 붙였어요');
        router.push('/');
        return;
      }
      // Failure paths — track and surface.
      await incrementFailed(date);
      if (result.error === 'DUPLICATE_DATE') {
        toast.error('이미 등록된 날짜입니다', {
          action: {
            label: '이 날짜 우표 보기',
            onClick: () => router.push(`/stamp/${date}`),
          },
        });
      } else {
        toast.error('잠시 후 다시 시도해주세요');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (futureBlocked) {
    return <FutureGuard date={date} />;
  }

  const headerLabel = formatDisplayDate(date);

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 pb-32 md:py-10">
      {/* Header */}
      <header className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleCancelClick}
          aria-label="취소"
          className="inline-flex items-center gap-1 rounded-sm p-2 text-sm text-stamp-ink/70 hover:bg-stamp-ink/5 hover:text-stamp-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronLeft className="size-5" />
          <span>취소</span>
        </button>
        <h1 className="font-serif text-base text-stamp-ink md:text-lg">
          {headerLabel}
        </h1>
        <span className="w-12" aria-hidden /> {/* spacer balances the back button */}
      </header>

      {/* Hidden file input is always mounted so re-picking works */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        hidden
        onChange={handleFileChange}
      />

      <section className="mt-6">
        {phase === 'pickPhoto' && (
          <div className="flex flex-col items-center gap-4 py-12">
            <p className="font-handwriting text-2xl text-stamp-ink/70">
              오늘, 한 장
            </p>
            <Button
              type="button"
              onClick={handlePickPhotoClick}
              className="h-14 px-8 text-base"
            >
              사진 선택
            </Button>
            <p className="text-xs text-stamp-ink/40">
              JPEG · PNG · WEBP · 최대 20MB
            </p>
          </div>
        )}

        {phase === 'crop' && photoUrl && (
          <div className="flex flex-col gap-4">
            <PhotoCropper
              imageUrl={photoUrl}
              crop={{ x: crop.x, y: crop.y }}
              zoom={crop.zoom}
              onChange={handleCropPatch}
            />
            <Button
              type="button"
              onClick={() => setPhase('meta')}
              className="h-12 w-full text-base"
            >
              다음
            </Button>
          </div>
        )}

        {phase === 'meta' && photoFile && (
          <div className="flex flex-col gap-6">
            <StampPreview
              date={date}
              photoBlob={photoFile}
              crop={{
                x: crop.x,
                y: crop.y,
                width: crop.pixelArea.width,
                height: crop.pixelArea.height,
                zoom: crop.zoom,
              }}
              memo={memo}
              mood={mood}
              moodVisible={moodVisible}
              style={style}
            />

            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setPhase('crop')}
                className="rounded-sm px-3 py-2 text-xs text-stamp-ink/60 underline-offset-2 hover:underline"
              >
                사진 다시 크롭
              </button>
            </div>

            <section className="flex flex-col gap-2">
              <h2 className="text-xs font-medium uppercase tracking-wide text-stamp-ink/50">
                스타일
              </h2>
              <StylePicker value={style} onChange={setStyle} />
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="text-xs font-medium uppercase tracking-wide text-stamp-ink/50">
                감정
              </h2>
              <MoodPicker
                value={mood}
                onChange={setMood}
                visible={moodVisible}
                onVisibleChange={setMoodVisible}
              />
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="text-xs font-medium uppercase tracking-wide text-stamp-ink/50">
                메모
              </h2>
              <MemoInput value={memo} onChange={setMemo} />
            </section>
          </div>
        )}
      </section>

      {/* Fixed bottom save bar — only shown in meta phase. Safe-area aware. */}
      {phase === 'meta' && (
        <div
          className="fixed inset-x-0 bottom-0 border-t border-stamp-ink/10 bg-stamp-paper px-4 pt-3"
          style={{
            paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
          }}
        >
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!photoFile || submitting}
            className="h-12 w-full text-base"
          >
            {submitting ? '저장 중…' : '우표 붙이기'}
          </Button>
        </div>
      )}

      {/* Cancel-confirm dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>작성 중인 내용이 사라져요</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-stamp-ink/70">
            지금 나가면 입력한 메모, 감정, 사진이 저장되지 않아요.
          </p>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
            >
              계속 작성
            </Button>
            <Button type="button" variant="destructive" onClick={confirmCancel}>
              나가기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

export default function NewStampPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-2xl px-4 py-10 text-center text-sm text-stamp-ink/50">
          로딩 중…
        </main>
      }
    >
      <NewStampInner />
    </Suspense>
  );
}
