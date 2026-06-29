package com.example.websocketdemo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

@SpringBootApplication
public class WebsocketDemoApplication {

	private static String getEnvRobust(String name) {
		String target = name.trim().replace("_", "").toUpperCase();
		for (String key : System.getenv().keySet()) {
			String cleanKey = key.trim().replace("_", "").toUpperCase();
			if (cleanKey.equals(target)) {
				return System.getenv(key);
			}
		}
		return null;
	}

	public static void main(String[] args) {
		// Test database connection before starting Spring Boot to log the exact error
		String host = getEnvRobust("MYSQLHOST");
		if (host != null && !host.isEmpty()) {
			String port = getEnvRobust("MYSQLPORT");
			if (port == null || port.isEmpty()) {
				port = "3306";
			}

			String db = getEnvRobust("MYSQLDATABASE");
			if (db == null || db.isEmpty()) {
				db = "chatsphere";
			}

			String user = getEnvRobust("MYSQLUSER");
			if (user == null || user.isEmpty()) {
				user = "root";
			}

			String password = getEnvRobust("MYSQLPASSWORD");
			if (password == null) {
				password = "";
			}

			String url = "jdbc:mysql://" + host + ":" + port + "/" + db + "?createDatabaseIfNotExist=true&useSSL=true&verifyServerCertificate=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
			
			System.out.println("=== DATABASE CONNECTION TEST START ===");
			System.out.println("Host: " + host);
			System.out.println("Port: " + port);
			System.out.println("Database: " + db);
			System.out.println("Username: " + user);
			System.out.println("Password Length: " + password.length());

			try (Connection conn = DriverManager.getConnection(url, user, password)) {
				System.out.println("=== DATABASE CONNECTION TEST SUCCESSFUL ===");
			} catch (SQLException e) {
				System.err.println("=== DATABASE CONNECTION TEST FAILED ===");
				e.printStackTrace();
			}

			// Inject robust variables as System Properties to override any environment naming issues in Spring Boot
			System.setProperty("spring.datasource.url", url);
			System.setProperty("spring.datasource.username", user);
			System.setProperty("spring.datasource.password", password);
		} else {
			System.out.println("MYSQLHOST not configured. Starting application using default (local H2) profile.");
		}

		SpringApplication.run(WebsocketDemoApplication.class, args);
	}
}
