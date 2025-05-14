package com.example.spotifyapi.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.spotifyapi.dto.searchResultsDto;
import com.example.spotifyapi.service.SearchService;

@RestController
@RequestMapping("/search")
public class SearchController {
    
    @Autowired
    private SearchService searchService;

    @GetMapping
    public searchResultsDto search(@RequestParam("query") String query) {
        return searchService.search(query);
    }
}
