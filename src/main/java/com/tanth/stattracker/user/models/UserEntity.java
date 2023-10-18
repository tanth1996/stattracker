package com.tanth.stattracker.user.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.tanth.stattracker.player.models.Player;
import jakarta.persistence.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Arrays;
import java.util.Objects;

@Entity
public class UserEntity {

    public static final PasswordEncoder PASSWORD_ENCODER = new BCryptPasswordEncoder();

    @Id @GeneratedValue private Long id;

    @Column(nullable = false, unique = true)
    private String username;
    @JsonIgnore
    private String password;
    @JsonIgnore
    private String[] roles;

    @OneToOne
    @JoinTable(
            name = "User_Player",
            joinColumns = {@JoinColumn(name = "user_id", referencedColumnName = "id")},
            inverseJoinColumns = {@JoinColumn(name = "player_id", referencedColumnName = "id")}
    )
    private Player player;

    protected UserEntity() {
        // Default constructor for JPA
    }

    public UserEntity(String username, String password, String[] roles, Player player) {
        this.username = username;
        this.setPassword(password);
        this.roles = roles;
        this.player = player;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        UserEntity user = (UserEntity) o;
        return Objects.equals(id, user.id)
                && Objects.equals(username, user.username)
                && Objects.equals(password, user.password)
                && Objects.equals(roles, user.roles)
                && Objects.equals(player, user.player);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, username, password, player);
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public Player getPlayer() {
        return player;
    }

    public void setPlayer(Player player) {
        this.player = player;
    }

    public void setPassword(String password) {
        this.password = PASSWORD_ENCODER.encode(password);
    }

    public String getPassword() {
        return password;
    }

    public String[] getRoles() {
        return roles;
    }

    public void setRoles(String[] roles) {
        this.roles = roles;
    }

    @Override
    public String toString() {
        return "User{" +
                "id=" + id +
                ", username='" + username + '\'' +
                ", roles='" + Arrays.toString(roles) + '\'' +
                ", player=" + player +
                '}';
    }


}
