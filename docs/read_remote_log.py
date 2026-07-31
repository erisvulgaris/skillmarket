import subprocess

cmd = 'ssh -o StrictHostKeyChecking=no root@152.53.111.217 "tail -n 50 /etc/dokploy/logs/app-index-primary-port-q3l9v5/*.log | tail -n 60"'
res = subprocess.run(cmd, shell=True, capture_output=True, text=True)
print("STDOUT:", res.stdout)
print("STDERR:", res.stderr)
