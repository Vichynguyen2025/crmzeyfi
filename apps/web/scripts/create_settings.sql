CREATE TABLE IF NOT EXISTS site_settings (
  `key` VARCHAR(100) PRIMARY KEY,
  `value` TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
INSERT IGNORE INTO site_settings (`key`, `value`) VALUES 
('site_name', 'Zeyfi CRM'),
('favicon', ''),
('font_scale', 'medium'),
('primary_color', '#4f46e5'),
('border_radius', 'medium');
SELECT * FROM site_settings;