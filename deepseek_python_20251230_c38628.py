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
        
        # 设置提示模板 - Optimized for viral Threads content
        self.prompts = [
            # Matrix/Framework style (highest performer)
            "Create a 2x2 matrix like this format: 'High X + high Y = [result]. High X + low Y = [result]. Low X + high Y = [result]. Low X + low Y = [result].' Use provocative variables (IQ, discipline, ambition, ego, etc). Keep it edgy and thought-provoking.",

            # Bold controversial statements
            "Write a single bold, controversial statement about modern life, technology, or society. Make it provocative but defensible. Under 10 words. Examples: 'AI killed critical thinking.' or 'Social media rewarded fake confidence.'",

            # Paradox/contradiction format
            "Create a paradox or contradiction using this format: '[Safe/Good/Best] [thing] I've experienced: [X]. [Dangerous/Bad/Worst] [thing] I've experienced: [X].' Make it clever and surprising.",

            # Deep personal question
            "Ask a direct, personal question that makes people reflect and want to share. Format: 'what is [topic] teaching you rn?' or 'money aside, what do you need right now?' Keep it real and vulnerable.",

            # Provocative question with undertone
            "Ask a provocative question that has political, cultural, or controversial undertones. Something that will make people debate. Format: 'name something [controversial topic] gave to the world' or similar.",

            # "How do you deal with" format
            "Ask 'How do you deal with [challenging person/situation]?' Pick something relatable and difficult (someone smarter, richer, more attractive, toxic family, etc).",

            # Bold observation about human behavior
            "Make a bold observation about human psychology, relationships, or modern behavior. Controversial but true. Under 15 words. Make people say 'damn, that's real.'",

            # Trend observation question
            "Point out a trend you've noticed and ask why. Format: 'people started [doing X] or are simply opting out of [Y]. Is there a reason?' Make it current and relatable.",

            # Life reflection question
            "Ask what phase of life/growth someone is in right now. Make it philosophical but simple. Examples about learning, unlearning, healing, building, etc.",

            # Harsh truth framework
            "Share a harsh truth using comparison. Format: 'High [X] people [do Y]. Low [X] people [do Z].' or 'Rich people [X]. Poor people think [Y].' Controversial but insightful."
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

            # System prompt with viral examples for few-shot learning
            system_prompt = """You are a viral Threads content creator. Your posts get thousands of views and hundreds of comments.

Style guide:
- Be provocative and edgy, not safe or generic
- Keep it SHORT (under 20 words unless it's a matrix format)
- Make people think, debate, or share personal experiences
- Use bold statements that are controversial but defensible
- Ask questions that demand personal reflection
- Create frameworks that make people self-categorize

Examples of viral posts:
1. "High IQ + high testosterone = kings. High IQ + low testosterone = overthinkers. Low IQ + high testosterone = soldiers. Low IQ + low testosterone = victims." (19.3k views)
2. "AI killed critical thinking." (2.9k views, 177 comments)
3. "Safe cities I've lived in: New York. Dangerous cities I've lived in: New York" (1.2k views)
4. "money aside, what do you need right now?" (73 comments)
5. "what is life teaching you rn?" (70 comments)

Write like this - raw, real, slightly controversial."""

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
                "max_tokens": 100,
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
                # If it's a matrix format (contains multiple lines or "="), allow up to 60 words
                if '=' in content or '\n' in content:
                    max_words = 60
                else:
                    max_words = 25

                if word_count > max_words:
                    words = content.split()[:max_words]
                    content = ' '.join(words) + "..."
                
                post_item = {
                    'number': i,
                    'content': content,
                    'timestamp': datetime.now().strftime("%H:%M")
                }
                posts.append(post_item)
                print(f"  [OK] {content[:50]}...")
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
                print(f"  [BACKUP] 使用备用内容: {backup_content[:50]}...")
            
            time.sleep(1)  # 避免API速率限制
        
        print(f"\n[OK] 成功生成 {len(posts)} 条内容")
        return posts
    
    def get_backup_content(self, index):
        """获取备用内容（当API失败时使用）"""
        backup_contents = [
            "High effort + low ego = growth. High effort + high ego = burnout. Low effort + low ego = content. Low effort + high ego = delusional.",
            "Social media killed genuine conversation.",
            "Best advice I've received: be patient. Worst advice I've received: be patient.",
            "what are you unlearning right now?",
            "name something your generation did better than the previous one.",
            "How do you deal with someone less ambitious than you?",
            "People who talk about discipline lack it. People who have it don't mention it.",
            "people started romanticizing loneliness or are simply avoiding connection. Is there a reason?",
            "what is success teaching you rn?",
            "Rich people buy time. Poor people think time is free."
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