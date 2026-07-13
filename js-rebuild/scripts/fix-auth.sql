-- Fix MySQL root authentication for passwordless access
UPDATE mysql.user SET plugin='mysql_native_password' WHERE User='root' AND Host='localhost';
FLUSH PRIVILEGES;

-- Verify the change
SELECT User, Host, plugin FROM mysql.user WHERE User='root';
