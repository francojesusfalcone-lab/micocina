@echo off
cd /d "C:\Users\franc\OneDrive\Escritorio\micocina"
echo Checking for errors...
call npm run build
if %errorlevel% neq 0 (
  echo BUILD FAILED - fix errors before deploying
  pause
  exit /b 1
)
git add -A
git commit -m "fix onboarding and settings"
git push
echo DONE
