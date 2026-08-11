package com.itworx.supportdesk.controller;

import com.itworx.supportdesk.service.ChatbotService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.security.Principal;

@RestController
@RequestMapping("/api/notes")
public class ChatbotController {

    private final ChatbotService chatbotService;

    public ChatbotController(ChatbotService chatbotService) {
        this.chatbotService = chatbotService;
    }

    public record QueryRequest(String question, String conversationId) {}

    @PostMapping("/load-file")
    public String loadFile() throws IOException {
        return "loaded " + chatbotService.loadFaq() + " Q&A chunks";
    }

    @PostMapping("/ask")
    public String ask(@RequestBody QueryRequest request, Principal principal) {
        // Memory is keyed per chat session, not per user: the frontend generates a
        // fresh conversationId each time the widget mounts (and on "New chat"), so
        // closing/reopening the widget starts a clean thread instead of quietly
        // resuming whatever the user said last time. The caller's email still
        // namespaces it (prefixed below) so conversation ids never collide across
        // different accounts.
        String rawId = request.conversationId();
        String sessionId = (rawId == null || rawId.isBlank()) ? "default" : rawId;
        String conversationId = principal.getName() + ":" + sessionId;
        return chatbotService.ask(request.question(), conversationId);
    }
}
