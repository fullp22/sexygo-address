# 어디GO 납품 안내

이 패키지는 소스코드 납품용입니다.

## 포함
- Next.js 애플리케이션 소스
- Prisma 스키마 및 시드
- 관리자/광고/카테고리/사이트 관리 기능
- 환경변수 예시 파일

## 포함하지 않음
- 실제 운영 비밀번호와 세션 시크릿
- 로컬 SQLite 데이터베이스
- 개발 PC의 업로드 파일
- node_modules / .next / .git / 백업 폴더
- 개발 중 사용한 패치 스크립트

## 운영 배포 시 수령 측 준비 항목
- 운영 DB(PostgreSQL 등)와 DATABASE_URL
- 이미지/영상 영구 저장소(S3/R2/Supabase Storage 등)
- 운영 도메인 및 호스팅 계정
- ADMIN_PASSWORD / ADMIN_SESSION_SECRET
- 필요 시 로컬 SQLite 데이터를 운영 DB로 마이그레이션

현재 로컬 개발 환경은 SQLite와 로컬 업로드를 사용합니다.
서버리스/다중 인스턴스 운영 환경에서는 DB와 파일 저장소를 운영용 서비스로 교체해야 합니다.
