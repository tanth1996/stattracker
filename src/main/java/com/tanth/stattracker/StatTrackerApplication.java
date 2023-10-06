package com.tanth.stattracker;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class StatTrackerApplication {

	private static final Logger log = LoggerFactory.getLogger(StatTrackerApplication.class);

	public static void main(String[] args) {
		SpringApplication.run(StatTrackerApplication.class, args);
	}

}
