package com.example.websocketdemo.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.sql.Connection;

@Component
public class DatabaseMigrationRunner implements CommandLineRunner {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        try {
            System.out.println("=== STARTING DATABASE MIGRATION RUNNER ===");
            
            if (jdbcTemplate.getDataSource() == null) {
                System.out.println("No data source configured. Skipping database migration.");
                return;
            }

            try (Connection conn = jdbcTemplate.getDataSource().getConnection()) {
                String driverName = conn.getMetaData().getDriverName();
                System.out.println("Database driver detected: " + driverName);

                if (driverName.toLowerCase().contains("mysql")) {
                    System.out.println("Running MySQL schema update: Altering content to LONGTEXT...");
                    jdbcTemplate.execute("ALTER TABLE chat_messages MODIFY COLUMN content LONGTEXT");
                    System.out.println("MySQL schema update successful!");
                } else if (driverName.toLowerCase().contains("h2")) {
                    System.out.println("Running H2 schema update: Altering content to LONGTEXT...");
                    jdbcTemplate.execute("ALTER TABLE chat_messages ALTER COLUMN content LONGTEXT");
                    System.out.println("H2 schema update successful!");
                } else {
                    System.out.println("Unknown database driver. Skipping schema alteration.");
                }
            }
        } catch (Exception e) {
            System.err.println("=== DATABASE MIGRATION RUNNER WARNING ===");
            System.err.println("Failed to alter column type: " + e.getMessage());
            System.err.println("Continuing application startup anyway...");
        }
    }
}
