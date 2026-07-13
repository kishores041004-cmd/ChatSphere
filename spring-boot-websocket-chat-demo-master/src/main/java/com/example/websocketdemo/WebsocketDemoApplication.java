package com.example.websocketdemo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class WebsocketDemoApplication {

	public static void main(String[] args) {
		System.out.println("=== Starting ChatSphere Backend in Self-Contained In-Memory Mode ===");
		SpringApplication.run(WebsocketDemoApplication.class, args);
	}
}
