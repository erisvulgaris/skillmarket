import subprocess

cmd = '''ssh -o StrictHostKeyChecking=no root@152.53.111.217 "sqlite3 /data/skillmarket.db \\"UPDATE Category SET enabled = 0 WHERE slug = 'telegram-services';\\""'''
print("Executing remote sqlite3 update...")
res = subprocess.run(cmd, shell=True, capture_output=True, text=True)
print("STDOUT:", res.stdout)
print("STDERR:", res.stderr)
