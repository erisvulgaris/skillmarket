import subprocess

sql_commands = """
UPDATE Service SET images = '["/images/services/software_01.webp"]' WHERE slug LIKE '%software%' OR title LIKE '%SaaSify%';
UPDATE Service SET images = '["/images/services/software_02.webp"]' WHERE title LIKE '%Scraping%' OR title LIKE '%Python%';
UPDATE Service SET images = '["/images/services/software_03.webp"]' WHERE title LIKE '%Telegram Bot%';
UPDATE Service SET images = '["/images/services/ai_01.webp"]' WHERE title LIKE '%Midjourney%';
UPDATE Service SET images = '["/images/services/ai_02.webp"]' WHERE title LIKE '%ChatGPT%';
UPDATE Service SET images = '["/images/services/ai_03.webp"]' WHERE title LIKE '%Claude%';
UPDATE Service SET images = '["/images/services/ui_01.webp"]' WHERE title LIKE '%Fintech%';
UPDATE Service SET images = '["/images/services/ui_02.webp"]' WHERE title LIKE '%Obsidian%';
UPDATE Service SET images = '["/images/services/ebook_01.webp"]' WHERE title LIKE '%System Design%';
UPDATE Service SET images = '["/images/services/ebook_02.webp"]' WHERE title LIKE '%Micro-SaaS%';
UPDATE Service SET images = '["/images/services/video_01.webp"]' WHERE title LIKE '%Advanced Next.js%';
UPDATE Service SET images = '["/images/services/video_02.webp"]' WHERE title LIKE '%Rust%';
UPDATE Service SET images = '["/images/services/template_01.webp"]' WHERE title LIKE '%Portfolio%';
UPDATE Service SET images = '["/images/services/template_02.webp"]' WHERE title LIKE '%Storefront%';
UPDATE Service SET images = '["/images/services/audio_01.webp"]' WHERE title LIKE '%Lofi%';
UPDATE Service SET images = '["/images/services/audio_02.webp"]' WHERE title LIKE '%SFX Library%';
UPDATE Service SET images = '["/images/services/membership_01.webp"]' WHERE title LIKE '%Senior Fullstack%';
UPDATE Service SET images = '["/images/services/membership_02.webp"]' WHERE title LIKE '%VIP High-Ticket%';
UPDATE Service SET images = '["/images/services/data_01.webp"]' WHERE title LIKE '%Global B2B%';
UPDATE Service SET images = '["/images/services/data_02.webp"]' WHERE title LIKE '%Cryptocurrency Historical%';
"""

cmd = f'ssh -o StrictHostKeyChecking=no root@152.53.111.217 "sqlite3 /data/skillmarket.db \\"{sql_commands}\\""'

print("Executing SQL image path updates on remote database...")
res = subprocess.run(cmd, shell=True, capture_output=True, text=True)
print("STDOUT:", res.stdout)
print("STDERR:", res.stderr)
