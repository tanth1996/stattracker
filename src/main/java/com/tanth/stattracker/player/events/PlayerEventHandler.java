package com.tanth.stattracker.player.events;

import com.tanth.stattracker.player.models.Player;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.rest.core.annotation.HandleAfterCreate;
import org.springframework.data.rest.core.annotation.HandleAfterDelete;
import org.springframework.data.rest.core.annotation.HandleAfterSave;
import org.springframework.data.rest.core.annotation.RepositoryEventHandler;
import org.springframework.hateoas.server.EntityLinks;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import static com.tanth.stattracker.shared.websocket.config.WebSocketConfiguration.MESSAGE_PREFIX;

@Component
@RepositoryEventHandler(Player.class)
public class PlayerEventHandler {

    private final SimpMessagingTemplate websocket;
    private final EntityLinks entityLinks;

    private static final String GET_EVENT = "/newPlayer";
    private static final String UPDATE_EVENT = "/updatePlayer";
    private static final String DELETE_EVENT = "/deletePlayer";

    @Autowired
    public PlayerEventHandler(SimpMessagingTemplate websocket, EntityLinks entityLinks) {
        this.websocket = websocket;
        this.entityLinks = entityLinks;
    }


    @HandleAfterCreate
    public void newPlayer(Player player) {
        this.websocket.convertAndSend(MESSAGE_PREFIX + GET_EVENT, getPath(player));
    }


    @HandleAfterSave
    public void updatePlayer(Player player) {
        this.websocket.convertAndSend(MESSAGE_PREFIX + UPDATE_EVENT, getPath(player));
    }


    @HandleAfterDelete
    public void deletePlayer(Player player) {
        this.websocket.convertAndSend(MESSAGE_PREFIX + DELETE_EVENT, getPath(player));
    }


    /**
     * Take an {@link Player} and get the URI using Spring Data REST's {@link EntityLinks}.
     *
     * @param player
     */
    private String getPath(Player player) {
        return this.entityLinks.linkForItemResource(player.getClass(), player.getId()).toUri().getPath();
    }


}
