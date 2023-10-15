package com.tanth.stattracker.shared.databaseloaders;

import com.tanth.stattracker.player.daos.PlayerRepository;
import com.tanth.stattracker.player.models.Player;
import com.tanth.stattracker.user.daos.UserRepository;
import com.tanth.stattracker.user.models.UserEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class DatabaseLoader implements CommandLineRunner {
    private final PlayerRepository playerRepository;
    private final UserRepository userRepository;

    @Autowired
    public DatabaseLoader(PlayerRepository playerRepository, UserRepository userRepository) {
        this.playerRepository = playerRepository;
        this.userRepository = userRepository;
    }

    @Override
    public void run(String... strings) {
        if (userRepository.findByUsername("other") == null) {
            this.userRepository.save(new UserEntity("other", "1234", new String[] {"ROLE_PLAYER_ADMIN"}, null));
        }

        UserEntity defaultUser = userRepository.findByUsername("tth");
        if (defaultUser == null) {
            defaultUser = new UserEntity("tth", "1234", new String[] {"ROLE_PLAYER_ADMIN"}, null);
        }

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("tth", "asdf",
                        AuthorityUtils.createAuthorityList("ROLE_PLAYER_ADMIN")));
        if (playerRepository.findByDisplayName("TH").isEmpty()) {
            final var player = new Player("TH", defaultUser);
            this.userRepository.save(defaultUser);
        }
        SecurityContextHolder.clearContext();
    }


}
