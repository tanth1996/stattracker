package com.tanth.stattracker.player.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.util.Objects;

@Entity
public class Player {
    @Id
    @GeneratedValue
    private Long id;

    @Version @JsonIgnore
    private Long version;

    @Column(nullable = false, unique = true)
    private String displayName;

    protected Player() {
        // Default constructor for JPA
    }

    public Player(String displayName) {
        this.displayName = displayName;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }
        Player player = (Player) o;
        return Objects.equals(id, player.id)
                && Objects.equals(displayName, player.displayName);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, displayName);
    }

    @Override
    public String toString() {
        return "Player{"
                + "id=" + id
                + ", displayName='" + displayName + '\''
                + ", version='" + version
                + '}';
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }


    public Long getVersion() {
        return version;
    }

    public void setVersion(Long version) {
        this.version = version;
    }


}
