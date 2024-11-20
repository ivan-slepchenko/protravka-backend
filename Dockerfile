# Use the official MySQL image from the Docker Hub
FROM mysql:8.0

# Define build arguments
ARG DB_PASSWORD
ARG DB_NAME
ARG DB_USERNAME
ARG DB_PORT

# Set environment variables for MySQL using build arguments
ENV MYSQL_ROOT_PASSWORD=$DB_PASSWORD
ENV MYSQL_DATABASE=$DB_NAME
ENV MYSQL_USER=$DB_USERNAME
ENV MYSQL_PASSWORD=$DB_PASSWORD

# Expose the specified MySQL port
EXPOSE ${DB_PORT}

# Copy the initialization script to the Docker container
COPY ./init.sql /docker-entrypoint-initdb.d/

# Run the MySQL server with the specified port
CMD ["mysqld", "--port=${DB_PORT}"]