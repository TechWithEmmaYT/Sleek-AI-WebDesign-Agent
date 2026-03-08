import { ChatStatus, UIMessage } from 'ai';
import React from 'react'
import { PromptInputMessage } from '../ai-elements/prompt-input';
import { Conversation, ConversationContent, ConversationEmptyState } from '../ai-elements/conversation';
import ChatInput from './chat-input';
import { Skeleton } from '../ui/skeleton';
import { Message, MessageContent, MessageResponse } from '../ai-elements/message';
import { Attachment, AttachmentPreview, Attachments } from '../ai-elements/attachments';
import { Loader } from '../ui/loader';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertCircle, AlertCircleIcon, CheckCircle2, CheckIcon, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Spinner } from '../ui/spinner';
import { PageType } from '@/types/project';

type PropsType = {
  className?: string;
  input: string;
  isLoading: boolean;
  isProjectLoading?: boolean;
  setInput: (input: string) => void;
  messages: UIMessage[];
  error?: Error;
  onStop: () => void;
  onSubmit: (message: PromptInputMessage, options?: any) => void;
  status: ChatStatus;
  selectedPage?: PageType
}

const ChatPanel = ({
  className,
  input,
  isLoading,
  setInput,
  messages,
  onStop,
  onSubmit,
  status,
  error,
  isProjectLoading,
  selectedPage
}: PropsType) => {
  return (
    <div className="relative flex flex-col flex-1 overflow-hidden">
      <Conversation className={className}>
        <ConversationContent>
          {isProjectLoading ? (
            <div className='flex flex-col gap-2 pt-2'>
              <Skeleton className='w-full h-6' />
              <Skeleton className='w-3/4 h-4' />
              <Skeleton className='w-1/2 h-4' />
            </div>
          ) : messages.length === 0 ? (
            <ConversationEmptyState />
          ) : messages?.map((message, msgIndex) => {
            const attachmentsFromMessage = message.parts.filter(
              (part) => part.type === "file"
            )
            return (
              <>
                <Message from={message.role} key={message.id}>
                  <MessageContent className="text-[14.5px]">
                    {attachmentsFromMessage.length > 0 && (
                      <Attachments variant="grid">
                        {attachmentsFromMessage.map((part, i) => {
                          const id = `${message.id}-file-${i}`
                          const attachmentData = { ...part, id }
                          return (
                            <Attachment
                              data={attachmentData}
                              key={id}
                              className="size-20 border-primary/10"
                            >
                              <AttachmentPreview />
                            </Attachment>
                          )
                        })}
                      </Attachments>
                    )}

                    {message.parts.map((part, i) => {
                      switch (part.type) {
                        case "text":
                          return (
                            <div
                              key={`${message.id}-text-${i}`}
                              className="flex items-start gap-2">
                              <MessageResponse>
                                {part.text}
                              </MessageResponse>
                            </div>
                          )
                        case "data-generation":
                          const data = (part as any).data;
                          return (
                            <GenerationCard
                              key={`${message.id}-gen-${i}`}
                              status={data.status}
                              pages={data.pages}
                              currentPageId={data.currentPageId}
                              regeneratePage={data.regeneratePage}
                            />
                          )

                        default:
                          return null;
                      }
                    })}
                  </MessageContent>
                </Message>
              </>
            )
          })}

          {isLoading ? (
            <div className="px-2">
              <Loader />
            </div>
          ) : null}

          {status === "error" && error && (
            <ErrorAlert
              title="Chat Error"
              message={"Something went wrong"}
            />
          )}

        </ConversationContent>
      </Conversation>

      <div className="p-4 bg-background border-t">
        <ChatInput
          input={input}
          isLoading={isLoading}
          status={status}
          selectedPage={selectedPage}
          setInput={setInput}
          onStop={onStop}
          onSubmit={onSubmit}

        />
      </div>
    </div>
  )
}


const ErrorAlert = ({ title, message }: {
  title: string;
  message: string;
}) => {
  return (
    <>
      <Alert
        variant="destructive"
        className="w-full"
      >
        <AlertCircleIcon className="h-4 w-4" />
        <div>
          <AlertTitle>{title}</AlertTitle>
          <AlertDescription>
            {message}
          </AlertDescription>
        </div>
      </Alert>
    </>
  )
}

const GenerationCard = ({
  status,
  pages,
  currentPageId,
  regeneratePage
}: {
  status: 'analyzing' | 'generating' | 'regenerating' | 'canceled' | 'complete' | 'error';
  pages: { id: string, name: string, done: boolean }[]
  regeneratePage: { id: string, name: string, done: boolean }
  currentPageId?: string
}) => {
  const isComplete = status === "complete";
  const isAnalyzing = status === "analyzing";
  const isCanceled = status === "canceled";
  const isError = status === "error";
  const isRegenerating = status === "regenerating"
  return (
    <div className={`mx-2 my-2 rounded-xl border p-4 flex flex-col
    gap-3 shadow-sm animate-in fade-in slide-in-from-bottom-2
    ${isError
        ? 'border-destructive/30 bg-destructive/5'
        : 'border-border bg-card'
      }`}>
      <div className="flex items-center gap-2 text-sm font-medium">
        {isComplete ? (
          <CheckCircle2 className="size-4 text-green-500 shrink-0" />
        ) : isCanceled ? (
          <AlertCircleIcon className="size-4 text-destructive shrink-0" />
        ) : isError ? (
          <AlertCircleIcon className="size-4 text-destructive shrink-0" />
        ) : (
          <Spinner className="size-4 shrink-0" />
        )}
        <span className={isError ? 'text-destructive' : ''}>
          {isAnalyzing
            ? 'Analyzing request...'
            : isCanceled
              ? 'Generation canceled'
              : isError
                ? 'Generation failed'
                : isRegenerating
                  ? `Regenerating ${regeneratePage?.name}...`
                  : isComplete
                    ? (regeneratePage
                      ? `Regenerated ${regeneratePage.name}`
                      : `Generated ${pages?.length} pages`)
                    : `Generating ${pages?.length} pages...`}
        </span>
      </div>

      {pages?.length > 0 && (
        <div className="flex flex-col gap-2">
          {pages.map(page => {
            const isGenerating = currentPageId === page.id;
            return (
              <div key={page.id} className="flex items-center gap-3 text-sm">
                <div className="size-4 flex items-center justify-center shrink-0">
                  {page.done
                    ? <CheckCircle2 className="size-4 text-green-500" />
                    : isGenerating
                      ? <Spinner className="size-4" />
                      : <Circle className="size-4 text-muted-foreground/30" />
                  }
                </div>
                <span className={
                  page.done ? 'text-muted-foreground line-through' :
                    isGenerating ? 'text-foreground font-medium' :
                      'text-muted-foreground'
                }>
                  {page.name}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  )
}

export default ChatPanel
