# 09. 데이터 모델 (IndexedDB / Dexie)

> 주 사용: **Phase 2** (스키마 정의), **Phase 4** (수정/삭제), **Phase 5** (백업/관측)

---

## 타입 정의

```typescript
// types/index.ts

export type Mood = 'joy' | 'calm' | 'serene' | 'blue' | 'flutter';
export type StampStyle = 'classic' | 'minimal' | 'polaroid';

export interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
  zoom: number;
}

export interface Stamp {
  id: string;                    // UUID
  date: string;                  // 'YYYY-MM-DD' (unique among active stamps)
  photoBlob: Blob;               // 표시용 (Phase 3부터 crop 적용된 결과)
  originalPhotoBlob?: Blob;      // 원본 (Phase 4 재크롭용). Phase 3 등록분은 없을 수 있음.
  crop: CropData;
  memo: string;                  // 최대 100자
  mood: Mood | null;
  moodVisible: boolean;
  style: StampStyle;
  companions?: string[];         // Phase 5+: 함께한 사람 free-text tags
  hideSpecialDaySticker?: boolean; // post-MVP: 이 우표의 특별한 날 스티커 숨김. default undefined = false = 표시
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;        // null이면 활성, 값 있으면 휴지통
}

export interface Settings {
  id: 'default';
  defaultStyle: StampStyle;      // 기본 우표 스타일
  weekStart: 'monday';           // 고정값 (확장 가능)
  lastBackupAt: Date | null;
  /** @deprecated post-MVP: per-stamp hideSpecialDaySticker로 대체.
   *  필드는 보존 (기존 데이터). 새 코드 path는 미사용. */
  disabledSpecialDays?: string[];
  /** post-MVP: 사용자 선택 앱 배경 색. 기본 '#FBEAF0' (브랜드 핑크).
   *  body 배경 + 우표 톱니 fill에 적용 (CSS variable --user-bg). */
  backgroundColor?: string;
}

// 관측 테이블 (12-observability.md)

export interface ErrorLog {
  id: string;                    // UUID
  timestamp: Date;
  source: string;                // 예: "createStamp"
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
}

export interface UsageDay {
  date: string;                  // 'YYYY-MM-DD' (unique)
  visitedAt: Date;
  registeredStamps: number;
  failedAttempts: number;
}
```

---

## Dexie 스키마

```typescript
// lib/db.ts

import Dexie, { Table } from 'dexie';
import type { Stamp, Settings, ErrorLog, UsageDay } from '@/types';

export class ScrapADayDB extends Dexie {
  stamps!: Table<Stamp, string>;
  settings!: Table<Settings, string>;
  errors!: Table<ErrorLog, string>;
  usage!: Table<UsageDay, string>;

  constructor() {
    super('ScrapADay');
    this.version(1).stores({
      stamps: 'id, date, deletedAt',
      settings: 'id',
      errors: 'id, timestamp',
      usage: 'date',
    });
  }
}

export const db = new ScrapADayDB();
```

---

## 인덱스

- `stamps.id` (primary key, UUID)
- `stamps.date` (조회용, unique는 코드에서 enforce)
- `stamps.deletedAt` (휴지통 필터링)
- `errors.id` (primary key)
- `errors.timestamp` (시간순 조회)
- `usage.date` (primary key, 날짜별)

---

## Unique 제약 (코드에서 enforce)

Dexie는 자동 unique 보장 X. CRUD 함수에서 체크:

```typescript
export async function createStamp(data: StampInput): Promise<Result<Stamp>> {
  const existing = await db.stamps
    .where('date').equals(data.date)
    .and(s => s.deletedAt === null)
    .first();

  if (existing) {
    return { ok: false, error: 'DUPLICATE_DATE' };
  }
  // ...
}
```

조건: `date` 같고 `deletedAt === null`인 우표가 이미 있으면 충돌.

---

## 자동 정리 규칙

| 테이블 | 정리 정책 |
|---|---|
| `stamps` with `deletedAt` | 30일 후 영구 삭제 (휴지통 정책) |
| `errors` | 500개 초과 시 오래된 것부터 삭제, 30일 이전 자동 삭제 |
| `usage` | 1년치 유지 (이후 월별 집계로 압축 검토) |
| `stamps` active | 자동 정리 없음 (사용자 데이터) |
| `settings` | 자동 정리 없음 |

앱 로드 시 한 번 실행:
- `cleanExpiredTrash()` — stamps
- `cleanOldErrors()` — errors
- `cleanOldUsage()` — usage

---

## CRUD 함수 표준

모든 함수는 `Result<T>` 타입 반환:

```typescript
type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };
```

예시:

```typescript
// lib/stamps.ts

export async function createStamp(data: StampInput): Promise<Result<Stamp>> {
  try {
    const existing = await db.stamps
      .where('date').equals(data.date)
      .and(s => s.deletedAt === null)
      .first();

    if (existing) {
      return { ok: false, error: 'DUPLICATE_DATE' };
    }

    const stamp = await db.transaction('rw', db.stamps, async () => {
      const newStamp = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };
      await db.stamps.add(newStamp);
      return newStamp;
    });

    return { ok: true, value: stamp };
  } catch (e) {
    await logError('createStamp', e, { date: data.date });
    return { ok: false, error: 'DB_ERROR' };
  }
}
```

핵심:
- 모든 작업 try/catch
- `Result<T>` 반환 (throw 안 함)
- 트랜잭션 사용
- 에러는 `logError`로 기록

---

## 마이그레이션 정책

스키마 변경 시:
1. Dexie 버전 증가 (`this.version(2).stores({...}).upgrade(tx => {...})`)
2. `upgrade` 함수에서 기존 데이터 변환
3. CLAUDE.md `12. 변경 이력`에 기록
4. ADR 작성 (`docs/decisions/`)

새 옵셔널 필드는 마이그레이션 없이 추가 가능 (예: `hideSpecialDaySticker`, `backgroundColor`). 기존 row는 `undefined`라서 default 동작 그대로.

---

## post-MVP 추가 (2026-05-31)

| 필드 | 위치 | 용도 |
|---|---|---|
| `Stamp.hideSpecialDaySticker?` | per-stamp | 등록/상세 페이지 토글. 특별한 날 우표에서 스티커 숨김 |
| `Settings.backgroundColor?` | global | `/settings/background`에서 자유 선택. body + 우표 톱니 fill 적용 |
| `Settings.disabledSpecialDays?` | deprecated | per-day 토글 (제거됨). 데이터 보존만, 코드 미사용 |
