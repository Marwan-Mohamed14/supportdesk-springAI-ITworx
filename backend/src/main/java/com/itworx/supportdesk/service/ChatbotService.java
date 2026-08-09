package com.itworx.supportdesk.service;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ChatbotService {
    private final VectorStore vectorStore;
    private final ChatClient chatClient;

        @Value("classpath:Faq.txt")
    private Resource faqResource;

    public ChatbotService(VectorStore vectorStore, ChatClient.Builder chatClientBuilder) {
        this.vectorStore = vectorStore;
        this.chatClient = chatClientBuilder.build();
    }
     public int loadFaq() throws IOException {
        String content = faqResource.getContentAsString(StandardCharsets.UTF_8);
        List<Document> documents = Arrays.stream(content.split("\\r?\\n\\r?\\n"))
            .filter(b -> !b.isBlank())
            .map(Document::new)
            .toList();

        vectorStore.add(documents);
        return documents.size();
    }

    public String ask(String question) {
        List<Document> similarDocs = vectorStore.similaritySearch(
            SearchRequest.builder().query(question).topK(2).build()
        );

        String context = similarDocs.stream()
            .map(Document::getText)
            .collect(Collectors.joining("\n"));

        String prompt = """
            Answer the question using only the context below.
            If the context doesn't contain the answer, say you don't know.

            Context:
            %s

            Question:
            %s
            """.formatted(context, question);

        return chatClient.prompt().user(prompt).call().content();
    }

}
