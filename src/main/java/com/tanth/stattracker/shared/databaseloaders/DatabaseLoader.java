package com.tanth.stattracker.shared.databaseloaders;

import com.tanth.stattracker.player.daos.PlayerRepository;
import com.tanth.stattracker.player.models.Player;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DatabaseLoader implements CommandLineRunner {
    private final PlayerRepository playerRepository;

    @Autowired
    public DatabaseLoader(PlayerRepository playerRepository) {
        this.playerRepository = playerRepository;
    }

    @Override
    public void run(String... strings) {
        if (playerRepository.findByDisplayName("TH").isEmpty()) {
            this.playerRepository.save(new Player("TH"));
        }
    }


}
