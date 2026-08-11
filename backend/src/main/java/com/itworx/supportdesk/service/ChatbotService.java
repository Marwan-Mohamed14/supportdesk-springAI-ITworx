package com.itworx.supportdesk.service;

import com.itworx.supportdesk.service.tools.InventoryTools;
import com.itworx.supportdesk.service.tools.OrderTools;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
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

    public ChatbotService(
            VectorStore vectorStore,
            ChatClient.Builder chatClientBuilder,
            ChatMemory chatMemory,
            OrderTools orderTools,
            InventoryTools inventoryTools
    ) {
        this.vectorStore = vectorStore;
        // MessageChatMemoryAdvisor reads/writes chatMemory automatically on every
        // call, keyed by whatever ChatMemory.CONVERSATION_ID param is passed in
        // (see ask() below) - no manual message-list bookkeeping needed here.
        // defaultTools registers the real-data lookups (User Stories H1/H2) on
        // every call, so the model can invoke getOrderStatus / checkInventory
        // instead of guessing from the FAQ context.
        this.chatClient = chatClientBuilder
                .defaultAdvisors(MessageChatMemoryAdvisor.builder(chatMemory).build())
                .defaultTools(orderTools, inventoryTools)
                .build();
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

    public String ask(String question, String conversationId) {
        List<Document> similarDocs = vectorStore.similaritySearch(
            SearchRequest.builder().query(question).topK(2).build()
        );

        String context = similarDocs.stream()
            .map(Document::getText)
            .collect(Collectors.joining("\n"));

        String prompt = """
            Answer the question using the context below, the earlier
            conversation, and the tools available to you.

            Use the context for general policy/product/FAQ questions.
            Use the conversation history directly when the question is
            about the conversation itself (e.g. the user's name, or
            something they told you earlier) or when it's needed to
            interpret the question (e.g. "that" referring back to an
            earlier message).

            You have tools to look up a specific order's real status
            (getOrderStatus) and a specific product's real stock
            (checkInventory). Whenever the question names or implies a
            specific order number or SKU, call the matching tool instead
            of guessing or relying on the context - the context is FAQ
            text, not live data, and will never have the right answer to
            "what's the status of order X" or "how much stock is left on
            SKU Y". If a tool reports something was not found, say so
            plainly instead of inventing a status or quantity.

            If neither the context, the conversation history, nor a tool
            call has the answer, say you don't know - don't make one up.

            Context:
            %s

            Question:
            %s
            """.formatted(context, question);

        return chatClient.prompt()
            .user(prompt)
            .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, conversationId))
            .call()
            .content();
    }

}
