import { ChatStatus } from 'ai';
import React, { useState } from 'react'
import { PromptInput, PromptInputActionAddAttachments, PromptInputActionMenu, PromptInputActionMenuContent, PromptInputActionMenuTrigger, PromptInputBody, PromptInputFooter, PromptInputMessage, PromptInputSubmit, PromptInputTextarea, PromptInputTools, usePromptInputAttachments } from '../ai-elements/prompt-input';
import { SignInButton, SignUpButton, useAuth } from '@insforge/nextjs';
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '../ui/item';
import { ArrowUpIcon, LockIcon, Square, XIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { Attachment, AttachmentPreview, AttachmentRemove, Attachments } from '../ai-elements/attachments';
import { PageType } from '@/types/project';
import { useCanvas } from '@/hooks/use-canvas';
import { Badge } from '../ui/badge';

type ChatInputProps = {
  input: string;
  isLoading: boolean;
  status: ChatStatus;
  selectedPage?: PageType;
  setInput: (input: string) => void;
  onStop: () => void;
  onSubmit: (message: PromptInputMessage, options?: any) => void;
}

const ChatInput = ({
  input,
  isLoading,
  status,
  selectedPage,
  setInput,
  onStop,
  onSubmit,
}: ChatInputProps) => {
  const { isSignedIn } = useAuth()
  const [showAuthBanner, setShowAuthBanner] = useState(false)

  const { setSelectedPageId } = useCanvas()

  const handleSubmit = (message: PromptInputMessage) => {
    if (!isSignedIn) {
      setShowAuthBanner(true)
      return
    }

    setShowAuthBanner(false);
    onSubmit(message, {
      selectedPageId: selectedPage?.id
    });
    setSelectedPageId(null)
  }


  return (
    <div className='w-full flex flex-col gap-2'>

      {showAuthBanner && (
        <Item
          variant="outline"
          size="sm"
          className="py-2
      bg-amber-50 dark:bg-amber-950/40
      border-amber-200 dark:border-amber-800/30
      animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <ItemMedia variant="icon" className='bg-transparent'>
            <LockIcon className='size-4' />
          </ItemMedia>
          <ItemContent>
            <ItemTitle className='text-sm'>
              Sign in to continue
            </ItemTitle>
            <ItemDescription>
              Create a free account to start designing with Sleek.
            </ItemDescription>
          </ItemContent>
          <ItemActions>
            <SignInButton>
              <Button variant="outline" size="sm">Login</Button>
            </SignInButton>
            <SignUpButton>
              <Button size="sm">Sign up</Button>
            </SignUpButton>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setShowAuthBanner(false)}
            >
              <XIcon className="size-3.5" />
            </Button>
          </ItemActions>
        </Item>
      )}



      <PromptInput
        globalDrop
        className="rounded-xl! shadow-md bg-background
         border
        "
        onSubmit={handleSubmit}
      >
        {selectedPage && (
          <div className='px-2 pt-2 w-full'>
            <Badge variant="secondary" className="text-xs">
              {selectedPage.name} Page
              <button onClick={() => setSelectedPageId(null)}>
                <XIcon className="size-3.5" />
              </button>
            </Badge>
          </div>
        )}
        <PromptInputAttachmentsDisplay />
        <PromptInputBody>
          <PromptInputTextarea
            onChange={(e) => setInput(e.target.value)}
            value={input}
            placeholder='Describe your design vision...'
            className='pt-5'
          />
        </PromptInputBody>
        <PromptInputFooter>
          <PromptInputTools>
            <PromptInputActionMenu>
              <PromptInputActionMenuTrigger />
              <PromptInputActionMenuContent>
                <PromptInputActionAddAttachments />
              </PromptInputActionMenuContent>
            </PromptInputActionMenu>
          </PromptInputTools>

          {isLoading ? (
            <StopButton onStop={onStop} />
          ) : (
            <PromptInputSubmit
              status={status}
              disabled={!input.trim() || isLoading}
              className='absolute right-2 rounded-full bottom-1.5'
            >
              <ArrowUpIcon size={25} />
            </PromptInputSubmit>
          )}
        </PromptInputFooter>
      </PromptInput>
    </div>
  )
}

const PromptInputAttachmentsDisplay = () => {
  const attachments = usePromptInputAttachments();
  if (attachments.files.length === 0) {
    return null
  }

  return (
    <Attachments
      variant="grid"
      className="w-full h-auto min-h-20 px-4 pt-4 justify-start flex-nowrap
       overflow-x-auto ml-0
      "
    >
      {attachments.files.map((attachment) => (
        <Attachment
          data={attachment}
          key={attachment.id}
          className="size-15 shrink-0"
          onRemove={() => attachments.remove(
            attachment.id
          )}
        >
          <AttachmentPreview />
          <AttachmentRemove />
        </Attachment>
      ))}
    </Attachments>
  )
}

const StopButton = ({ onStop }: { onStop: () => void }) => {
  return (
    <Button
      size="icon"
      className="!bg-muted rounded-full dark:!bg-black
      border cursor-pointer"
      onClick={onStop}
    >
      <Square fill='black' size={14} className="text-black
       dark:text-white" />
    </Button>
  )
}

export default ChatInput
