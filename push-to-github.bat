@echo off
setlocal
set PATH=C:\Users\kavee\.gemini\antigravity\bin\git\cmd;C:\Users\kavee\.gemini\antigravity\bin\git\mingw64\bin;%PATH%

echo =========================================================
echo Pushing Philosophy Day 2026 to GitHub (admin-dev branch)
echo Remote: https://github.com/kaveeshajagoda2023-alt/Philosophy-Day-2026.git
echo =========================================================
echo.

git checkout admin-dev
git push -u origin admin-dev

echo.
if %ERRORLEVEL% equ 0 (
    echo =========================================================
    echo Successfully pushed to branch admin-dev!
    echo =========================================================
) else (
    echo =========================================================
    echo Push failed. If prompted, please authenticate with GitHub.
    echo Or generate a GitHub Personal Access Token (classic) at:
    echo https://github.com/settings/tokens
    echo =========================================================
)

pause
