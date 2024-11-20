# Use the official MySQL image from the Docker Hub
FROM mysql:8.0

# Set environment variables for MySQL using Docker environment variables
ENV MYSQL_ROOT_PASSWORD=${DB_PASSWORD}
ENV MYSQL_DATABASE=${DB_NAME}
ENV MYSQL_USER=${DB_USERNAME}
ENV MYSQL_PASSWORD=${DB_PASSWORD}

# Expose the specified MySQL port
EXPOSE ${DB_PORT}

# Copy the initialization script to the Docker container
COPY ./init.sql /docker-entrypoint-initdb.d/

# Run the MySQL server with the specified port
CMD ["mysqld", "--port=${DB_PORT}"]