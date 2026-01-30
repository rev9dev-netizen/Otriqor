import { ClientChatLayout } from "@/components/chat/client-layout";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClientChatLayout>
      {children}
    </ClientChatLayout>
  );
}
