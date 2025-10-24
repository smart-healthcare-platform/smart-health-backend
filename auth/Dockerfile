
FROM gradle:8.4-jdk17 AS builder
WORKDIR /app

COPY . .

RUN gradle clean bootJar --no-daemon

FROM eclipse-temurin:17-jdk-alpine
WORKDIR /app

COPY --from=builder /app/build/libs/*.jar app.jar

EXPOSE 8081

# Run app
ENTRYPOINT ["java", "-jar", "app.jar"]
