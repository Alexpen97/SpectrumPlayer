FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Create a non-root user to run the application
RUN addgroup -S spectrum && adduser -S spectrum -G spectrum
USER spectrum:spectrum

# Copy the JAR file
COPY --chown=spectrum:spectrum target/*.jar app.jar

# Set environment variables
ENV JAVA_OPTS="-Xmx512m"

# Expose the port
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
