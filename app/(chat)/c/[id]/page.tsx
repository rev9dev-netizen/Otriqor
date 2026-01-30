import { ChatView } from "@/components/chat/chat-view";

export default async function Page({ params }: { params: { id: string } }) {
  const { id } = await params; 
  return <ChatView key={id} chatId={id} />
}
