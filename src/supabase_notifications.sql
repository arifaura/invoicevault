-- Create notifications table
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  message text not null,
  type text default 'info'::text,
  read boolean default false,
  link text,
  metadata jsonb default '{}'::jsonb
);

-- Enable RLS
alter table public.notifications enable row level security;

-- Create policies
create policy "Users can view their own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can update their own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

create policy "System can insert notifications"
  on public.notifications for insert
  with check (true); -- Adjust this if you want to restrict who can insert

-- Create index for performance
create index notifications_user_id_idx on public.notifications(user_id);
create index notifications_read_idx on public.notifications(read);
