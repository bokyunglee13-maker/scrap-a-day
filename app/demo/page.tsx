'use client';

import { useEffect, useState } from 'react';
import { Stamp, EmptyStamp } from '@/components/stamp/Stamp';
import type { Stamp as StampRecord, StampStyle, Mood } from '@/types';

function makeDummyBlob(seed: number): Blob {
  const hues = [40, 200, 280, 340, 120, 20];
  const h = hues[seed % hues.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="hsl(${h}, 60%, 70%)"/>
        <stop offset="100%" stop-color="hsl(${(h + 50) % 360}, 55%, 40%)"/>
      </linearGradient>
    </defs>
    <rect width="300" height="300" fill="url(#g)"/>
    <text x="50%" y="56%" font-family="serif" font-size="80" fill="white" text-anchor="middle" opacity="0.55">${seed + 1}</text>
  </svg>`;
  return new Blob([svg], { type: 'image/svg+xml' });
}

interface SeedSpec {
  id: string;
  date: string;
  style: StampStyle;
  mood: Mood | null;
  moodVisible: boolean;
  memo: string;
  seed: number;
}

function buildStamp(spec: SeedSpec): StampRecord {
  return {
    id: spec.id,
    date: spec.date,
    photoBlob: makeDummyBlob(spec.seed),
    crop: { x: 0, y: 0, width: 300, height: 300, zoom: 1 },
    memo: spec.memo,
    mood: spec.mood,
    moodVisible: spec.moodVisible,
    style: spec.style,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };
}

const SEEDS: SeedSpec[] = [
  { id: 'classic-1',  date: '2026-05-20', style: 'classic',  mood: 'joy',     moodVisible: true,  memo: '햇살이 좋은 하루',     seed: 0 },
  { id: 'minimal-1',  date: '2026-05-21', style: 'minimal',  mood: 'calm',    moodVisible: true,  memo: '조용한 카페에서',       seed: 1 },
  { id: 'polaroid-1', date: '2026-05-22', style: 'polaroid', mood: 'flutter', moodVisible: true,  memo: '잊지 못할 노을',        seed: 2 },
  { id: 'minimal-2',  date: '2026-05-23', style: 'minimal',  mood: 'serene',  moodVisible: false, memo: '',                       seed: 3 },
];

const SIZES = ['sm', 'md', 'lg'] as const;

export default function DemoPage() {
  const [stamps, setStamps] = useState<StampRecord[]>([]);

  useEffect(() => {
    setStamps(SEEDS.map(buildStamp));
  }, []);

  if (stamps.length === 0) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10 text-stamp-ink/60">
        우표 로딩 중…
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <header className="mb-10">
        <h1 className="font-serif text-3xl text-stamp-ink">우표 디자인 데모</h1>
        <p className="mt-2 text-sm text-stamp-ink/60">
          Phase 1.4 검증 — 정적 데이터. 실제 DB·등록 플로우는 Phase 2~3.
        </p>
      </header>

      <section className="space-y-12">
        {stamps.map((s) => (
          <div key={s.id}>
            <h2 className="mb-3 font-serif text-lg text-stamp-ink/80">
              {s.style}
              {s.memo && <span className="text-stamp-ink/50"> — “{s.memo}”</span>}
              {!s.moodVisible && s.mood && (
                <span className="ml-2 rounded bg-stamp-ink/10 px-2 py-0.5 text-xs text-stamp-ink/60">
                  감정 숨김
                </span>
              )}
            </h2>
            <div className="flex flex-wrap items-end gap-6">
              {SIZES.map((size) => (
                <div key={size} className="flex flex-col items-center gap-2">
                  <Stamp stamp={s} size={size} showDate showMood />
                  <span className="text-xs text-stamp-ink/40">{size}</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div>
          <h2 className="mb-3 font-serif text-lg text-stamp-ink/80">빈 우표</h2>

          <div className="flex flex-wrap items-end gap-6">
            {SIZES.map((size) => (
              <div key={size} className="flex flex-col items-center gap-2">
                <EmptyStamp date="2026-05-25" size={size} />
                <span className="text-xs text-stamp-ink/40">{size}</span>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <p className="mb-3 text-xs text-stamp-ink/50">오늘 = 골드 글로우</p>
            <div className="flex flex-wrap items-end gap-6">
              {SIZES.map((size) => (
                <div key={size} className="flex flex-col items-center gap-2">
                  <EmptyStamp date="2026-05-24" size={size} isToday />
                  <span className="text-xs text-stamp-ink/40">{size} · 오늘</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <h2 className="mb-3 font-serif text-lg text-stamp-ink/80">시트 통일성 확인</h2>
          <p className="mb-4 text-xs text-stamp-ink/50">
            3종 스타일이 같은 종횡비/크기로 한 줄에 섞여도 정렬되는지.
          </p>
          <div className="flex flex-wrap items-end gap-3">
            {stamps.map((s) => (
              <Stamp key={`row-${s.id}`} stamp={s} size="md" showDate showMood />
            ))}
            <EmptyStamp date="2026-05-25" size="md" />
            <EmptyStamp date="2026-05-24" size="md" isToday />
          </div>
        </div>
      </section>

      <footer className="mt-16 border-t border-stamp-ink/10 pt-6 text-xs text-stamp-ink/40">
        스타일: {SEEDS.map((s) => s.style).join(' · ')} · 빈 우표 2종
      </footer>
    </main>
  );
}
