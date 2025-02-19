import { Meta, Title } from '@solidjs/meta';
import { createMemo } from 'solid-js';
import { useChatStore } from '../../contexts/chat';

export const ChatMetaTags = () => {
  const [chatStore] = useChatStore();
  const chatName = createMemo(() => chatStore.chat?.name ?? 'New Chat');
  const title = createMemo(
    () => `${chatName()} | The AI Study Bible - AI Bible Study Chat Assistant`,
  );
  const description =
    'Engage in meaningful conversations about Scripture with our AI-powered Bible study assistant. Get instant insights, answers, and deeper understanding of biblical passages.';

  return (
    <>
      <Title>{title()}</Title>
      <Meta name='description' content={description} />
      <Meta property='og:title' content={title()} />
      <Meta property='og:description' content={description} />
      <Meta property='og:type' content='website' />
      <Meta name='twitter:card' content='summary' />
      <Meta name='twitter:title' content={title()} />
      <Meta name='twitter:description' content={description} />
    </>
  );
};
