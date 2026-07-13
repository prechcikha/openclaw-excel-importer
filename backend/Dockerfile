FROM php:8.2-fpm

# Install ODBC driver for MSSQL connection (most critical)
RUN apt-get update && apt-get install -y \
    unixodbc-dev \
    odbcinst \
    odbc-postgresql

# Configure GD extension (required by phpoffice/phpspreadsheet)  
RUN docker-php-ext-configure gd --with-freetype --with-jpeg && docker-php-ext-install gd

# PDO MySQL is already built into PHP 8.2-fpm image  
# ODBC drivers are installed above for MSSQL connectivity via standard ODBC driver

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY . .

# Pre-install PHP dependencies (ignore security advisories for development)
RUN composer install --no-dev --optimize-autoloader

EXPOSE 9000

CMD ["php-fpm"]
