package com.tanth.stattracker.player.controllers;

import com.tanth.stattracker.player.daos.PlayerRepository;
import com.tanth.stattracker.player.dtos.PlayerDto;
import com.tanth.stattracker.player.models.Player;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Lookup;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class PlayerController {

    private final PlayerRepository playerRepository;


    @Autowired
    protected PlayerController(PlayerRepository playerRepository) {
        this.playerRepository = playerRepository;
    }

    /**
     * This endpoint is exposed automatically with no functionality (404) by Spring Data Rest.
     * This is our own implementation.
     */
    @GetMapping("/api/players/search/findById")
    public ResponseEntity<PlayerDto> findById(@RequestParam(value = "id", required = false) Long id) {
        if (id == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ID cannot be null.");
        }
        Player player = playerRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No entity found for ID."));
        return new ResponseEntity<>(convertPlayerToDto(player), HttpStatus.OK);
//        return player;
    }


    @Lookup
    public PlayerDto convertPlayerToDto(Player player) {
        return null; // concrete stub
    }


}
