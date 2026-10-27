export type ChatAttachment = { id: number; name: string; size: number; mime: string; is_image: boolean; url: string; thumb: string | null };

export type ChatMessage = {
  id: number;
  conversation_id: number;
  from_staff: boolean;
  sender: { id: number; name: string } | null;
  body: string | null;
  attachments: ChatAttachment[];
  reply_to: { id: number; from_staff: boolean; is_deleted: boolean; body: string | null; has_attachments: boolean } | null;
  product: { id: number; name: string; slug: string; price: number; unit: string; image: string | null } | null;
  order: { number: string; status: { value: string; label: string }; total: number } | null;
  is_edited: boolean;
  is_deleted: boolean;
  read_at: string | null;
  created_at: string;
  /** Only on the sender's screen while the message is on its way. */
  pending?: "sending" | "failed";
  localKey?: string;
};

export type ChatPage = { data: ChatMessage[]; meta: { has_more: boolean } };

export type ChatInfo = {
  id: number;
  manager: { name: string; is_assigned: boolean; is_online: boolean; last_seen_at: string | null };
  unread_count: number;
  limits: { max_files: number; max_file_size_kb: number; file_types: string[]; edit_window_hours: number };
};

export type InboxConversation = {
  id: number;
  client: { id: number; name: string; phone: string | null; email: string; is_online: boolean; last_seen_at: string | null };
  manager: { id: number; name: string } | null;
  last_message: {
    id: number;
    from_staff: boolean;
    is_deleted: boolean;
    body: string | null;
    has_attachments: boolean;
    has_product: boolean;
    has_order: boolean;
    read_at: string | null;
    created_at: string;
  } | null;
  unread_count: number;
  last_message_at: string | null;
};

export type InboxDetails = InboxConversation & {
  client_since: string;
  orders_count: number;
  orders_spent: number;
  recent_orders: { number: string; status: { value: string; label: string }; total: number; created_at: string }[];
};

/** What the composer sends. */
export type OutgoingMessage = { body: string; files: File[]; replyTo: ChatMessage | null; productId?: number; orderNumber?: string };

/** Who is looking at the conversation: the customer or the shop team. */
export type ChatViewer = "client" | "staff";
