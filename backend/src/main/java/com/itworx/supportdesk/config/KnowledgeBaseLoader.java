package com.itworx.supportdesk.config;

import com.itworx.supportdesk.service.ChatbotService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * Loads the FAQ knowledge base into the in-memory vector store on startup.
 *
 * SimpleVectorStore (see AiConfig) holds nothing across restarts - without
 * this, every restart silently empties the assistant's knowledge and it
 * answers "I don't know" to everything until someone remembers to call
 * POST /api/notes/load-file by hand again.
 */
@Component
public class KnowledgeBaseLoader implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(KnowledgeBaseLoader.class);

    private final ChatbotService chatbotService;

    public KnowledgeBaseLoader(ChatbotService chatbotService) {
        this.chatbotService = chatbotService;
    }

    @Override
    public void run(String... args) {
        try {
            int loaded = chatbotService.loadFaq();
            log.info("Chatbot knowledge base loaded on startup: {} Q&A chunks", loaded);
        } catch (Exception e) {
            // Don't fail startup over this (e.g. Ollama not running yet) - the
            // assistant just answers "I don't know" until a manual retry via
            // POST /api/notes/load-file succeeds.
            log.warn("Could not load the chatbot knowledge base on startup - the assistant will " +
                    "have no context until POST /api/notes/load-file is called successfully. Cause: {}",
                    e.getMessage());
        }
    }
}
