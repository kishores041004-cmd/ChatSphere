package com.example.websocketdemo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

@SpringBootApplication
public class WebsocketDemoApplication {

	public static void main(String[] args) {
		// Test database connection before starting Spring Boot to log the exact error
		String host = System.getenv("MYSQL_HOST");
		if (host == null || host.isEmpty()) {
			host = System.getenv("MYSQLHOST");
		}
		if (host == null || host.isEmpty()) {
			host = "localhost";
		}

		String port = System.getenv("MYSQL_PORT");
		if (port == null || port.isEmpty()) {
			port = System.getenv("MYSQLPORT");
		}
		if (port == null || port.isEmpty()) {
			port = "3306";
		}

		String db = System.getenv("MYSQL_DATABASE");
		if (db == null || db.isEmpty()) {
			db = System.getenv("MYSQLDATABASE");
		}
		if (db == null || db.isEmpty()) {
			db = "chatsphere";
		}

		String user = System.getenv("MYSQL_USER");
		if (user == null || user.isEmpty()) {
			user = System.getenv("MYSQLUSER");
		}
		if (user == null || user.isEmpty()) {
			user = "root";
		}

		String password = System.getenv("MYSQL_PASSWORD");
		if (password == null || password.isEmpty()) {
			password = System.getenv("MYSQLPASSWORD");
		}
		if (password == null) {
			password = "";
		}

		String url = "jdbc:mysql://" + host + ":" + port + "/" + db + "?createDatabaseIfNotExist=true&useSSL=true&verifyServerCertificate=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
		
		System.out.println("=== DATABASE CONNECTION TEST START ===");
		System.out.println("Host: " + host);
		System.out.println("Port: " + port);
		System.out.println("Database: " + db);
		System.out.println("Username: " + user);
		System.out.println("Password Length: " + (password != null ? password.length() : 0));
		
		System.out.println("Environment Variables starting with MYSQL:");
		for (String key : System.getenv().keySet()) {
			if (key.contains("MYSQL") || key.contains("PASS") || key.contains("PORT")) {
				String val = System.getenv(key);
				System.out.println("  - " + key + " (length: " + (val != null ? val.length() : 0) + ")");
			}
		}

		try (Connection conn = DriverManager.getConnection(url, user, password)) {
			System.out.println("=== DATABASE CONNECTION TEST SUCCESSFUL ===");
		} catch (SQLException e) {
			System.err.println("=== DATABASE CONNECTION TEST FAILED ===");
			e.printStackTrace();
		}

		SpringApplication.run(WebsocketDemoApplication.class, args);
	}
}
