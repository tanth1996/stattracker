package com.tanth.stattracker.player.daos;

import com.tanth.stattracker.player.models.Player;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PlayerRepository extends JpaRepository<Player, Long> {
    List<Player> findByDisplayName(String displayName);

    Player findById(long id);
}
