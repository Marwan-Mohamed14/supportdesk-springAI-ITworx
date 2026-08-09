package com.itworx.supportdesk.controller;

import com.itworx.supportdesk.service.ChatbotService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

@RestController
@RequestMapping("/api/notes")
public class ChatbotController {

    private final ChatbotService chatbotService;

    public ChatbotController(ChatbotService chatbotService) {
        this.chatbotService = chatbotService;
    }

    public record QueryRequest(String question) {}

    @PostMapping("/load-file")
    public String loadFile() throws IOException {
        return "loaded " + chatbotService.loadFaq() + " Q&A chunks";
    }

    @PostMapping("/ask")
    public String ask(@RequestBody QueryRequest request) {
        return chatbotService.ask(request.question());
    }
}
