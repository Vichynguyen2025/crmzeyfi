import subprocess
import os

host = "root@202.92.6.105"
port = "24700"
key = "/opt/data/.ssh/inet_rsa.pem"

ssh = f"ssh -i {key} -p {port} -o StrictHostKeyChecking=no -o ConnectTimeout=15 {host}"

sql = """mysql -u root -p8ffcb61af33a11f0 crmzeyfi -e "
CREATE TABLE IF NOT EXISTS site_settings (
  \`key\` VARCHAR(100) PRIMARY KEY,
  \`value\` TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
INSERT IGNORE INTO site_settings (key, value) VALUES 
('site_name', 'Zeyfi CRM'),
('favicon', ''),
('font_scale', 'medium'),
('primary_color', '#4f46e5'),
('border_radius', 'medium');
SELECT * FROM site_settings;
\""""

r = subprocess.run(ssh + " " + sql, shell=True, capture_output=True, text=True, timeout=10)
print(r.stdout)
print(r.stderr[:200] if r.stderr else "OK")