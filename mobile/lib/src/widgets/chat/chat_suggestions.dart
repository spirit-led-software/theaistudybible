import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:revelationsai/src/utils/build_context_extensions.dart';

class ChatSuggestions extends HookWidget {
  final void Function(String suggestionString) onTap;

  const ChatSuggestions({super.key, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Container(
        padding: const EdgeInsets.only(
          left: 30,
          right: 30,
          bottom: 80,
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    'Not Sure What to Say?',
                    style: context.textTheme.headlineMedium?.copyWith(
                      color: context.secondaryColor,
                    ),
                  ),
                ],
              ),
              const SizedBox(
                height: 10,
              ),
              SizedBox(
                width: context.width * 0.6,
                child: const Text(
                  "Tap on any of the starter prompts from the topics below to get started.",
                  textAlign: TextAlign.center,
                ),
              ),
              const SizedBox(
                height: 20,
              ),
              ChatSuggestionTopic(
                topic: "Jesus Christ",
                suggestions: const [
                  "Who is Jesus Christ?",
                  "What did Jesus Christ do?",
                  "Why is Jesus Christ important?",
                  "How did Jesus' death and resurrection provide salvation for humanity?",
                  "What are the key events in Jesus' life?",
                ],
                onTap: onTap,
              ),
              ChatSuggestionTopic(
                topic: "God's Character",
                suggestions: const [
                  'What does "God is love" mean?',
                  "How is God just?",
                  "Explain God's holiness.",
                  "What does it mean that God is omniscient?",
                  "What does it mean that God is omnipresent?",
                  "What does it mean that God is omnipotent?",
                  "Explain the Trinity.",
                  "Why does God let bad things happen?",
                ],
                onTap: onTap,
              ),
              ChatSuggestionTopic(
                topic: "The Bible",
                suggestions: const [
                  "What is the Bible?",
                  "What is the Bible about?",
                  "What is the Bible's purpose?",
                  "Is the Bible true?",
                  "How can I more effectively read the Bible?",
                ],
                onTap: onTap,
              ),
              ChatSuggestionTopic(
                topic: "The Holy Spirit",
                suggestions: const [
                  "Who is the Holy Spirit?",
                  "What does the Holy Spirit do?",
                  "What is the role of the Holy Spirit?",
                  "What is the fruit of the Holy Spirit?",
                  "What is the baptism of the Holy Spirit?",
                ],
                onTap: onTap,
              ),
              ChatSuggestionTopic(
                topic: "Prayer",
                suggestions: const [
                  "How do I pray?",
                  "What is prayer?",
                  "Why should I pray?",
                  "What should I pray for?",
                  "What is the Lord's Prayer?",
                ],
                onTap: onTap,
              )
            ],
          ),
        ),
      ),
    );
  }
}

class ChatSuggestionTopic extends HookWidget {
  final String topic;
  final List<String> suggestions;
  final void Function(String suggestionString) onTap;

  const ChatSuggestionTopic({
    super.key,
    required this.topic,
    required this.suggestions,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ExpansionTile(
      title: Text(topic),
      children: suggestions
          .map(
            (suggestion) => ChatSuggestion(
              suggestionString: suggestion,
              onTap: onTap,
            ),
          )
          .toList(),
    );
  }
}

class ChatSuggestion extends HookWidget {
  final String suggestionString;
  final void Function(String suggestionString) onTap;

  const ChatSuggestion({super.key, required this.suggestionString, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: const EdgeInsets.only(
        left: 10,
        right: 5,
      ),
      title: Text(suggestionString),
      onTap: () => onTap(suggestionString),
      trailing: IconButton(
        icon: const FaIcon(
          FontAwesomeIcons.arrowRight,
          size: 20,
        ),
        onPressed: () => onTap(suggestionString),
      ),
    );
  }
}
