# Daily Content Generator

Automated Python script that generates viral social media content daily using the DeepSeek AI API. Creates 10 thought-provoking posts optimized for platforms like Threads, saves them as PDF and text files.

## Features

- **A/B Format Variation System**: 5 core financial ideas × 2 different formats = 10 posts with strategic variety
- **Algorithm-Resistant**: Format diversity prevents platform suppression and audience fatigue
- **AI-Powered Generation**: Uses DeepSeek Chat API for unique daily content
- **Automated Scheduling**: Windows Task Scheduler integration for hands-free daily execution
- **Multiple Output Formats**: Saves as both PDF (formatted) and TXT (backup)
- **Backup Content**: Fallback content if API fails
- **Character Limits**: Smart word count management for different post types

## Content Strategy: A/B Format Variations

**The Problem:** Repetitive formatting gets suppressed by algorithms and bores audiences over time.

**The Solution:** Express the same winning financial ideas in multiple formats for variety.

### 5 Core Financial Ideas (Each expressed 2 different ways)

**1. Debt-Free Living = Real Wealth**
- Format A: List ("The real flex?" - 221K views proven)
- Format B: Observation ("One pattern I've noticed...")

**2. Diversification Beats Concentration**
- Format A: Bold statement ("Don't put all your money in...")
- Format B: Story/Satire (Two investors comparison)

**3. Time > Money (Buy Back Your Time)**
- Format A: List ("When you make good money, do this...")
- Format B: Provocative question about time value

**4. Delayed Gratification Builds Wealth**
- Format A: Conditional advice ("If you have less than $X saved...")
- Format B: 2x2 Matrix framework

**5. Your Circle Determines Net Worth**
- Format A: "Normalize" format (240K views proven)
- Format B: Math comparison with specific numbers

### Why This Works

- **Algorithm Protection**: Platforms reward content diversity, not repetition
- **Audience Segmentation**: Different people prefer different formats (visual vs narrative vs questions)
- **Natural A/B Testing**: Identify which formats work best for specific ideas
- **Content Longevity**: Same idea can be reposted in new formats without feeling stale
- **Engagement Variety**: Lists get saves, questions get comments, stories get shares

## Installation

### Prerequisites

- Python 3.7+
- DeepSeek API key (get one at [https://platform.deepseek.com](https://platform.deepseek.com))

### Setup

1. Clone this repository:
```bash
git clone https://github.com/yourusername/daily-content-generator.git
cd daily-content-generator
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create a `.env` file in the root directory:
```env
DEEPSEEK_API_KEY=your_api_key_here
```

4. Test the script:
```bash
python run_daily_generation.py
```

## Usage

### Manual Run

Generate content immediately:
```bash
python run_daily_generation.py
```

### Automated Daily Generation (Windows)

The script is designed to run automatically via Windows Task Scheduler at 17:00 daily.

#### Method 1: GUI Setup

1. Press `Win + R`, type `taskschd.msc`, press Enter
2. Click "Create Basic Task"
3. Name: "Daily Content Generator"
4. Trigger: Daily at 17:00
5. Action: Start a program
6. Program: `python`
7. Arguments: `run_daily_generation.py`
8. Start in: `C:\path\to\daily-content-generator`
9. In Properties, check "Run whether user is logged on or not"

#### Method 2: PowerShell (Admin)

Run the included PowerShell script:
```powershell
.\setup_task_scheduler.ps1
```

Or manually:
```powershell
$action = New-ScheduledTaskAction -Execute "python" -Argument "run_daily_generation.py" -WorkingDirectory "C:\path\to\daily-content-generator"
$trigger = New-ScheduledTaskTrigger -Daily -At "17:00"
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
Register-ScheduledTask -TaskName "DailyContentGenerator" -Action $action -Trigger $trigger -Settings $settings
```

## Output

Generated files are saved in the `Growth/` folder:

- `Daily_Wisdom_YYYYMMDD.pdf` - Formatted PDF with all 10 posts (one per page)
- `Daily_Wisdom_YYYYMMDD.txt` - Plain text backup

### Example Output

```
1. High effort + low ego = growth. High effort + high ego = burnout.

2. Social media killed genuine conversation.

3. what are you unlearning right now?
```

## Configuration

### Change Generation Time

Edit the time in `deepseek_python_20251230_c38628.py`:
```python
generator.setup_scheduler("17:00")  # Change to your preferred time
```

### Customize Prompts

Modify the `self.prompts` list in the `ContentGenerator` class to change content templates.

### API Settings

Adjust temperature and max_tokens in `call_deepseek_api()` method:
```python
"temperature": 1.0,  # Creativity (0.0-2.0)
"max_tokens": 100,   # Response length
```

## Project Structure

```
daily-content-generator/
├── deepseek_python_20251230_c38628.py  # Main content generator class
├── run_daily_generation.py              # Task scheduler entry point
├── requirements.txt                     # Python dependencies
├── .env                                 # API keys (not tracked in git)
├── .gitignore                          # Git ignore rules
├── run_daily.bat                       # Windows batch file
├── setup_task_scheduler.ps1            # PowerShell setup script
├── SETUP_WINDOWS_TASK.md               # Detailed setup instructions
└── Growth/                             # Output folder
    ├── Daily_Wisdom_YYYYMMDD.pdf
    └── Daily_Wisdom_YYYYMMDD.txt
```

## Dependencies

- `requests` - HTTP client for API calls
- `schedule` - Task scheduling library
- `reportlab` - PDF generation
- `python-dotenv` - Environment variable management

## Security

- API keys are stored in `.env` (not committed to git)
- `.gitignore` prevents accidental key exposure
- Never commit your `.env` file to version control

## Troubleshooting

### API Error 401
- Check your API key in `.env`
- Verify key has sufficient credits at DeepSeek platform

### Script Not Running
- Verify Python is in system PATH
- Check Task Scheduler logs: Task Scheduler → Task History
- Run manually first to test

### No Output Files
- Check `Growth/` folder exists
- Verify write permissions
- Check console output for errors

## License

MIT License - feel free to use and modify

## Contributing

Pull requests welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Test your changes
4. Submit a pull request

## Credits

Built with DeepSeek AI API
Optimized for viral social media content
