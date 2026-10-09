ALTER TABLE public.user_notifications
ADD COLUMN actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX user_notifications_actor_idx
ON public.user_notifications (actor_id)
WHERE actor_id IS NOT NULL;