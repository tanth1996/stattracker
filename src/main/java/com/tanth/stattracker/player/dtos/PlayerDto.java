package com.tanth.stattracker.player.dtos;

import com.tanth.stattracker.player.models.Player;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;

@Component
@Scope("prototype")
public class PlayerDto {

    private Long id;
    private String displayName;
    private String username;

    public PlayerDto(Player player) {
        this.id = player.getId();
        this.displayName = player.getDisplayName();
        this.username = player.getUser().getUsername();
    }

    public Long getId() {
        return id;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getUsername() {
        return username;
    }


}
