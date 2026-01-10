# Windows Task Scheduler Setup Instructions

To run the script automatically every day at 17:00 without keeping a terminal open:

## Method 1: Using Windows Task Scheduler GUI

1. Press `Win + R`, type `taskschd.msc` and press Enter
2. Click "Create Basic Task" on the right
3. Name it: "Daily Wisdom Generator"
4. Trigger: Daily, set time to 17:00
5. Action: Start a program
6. Program/script: Browse to `run_daily.bat` in this folder
   - Or use: `python` with arguments: `run_daily_generation.py`
   - Start in: `C:\Users\rotciv\Desktop\Musashi`
7. Check "Open the Properties dialog..." and click Finish
8. In Properties:
   - Check "Run whether user is logged on or not"
   - Check "Run with highest privileges"
   - In "Conditions" tab, uncheck "Start the task only if the computer is on AC power"

## Method 2: Using Command Line (PowerShell as Admin)

Run this command in PowerShell (as Administrator):

```powershell
$action = New-ScheduledTaskAction -Execute "python" -Argument "C:\Users\rotciv\Desktop\Musashi\run_daily_generation.py" -WorkingDirectory "C:\Users\rotciv\Desktop\Musashi"
$trigger = New-ScheduledTaskTrigger -Daily -At "17:00"
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
Register-ScheduledTask -TaskName "DailyWisdomGenerator" -Action $action -Trigger $trigger -Settings $settings -Description "Generates daily trading wisdom PDF at 17:00"
```

## Current Setup

Right now, the script is configured to:
- Run a test immediately when you execute `deepseek_python_20251230_c38628.py`
- Then keep running and generate PDFs daily at 17:00 (but requires terminal to stay open)

For true automation, use the Task Scheduler method above with `run_daily_generation.py`.


