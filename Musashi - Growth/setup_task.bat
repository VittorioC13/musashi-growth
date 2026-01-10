@echo off
echo ========================================
echo Windows Task Scheduler Setup
echo ========================================
echo.
echo This will set up automatic daily PDF generation at 17:00
echo.
echo NOTE: You need to run this as Administrator!
echo.
pause

powershell -ExecutionPolicy Bypass -File "%~dp0setup_task_scheduler.ps1"

pause


