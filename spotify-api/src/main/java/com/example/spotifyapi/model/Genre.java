package com.example.spotifyapi.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashSet;
import java.util.Set;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Genre {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String name;
    private String description;
    private String imageUrl;
    
    @JsonIgnore
    @ManyToMany(mappedBy = "genres")
    private Set<Artist> artists = new HashSet<>();
    
    @JsonIgnore
    @ManyToMany(mappedBy = "genres")
    private Set<Album> albums = new HashSet<>();
}
