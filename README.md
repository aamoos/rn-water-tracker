# 물 섭취량 추적 앱 (Water Tracker)

React Native와 Expo를 사용하여 개발된 물 섭취량 추적 앱입니다.

## 📱 주요 기능

- **일일 물 섭취량 추적**: 하루 목표량 대비 현재 섭취량을 시각적으로 확인
- **개인화된 목표 설정**: 몸무게를 기반으로 한 일일 권장 섭취량 자동 계산
- **프리셋 기능**: 다양한 컵 사이즈 프리셋과 사용자 정의 컵 등록
- **섭취 기록 관리**: 실시간 기록 추가/삭제 및 시간별 로그 확인
- **통계 및 분석**: 일별/주별/월별 섭취량 통계와 차트
- **알림 기능**: 설정 가능한 물 섭취 알림
- **목표 달성 보상**: 목표 달성 시 축하 메시지 및 광고 연동

## 🏗️ 기술 스택

- **React Native**: 크로스 플랫폼 모바일 앱 개발
- **Expo**: 개발 플랫폼 및 도구
- **TypeScript**: 정적 타입 시스템
- **Zustand**: 상태 관리
- **Expo Router**: 파일 기반 네비게이션
- **React Native Chart Kit**: 차트 및 그래프
- **React Native Calendars**: 캘린더 UI
- **Google Mobile Ads**: 광고 통합

## 📂 프로젝트 구조

```
app/
├── (tabs)/
│   ├── index.tsx      # 메인 화면 (물 섭취 추가)
│   ├── stats.tsx      # 통계 화면
│   └── settings.tsx   # 설정 화면
└── _layout.tsx        # 전체 레이아웃

src/
├── components/        # 재사용 가능한 컴포넌트
├── data/             # 정적 데이터 (프리셋 등)
├── lib/              # 유틸리티 함수들
├── store/            # Zustand 스토어
└── types/            # TypeScript 타입 정의
```

## 🚀 시작하기

### 필수 요구사항

- Node.js (버전 16 이상)
- npm 또는 yarn
- Expo CLI

### 설치

```bash
# 의존성 설치
npm install

# 개발 서버 시작
npm start

# Android에서 실행
npm run android

# iOS에서 실행 (macOS 필요)
npm run ios
```

## 📋 주요 파일 설명

- `src/store/profile.tsx`: 사용자 프로필, 섭취 기록, 설정 상태 관리
- `src/data/water.ts`: 물 섭취용 프리셋 데이터
- `src/lib/notifications.ts`: 푸시 알림 기능
- `src/lib/admob.ts`: Google AdMob 광고 관리
- `src/lib/calc.ts`: 일일 권장 섭취량 계산 로직

## 📊 화면 구성

1. **메인 화면**: 오늘의 섭취량, 프리셋 선택, 기록 목록
2. **통계 화면**: 일별/주별/월별 차트 및 캘린더 뷰
3. **설정 화면**: 프로필 설정, 알림 설정, 목표량 조정

## 🎯 목표 설정

앱은 사용자의 몸무게를 기반으로 일일 권장 물 섭취량을 자동 계산합니다:
- 기본 공식: 몸무게(kg) × 35ml = 일일 권장량

## 🔔 알림 기능

- 특정 시간대 알림
- 일정 간격 반복 알림
- 알림 온/오프 설정

## 📈 배포

```bash
# 웹 배포
npm run deploy

# 앱 스토어 배포 (EAS Build)
npx eas build
```

## 📄 라이센스

이 프로젝트는 개인 프로젝트입니다.