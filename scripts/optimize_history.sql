-- Add missing indexes for history table performance optimization
-- This script should be run on your database to improve history page loading speed

-- Add index on created_at for ORDER BY performance
ALTER TABLE `history` ADD INDEX `idx_created_at` (`created_at` DESC);

-- Add composite index for owner + created_at for better filtering performance
ALTER TABLE `history` ADD INDEX `idx_owner_created_at` (`owner`, `created_at` DESC);

-- Add index on user_do for filtering by user
ALTER TABLE `history` ADD INDEX `idx_user_do` (`user_do`);

-- Add index on keys_id for key-related queries
ALTER TABLE `history` ADD INDEX `idx_keys_id` (`keys_id`);

-- Show the new indexes
SHOW INDEX FROM `history`; 