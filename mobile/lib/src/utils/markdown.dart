String markdownToText(String markdown) {
  // Images
  String text = markdown.replaceAllMapped(RegExp(r'!\[(.*?)\]\((.*?)\)'), (match) => match.group(1) ?? '');

  // Links
  text = text.replaceAllMapped(RegExp(r'\[(.*?)\]\((.*?)\)'), (match) => match.group(1) ?? '');

  // Code
  text = text.replaceAllMapped(RegExp(r'`(.*?)`'), (match) => match.group(1) ?? '');

  // Code block
  text = text.replaceAllMapped(RegExp(r'```(.*?)```'), (match) => match.group(1) ?? '');

  // Bold, italic, strikethrough
  text = text.replaceAllMapped(RegExp(r'\*\*(.*?)\*\*'), (match) => match.group(1) ?? '');
  text = text.replaceAllMapped(RegExp(r'\*(.*?)\*'), (match) => match.group(1) ?? '');
  text = text.replaceAllMapped(RegExp(r'~~(.*?)~~'), (match) => match.group(1) ?? '');
  text = text.replaceAllMapped(RegExp(r'__(.*?)__'), (match) => match.group(1) ?? '');
  text = text.replaceAllMapped(RegExp(r'_(.*?)_'), (match) => match.group(1) ?? '');

  // Headers
  text = text.replaceAllMapped(RegExp(r'#{1,6} (.*?)'), (match) => match.group(1) ?? '');

  // Blockquotes
  text = text.replaceAllMapped(RegExp(r'\n> (.*?)'), (match) => '\n${match.group(1) ?? ''}');

  // Horizontal rule
  text = text.replaceAllMapped(RegExp(r'\n---'), (match) => match.group(1) ?? '');

  return text.trim();
}
