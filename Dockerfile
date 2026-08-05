# Stage 1: Build the application using Maven
FROM maven:3.8.6-eclipse-temurin-11 AS build
WORKDIR /app
ENV MAVEN_OPTS="-Xmx384m"
COPY spring-boot-websocket-chat-demo-master/pom.xml .
RUN mvn dependency:go-offline -B || true
COPY spring-boot-websocket-chat-demo-master/src ./src
RUN mvn clean package -DskipTests

# Stage 2: Run the application
FROM eclipse-temurin:11-jre
WORKDIR /app
COPY --from=build /app/target/websocket-demo-0.0.1-SNAPSHOT.jar websocket-demo.jar
EXPOSE 8080
ENTRYPOINT ["java", "-Xmx256m", "-XX:MaxMetaspaceSize=128m", "-Xss512k", "-XX:+UseSerialGC", "-Djava.security.egd=file:/dev/./urandom", "-jar", "websocket-demo.jar"]
