-- Add comment_likes table for tracking likes on comments
CREATE TABLE IF NOT EXISTS public.comment_likes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    comment_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT comment_likes_pkey PRIMARY KEY (id),
    CONSTRAINT comment_likes_comment_id_user_id_unique UNIQUE (comment_id, user_id),
    CONSTRAINT comment_likes_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.comments(id) ON DELETE CASCADE,
    CONSTRAINT comment_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON public.comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON public.comment_likes(user_id);

-- Update the likes table to support both posts and comments
ALTER TABLE public.likes ADD COLUMN IF NOT EXISTS comment_id uuid;
ALTER TABLE public.likes ADD CONSTRAINT likes_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.comments(id) ON DELETE CASCADE;

-- Add check constraint to ensure either post_id or comment_id is set, but not both
ALTER TABLE public.likes ADD CONSTRAINT likes_check_target CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR 
    (post_id IS NULL AND comment_id IS NOT NULL)
);

-- Add unique constraint for post likes
ALTER TABLE public.likes ADD CONSTRAINT likes_post_user_unique UNIQUE (post_id, user_id);

-- Add unique constraint for comment likes  
ALTER TABLE public.likes ADD CONSTRAINT likes_comment_user_unique UNIQUE (comment_id, user_id);
