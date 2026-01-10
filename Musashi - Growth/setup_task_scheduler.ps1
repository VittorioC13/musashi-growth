# Windows Task Scheduler Setup Script
# Run this as Administrator: Right-click -> Run with PowerShell (as Administrator)

$taskName = "DailyWisdomGenerator"
$scriptPath = "C:\Users\rotciv\Desktop\Musashi\run_daily_generation.py"
$workingDir = "C:\Users\rotciv\Desktop\Musashi"
$pythonPath = (Get-Command python).Source

Write-Host "Setting up Windows Task Scheduler..." -ForegroundColor Green
Write-Host "Task Name: $taskName" -ForegroundColor Cyan
Write-Host "Script: $scriptPath" -ForegroundColor Cyan
Write-Host "Python: $pythonPath" -ForegroundColor Cyan
Write-Host ""

# Check if task already exists
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existingTask) {
    Write-Host "Task already exists. Removing old task..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

# Create the action
$action = New-ScheduledTaskAction `
    -Execute $pythonPath `
    -Argument "`"$scriptPath`"" `
    -WorkingDirectory $workingDir

# Create the trigger (daily at 17:00)
$trigger = New-ScheduledTaskTrigger -Daily -At "17:00"

# Create settings
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable:$false

# Register the task
try {
    Register-ScheduledTask `
        -TaskName $taskName `
        -Action $action `
        -Trigger $trigger `
        -Settings $settings `
        -Description "Generates daily trading wisdom PDF at 17:00" `
        -User $env:USERNAME `
        -RunLevel Limited
    
    Write-Host ""
    Write-Host "✓ Task scheduled successfully!" -ForegroundColor Green
    Write-Host ""
    
    # Show task info
    $taskInfo = Get-ScheduledTaskInfo -TaskName $taskName
    Write-Host "Task Status: $($taskInfo.LastTaskResult)" -ForegroundColor Cyan
    Write-Host "Next Run Time: $($taskInfo.NextRunTime)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "The script will run automatically every day at 17:00" -ForegroundColor Green
    Write-Host "PDFs will be saved in: $workingDir\Growth" -ForegroundColor Green
    
} catch {
    Write-Host ""
    Write-Host "✗ Error creating task: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure you're running PowerShell as Administrator!" -ForegroundColor Yellow
}


