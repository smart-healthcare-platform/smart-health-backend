# ===============================
# STAGE 1: Build Spring Boot app
# ===============================
FROM gradle:8.4-jdk21 AS builder
WORKDIR /app

# Copy source code
COPY . .

# Build JAR file
RUN gradle clean bootJar --no-daemon

# ===============================
# STAGE 2: Runtime
# ===============================
FROM eclipse-temurin:21-jdk-alpine
WORKDIR /app

# Copy JAR from builder stage
COPY --from=builder /app/build/libs/*.jar app.jar

# Expose port
EXPOSE 8089

# Run application
ENTRYPOINT ["java", "-jar", "app.jar"]
