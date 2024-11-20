# Use the official MySQL image from the Docker Hub
FROM mysql:8.0

# Set environment variables for MySQL using Docker environment variables
ENV MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}
ENV MYSQL_DATABASE=${MYSQL_DATABASE}
ENV MYSQL_USER=${MYSQL_USER}
ENV MYSQL_PASSWORD=${MYSQL_PASSWORD}

# Expose the default MySQL port
EXPOSE 3306

# Copy the initialization script to the Docker container
COPY ./init.sql /docker-entrypoint-initdb.d/

# Run the MySQL server
CMD ["mysqld"]