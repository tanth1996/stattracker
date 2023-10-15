package com.tanth.stattracker.player.events;

import com.tanth.stattracker.player.models.Player;
import com.tanth.stattracker.user.daos.UserRepository;
import com.tanth.stattracker.user.models.UserEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.rest.core.annotation.HandleBeforeCreate;
import org.springframework.data.rest.core.annotation.HandleBeforeSave;
import org.springframework.data.rest.core.annotation.RepositoryEventHandler;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
@RepositoryEventHandler(Player.class)
public class PlayerEventHandlerForUser {

    private final UserRepository userRepository;

    @Autowired
    public PlayerEventHandlerForUser(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @HandleBeforeCreate
    @HandleBeforeSave
    public void applyUserInformationUsingSecurityContext(Player player) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        UserEntity user = this.userRepository.findByUsername(username);
        if (user.getPlayer() == null) {
            player.setUser(user);
        }
    }


}
