-- Add post_likes table for the clubs posts functionality
CREATE TABLE IF NOT EXISTS public.post_likes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    post_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE(post_id, user_id),
    FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON public.post_likes(user_id);

-- Update the posts table to have comments_count if it doesn't exist
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS comments_count integer DEFAULT 0;
