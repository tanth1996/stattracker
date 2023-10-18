package com.tanth.stattracker.player.daos;

import com.tanth.stattracker.player.models.Player;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RepositoryRestResource
@PreAuthorize("hasRole('ROLE_PLAYER_ADMIN')")
public interface PlayerRepository extends JpaRepository<Player, Long> {
    List<Player> findByDisplayName(String displayName);

    @Override
    @PreAuthorize("#player.id == null or @playerRepository.getUsernameForPlayerId(#player.id) == authentication?.name")
    Player save(@Param("player") Player player);

    @Override
    @PreAuthorize("@playerRepository.findById(#id)?.user?.username == authentication?.name")
    void deleteById(@Param("id") Long id);

    @Override
    @PreAuthorize("#player.id == null or #player?.user?.username == authentication?.name")
    void delete(@Param("player") Player player);


    default String getUsernameForPlayerId(Long id) {
        return findById(id).get().getUser().getUsername();
    }


}
