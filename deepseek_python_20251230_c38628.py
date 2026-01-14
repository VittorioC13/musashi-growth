# auto_content_generator.py
import os
import schedule
import time
import json
from datetime import datetime
from pathlib import Path
import requests
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.lib import colors
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class ContentGenerator:
    def __init__(self, api_key=None):
        """初始化内容生成器"""
        # 设置DeepSeek API密钥
        self.api_key = api_key or os.getenv("DEEPSEEK_API_KEY")
        if not self.api_key:
            raise ValueError("请设置DEEPSEEK_API_KEY环境变量或传入api_key参数")
        
        # 创建Growth文件夹
        self.growth_folder = Path("Growth")
        self.growth_folder.mkdir(exist_ok=True)
        
        # 设置提示模板 - A/B FORMAT VARIATION SYSTEM
        # Strategy: 5 core financial ideas × 2 different formats = 10 posts with variety
        # This prevents algorithm suppression and audience fatigue while maintaining proven concepts

        self.prompts = [
            # IDEA 1: Debt-free living is real wealth
            # Format A: List (proven 221K views)
            "Create a list post starting with 'The real flex?' followed by 4-5 bullet points about financial freedom markers. Use format: '- No car payment' '- No credit card debt' '- A fat emergency fund' '- Investing every month' '- Sleeping peacefully at night'. Focus on debt-free living and smart money habits.",

            # Format B: Observation (new variation)
            "Create an observation post using this structure: 'One pattern I've noticed in [wealthy/financially free/millionaire] people: They're obsessive about [eliminating debt/living below their means/financial clarity].' Then add 2-3 specific examples of what this looks like in practice. Keep it under 60 words. Focus on debt-free living as a wealth marker.",

            # IDEA 2: Diversification beats concentration risk
            # Format A: Bold statement (proven 36K views)
            "Share a controversial financial truth using comparison. Format: 'Don't put all your money in [Bitcoin]. Don't put all your money in [Stocks]. Don't put all your money in [Real Estate]. Instead, [invest in a little bit of everything so you have a diversified portfolio]!' Make it educational but provocative about diversification.",

            # Format B: Story/Satire (new variation)
            "Tell a short satirical story about someone who went all-in on one investment and lost vs. someone who diversified and won. Format: 'Met two investors. Guy A: [went all-in on crypto]. Made $[X], lost it all. Guy B: [spread across 7 assets]. Still building wealth in 2026.' Use specific numbers. End with a lesson about diversification risk.",

            # IDEA 3: Time is more valuable than money (buy back your time)
            # Format A: List - "When you make good money" (proven 1.1M views)
            "Create advice for people making good money. Start with 'When you start making good money, do this:' then list 5-7 smart money moves. Examples: 'Buy fewer clothes, but wear the highest quality' 'Hire a helper for household chores. Buy back your time' 'Upgrade your financial adviser' 'Surround yourself with high-value people'. End with 'Small shifts. Big impact.'",

            # Format B: Question (new variation)
            "Ask a provocative question about time vs. money. Examples: 'Why do we spend 2 hours hunting for deals to save $20 but refuse to pay $100 to save 5 hours?' or 'How much is your time worth per hour? Are you living like it?' Make it personal and reflective about buying back time with money.",

            # IDEA 4: Delayed gratification builds long-term wealth
            # Format A: Conditional advice (proven 50K views)
            "Create conditional advice based on savings level. Format: 'If you have less than $[10k/20k/50k] saved:' followed by 4-5 bullet points of practical money-saving tips. Examples: '• Skip the bars' '• Cook at home' '• Cut subscriptions' '• Save aggressively'. End with a bold statement like 'No shame in this.' or '$300 on bottles isn't a flex. But saving $400/week to invest is.'",

            # Format B: Matrix (new variation)
            "Create a 2x2 financial matrix using this format: 'High [income/earnings] + high [delayed gratification/saving rate] = [wealth builders]. High income + low saving rate = [broke earners]. Low income + high saving rate = [slow and steady]. Low income + low saving rate = [perpetually broke].' Use delayed gratification as a key variable. Keep it provocative.",

            # IDEA 5: Your circle determines your net worth (peer influence)
            # Format A: "Normalize" format (proven 240K views)
            "Use the 'Normalize' format to promote healthy money habits. Structure: 'Normalize having friends who talk about [investments/side hustles/building generational wealth] instead of just [gossip/drama/consumption].' Then add a call to action like 'Upgrade your circle.' Focus on aspirational peer groups and money conversations.",

            # Format B: Comparison with math (new variation)
            "Create a comparison showing the financial impact of peer groups using numbers. Format: 'If your 5 closest friends [average $50K income and spend it all], you'll likely [earn $50K and stay broke]. If your 5 closest friends [average $150K income and invest 30%], you'll likely [level up to 6 figures and build wealth].' Show the math. End with 'You become the average of your circle.'"
        ]
        
        # 设置PDF样式
        self.setup_styles()
    
    def setup_styles(self):
        """设置PDF样式"""
        self.styles = getSampleStyleSheet()
        
        # 创建标题样式
        self.styles.add(ParagraphStyle(
            name='Header',
            parent=self.styles['Normal'],
            fontSize=14,
            textColor=colors.black,
            spaceAfter=20,
            alignment=TA_LEFT
        ))
        
        # 创建内容样式
        self.styles.add(ParagraphStyle(
            name='Content',
            parent=self.styles['Normal'],
            fontSize=12,
            textColor=colors.darkblue,
            spaceAfter=15,
            alignment=TA_LEFT
        ))
        
        # 创建时间样式
        self.styles.add(ParagraphStyle(
            name='TimeStamp',
            parent=self.styles['Normal'],
            fontSize=10,
            textColor=colors.gray,
            spaceAfter=30,
            alignment=TA_LEFT
        ))
    
    def call_deepseek_api(self, prompt):
        """调用DeepSeek API生成内容"""
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }

            # System prompt with viral investment examples for few-shot learning
            system_prompt = """You are a viral finance/investing content creator on Threads. Your posts get 50K-1M+ views. You build trust by teaching smart money habits, not hype.

Style guide:
- Focus on FINANCE, INVESTING, MONEY HABITS, and WEALTH BUILDING only
- Use specific dollar amounts ($10k, $50k, $400/week, $1M)
- Create list formats with bullet points (they perform best)
- Be educational but provocative - challenge bad money habits
- Keep posts SHORT and scannable (lists work better than paragraphs)
- Make it aspirational but achievable - real financial freedom
- Use math/numbers to prove points (returns, comparisons, calculations)

PROVEN VIRAL FORMATS:
1. LIST: "The real flex? - No car payment - No credit card debt - A fat emergency fund - Investing every month - Sleeping peacefully at night" (221K views, 10.1K likes)

2. LIST: "Life becomes easy when you have: - No car note - No student loans - No credit card debt - 1 year of expenses saved - Automated monthly investments. Make it a priority this year." (44K-65K views, 3-4K likes)

3. LIST: "When you start making good money, do this: 1. Buy fewer clothes, but wear the highest quality. 2. Eat premium food, not junk. 3. Hire a helper for household chores. Buy back your time. 4. Upgrade your mattress. Sleep changes everything. 5. Invest in experiences, not just stuff. 6. Upgrade your financial adviser. The one who got you here won't get you to the next level. 7. Surround yourself with high-value people. Small shifts. Big impact." (1.1M views!)

4. COMPARISON: "If you invest $50,000 in stocks and it grows 4% in a year, you've made $2,000. If you use that same $50,000 as a 10% down payment on a $500,000 home and it appreciates 4%, the house is now worth $520,000. That's a $20,000 gain—10x more than the stock investment. That's the power of leverage!" (347K views, 548 comments)

5. SATIRE: "Met a guy today. Age: 22. Portfolio: $1 Million. Started investing post covid. Investment: 50% Stocks, 40% cryptos, 10% gold. Goal: To retire at 30. I asked him how he managed to build a million-dollar portfolio at such a young age. He said that after COVID, he worked hard and convinced his dad to give him $2 million." (310K views, 20.5K likes)

6. NORMALIZE: "Normalize having friends who talk about investments, side hustles, and building generational wealth instead of just gossip. Upgrade your circle." (240K views, 10.8K likes)

7. CONDITIONAL: "If you have less than $10k saved: • Skip the bars • Cook at home • Cut subscriptions • Save aggressively. No shame in this. $300 on bottles isn't a flex. But saving $400/week to invest is." (50.9K views, 927 likes)

8. DIVERSIFICATION: "Don't put all your money in Bitcoin. Don't put all your money in Stocks. Don't put all your money in Real Estate. Instead, invest in a little bit of everything so you have a diversified portfolio!" (36.3K views, 538 likes)

Write like this - specific, educational, aspirational, with real numbers."""

            data = {
                "model": "deepseek-chat",
                "messages": [
                    {
                        "role": "system",
                        "content": system_prompt
                    },
                    {
                        "role": "user",
                        "content": f"{prompt}\n\nRespond with ONLY the post content. No explanations, no quotes, no meta-commentary. Just the raw post text."
                    }
                ],
                "temperature": 1.0,
                "max_tokens": 400,
                "stream": False
            }
            
            response = requests.post(
                "https://api.deepseek.com/v1/chat/completions",
                headers=headers,
                json=data,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                content = result['choices'][0]['message']['content'].strip()
                # 清理内容：去除引号、多余空格
                content = content.replace('"', '').replace("'", '').strip()
                return content
            else:
                print(f"API错误: {response.status_code}")
                return None
                
        except Exception as e:
            print(f"API调用异常: {e}")
            return None
    
    def generate_daily_posts(self):
        """生成10条每日内容"""
        print(f"\n{'='*60}")
        print(f"开始生成内容 - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"{'='*60}")
        
        posts = []
        
        for i, prompt in enumerate(self.prompts, 1):
            print(f"生成第 {i}/10 条内容...")
            
            content = self.call_deepseek_api(prompt)
            
            if content:
                # Allow longer content for matrix/framework formats, but cap others
                word_count = len(content.split())
                # If it's a matrix format (contains multiple lines or "="), allow up to 200 words
                if '=' in content or '\n' in content:
                    max_words = 200
                else:
                    max_words = 150

                if word_count > max_words:
                    words = content.split()[:max_words]
                    content = ' '.join(words) + "..."

                post_item = {
                    'number': i,
                    'content': content,
                    'timestamp': datetime.now().strftime("%H:%M")
                }
                posts.append(post_item)
                # Safe print with encoding handling
                try:
                    print(f"  [OK] {content[:50]}...")
                except UnicodeEncodeError:
                    print(f"  [OK] Content generated successfully (Post #{i})")
            else:
                # 如果API失败，使用备用内容
                backup_content = self.get_backup_content(i)
                post_item = {
                    'number': i,
                    'content': backup_content,
                    'timestamp': datetime.now().strftime("%H:%M"),
                    'backup': True
                }
                posts.append(post_item)
                # Safe print with encoding handling
                try:
                    print(f"  [BACKUP] 使用备用内容: {backup_content[:50]}...")
                except UnicodeEncodeError:
                    print(f"  [BACKUP] Using backup content (Post #{i})")
            
            time.sleep(1)  # 避免API速率限制
        
        print(f"\n[OK] 成功生成 {len(posts)} 条内容")
        return posts
    
    def get_backup_content(self, index):
        """获取备用内容（当API失败时使用）- A/B Format Variations"""
        backup_contents = [
            # IDEA 1A: Debt-free (List)
            "The real flex?\n\n- No car payment\n- No credit card debt\n- A fat emergency fund\n- Investing every month\n- Sleeping peacefully at night",

            # IDEA 1B: Debt-free (Observation)
            "One pattern I've noticed in wealthy people: They're obsessive about eliminating debt.\n\nThey drive paid-off cars.\nThey avoid credit card balances.\nThey sleep peacefully.",

            # IDEA 2A: Diversification (Bold statement)
            "Don't put all your money in Bitcoin.\nDon't put all your money in Stocks.\nDon't put all your money in Real Estate.\n\nInstead, invest in a little bit of everything so you have a diversified portfolio!",

            # IDEA 2B: Diversification (Story)
            "Met two investors.\n\nGuy A: All-in on crypto. Made $200K in 2021. Lost it all by 2023.\n\nGuy B: Spread across 7 assets. Still building wealth in 2026.\n\nDiversification isn't boring. It's survival.",

            # IDEA 3A: Time > Money (List)
            "When you start making good money, do this:\n\n1. Buy fewer clothes, but wear the highest quality\n2. Hire help for household chores - buy back your time\n3. Upgrade your financial adviser\n4. Surround yourself with high-value people\n\nSmall shifts. Big impact.",

            # IDEA 3B: Time > Money (Question)
            "Why do we spend 2 hours hunting for deals to save $20 but refuse to pay $100 to save 5 hours?\n\nHow much is your time actually worth?",

            # IDEA 4A: Delayed gratification (Conditional)
            "If you have less than $10k saved:\n\n• Skip the bars\n• Cook at home\n• Cut subscriptions\n• Save aggressively\n\nNo shame in this.\n\n$300 on bottles isn't a flex.\nBut saving $400/week to invest is.",

            # IDEA 4B: Delayed gratification (Matrix)
            "High income + high saving rate = wealth builders.\nHigh income + low saving rate = broke earners.\nLow income + high saving rate = slow and steady.\nLow income + low saving rate = perpetually broke.",

            # IDEA 5A: Circle influence (Normalize)
            "Normalize having friends who talk about investments, side hustles, and building generational wealth instead of just gossip.\n\nUpgrade your circle.",

            # IDEA 5B: Circle influence (Math comparison)
            "If your 5 closest friends average $50K and spend it all, you'll earn $50K and stay broke.\n\nIf your 5 closest friends average $150K and invest 30%, you'll level up to 6 figures.\n\nYou become the average of your circle."
        ]
        return backup_contents[index % len(backup_contents)]
    
    def create_pdf(self, posts):
        """创建PDF文件"""
        # 生成文件名
        date_str = datetime.now().strftime("%Y%m%d")
        filename = self.growth_folder / f"Daily_Wisdom_{date_str}.pdf"
        
        # 创建PDF文档
        doc = SimpleDocTemplate(str(filename), pagesize=letter)
        story = []
        
        # 添加标题
        title = f"Daily Trading & Life Wisdom - {datetime.now().strftime('%B %d, %Y')}"
        story.append(Paragraph(title, self.styles['Header']))
        story.append(Paragraph(f"Generated at: {datetime.now().strftime('%H:%M:%S')}", self.styles['TimeStamp']))
        
        # 添加内容，每条之间用分页符分隔
        for i, post in enumerate(posts):
            # 添加序号和内容
            content_text = f"<b>{post['number']}.</b> {post['content']}"
            story.append(Paragraph(content_text, self.styles['Content']))
            
            # 如果不是最后一条，添加分页符
            if i < len(posts) - 1:
                story.append(PageBreak())
        
        # 生成PDF
        doc.build(story)
        print(f"[OK] PDF已保存: {filename}")
        return filename
    
    def save_as_text(self, posts):
        """同时保存为文本文件（备用）"""
        date_str = datetime.now().strftime("%Y%m%d")
        filename = self.growth_folder / f"Daily_Wisdom_{date_str}.txt"
        
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(f"Daily Trading & Life Wisdom\n")
            f.write(f"Date: {datetime.now().strftime('%Y-%m-%d')}\n")
            f.write(f"Time: {datetime.now().strftime('%H:%M:%S')}\n")
            f.write("=" * 60 + "\n\n")
            
            for post in posts:
                f.write(f"{post['number']}. {post['content']}\n\n")
        
        print(f"[OK] 文本备份已保存: {filename}")
    
    def run_daily_generation(self):
        """运行每日生成任务"""
        try:
            # 生成内容
            posts = self.generate_daily_posts()
            
            if posts:
                # 创建PDF
                pdf_file = self.create_pdf(posts)
                
                # 保存文本备份
                self.save_as_text(posts)
                
                # 打印摘要
                print(f"\n{'='*60}")
                print("内容生成完成!")
                print(f"PDF文件: {pdf_file}")
                print(f"存储位置: {self.growth_folder.absolute()}")
                print(f"{'='*60}")
                
                return True
            else:
                print("[ERROR] 内容生成失败")
                return False
                
        except Exception as e:
            print(f"[ERROR] 生成过程中出现错误: {e}")
            return False
    
    def setup_scheduler(self, run_time="17:00"):
        """设置定时调度器"""
        print(f"\n[TIMER] 定时任务设置")
        print(f"内容将在每天 {run_time} 自动生成")
        print(f"PDF将保存在: {self.growth_folder.absolute()}")
        print("按 Ctrl+C 停止程序\n")
        
        # 设置定时任务
        schedule.every().day.at(run_time).do(self.run_daily_generation)
        
        # 立即运行一次（测试）
        print("正在进行首次运行测试...")
        self.run_daily_generation()
        
        # 保持程序运行
        while True:
            schedule.run_pending()
            time.sleep(60)

def main():
    """主函数"""
    print("="*60)
    print("自动内容生成系统 v1.0")
    print("="*60)

    # Load API key from environment variable
    api_key = os.getenv("DEEPSEEK_API_KEY")

    if not api_key:
        print("错误: 需要设置DeepSeek API密钥")
        print("请在 .env 文件中设置 DEEPSEEK_API_KEY")
        print("例如: DEEPSEEK_API_KEY=sk-your-key-here")
        return
    
    # 创建生成器实例
    generator = ContentGenerator(api_key)
    
    # 先进行测试运行
    print("\n" + "="*60)
    print("正在进行测试运行...")
    print("="*60)
    generator.run_daily_generation()
    
    # 然后设置定时任务（每天17:00）
    print("\n" + "="*60)
    print("设置定时任务...")
    print("="*60)
    generator.setup_scheduler("17:00")

if __name__ == "__main__":
    main()