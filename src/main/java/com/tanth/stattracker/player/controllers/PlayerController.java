package com.tanth.stattracker.player.controllers;

import com.tanth.stattracker.player.daos.PlayerRepository;
import com.tanth.stattracker.player.models.Player;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class PlayerController {

    private final PlayerRepository playerRepository;

    @Autowired
    private PlayerController(PlayerRepository playerRepository) {
        this.playerRepository = playerRepository;
    }

    @GetMapping("/api/players/search/findById")
    public Player findById(@RequestParam(value = "id", required = false) Long id) {
        if (id == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ID cannot be null.");
        }
        return playerRepository.findById(id).get();
    }


}
