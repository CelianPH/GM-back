-- =====================================================================
-- Guide Michelin — Schéma base de données
-- MySQL 8+, InnoDB, utf8mb4
-- Généré depuis src/migrations/ (Sequelize)
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------
-- 1. regions (self-référence pour hiérarchie de régions)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `regions`;
CREATE TABLE `regions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `parent_region_id` INT DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `regions_slug_unique` (`slug`),
  KEY `regions_parent_region_id_idx` (`parent_region_id`),
  CONSTRAINT `regions_parent_region_id_fk`
    FOREIGN KEY (`parent_region_id`) REFERENCES `regions` (`id`)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 2. cuisine_types
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `cuisine_types`;
CREATE TABLE `cuisine_types` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cuisine_types_name_unique` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 3. users
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(255) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `first_name` VARCHAR(255) NOT NULL,
  `last_name` VARCHAR(255) NOT NULL,
  `role` ENUM('client', 'pro', 'admin') NOT NULL DEFAULT 'client',
  `friend_code` VARCHAR(20) NOT NULL,
  `avatar_url` VARCHAR(255) DEFAULT NULL,
  `bio` TEXT DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`),
  UNIQUE KEY `users_friend_code_unique` (`friend_code`),
  KEY `users_role_idx` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 4. levels
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `levels`;
CREATE TABLE `levels` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `rank` ENUM('commis', 'chef_de_partie', 'sous_chef', 'chef', 'chef_etoile') NOT NULL,
  `tier_name` VARCHAR(255) NOT NULL,
  `min_experiences` INT NOT NULL,
  `color` VARCHAR(255) DEFAULT NULL,
  `icon` VARCHAR(255) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `levels_rank_unique` (`rank`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 5. titles
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `titles`;
CREATE TABLE `titles` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `slug` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `tagline` VARCHAR(255) NOT NULL,
  `theme_hint` VARCHAR(255) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `titles_slug_unique` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 6. badges
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `badges`;
CREATE TABLE `badges` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `icon` VARCHAR(255) DEFAULT NULL,
  `tier` VARCHAR(255) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 7. establishments (-> regions)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `establishments`;
CREATE TABLE `establishments` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `type` ENUM('restaurant', 'lodging') NOT NULL,
  `region_id` INT NOT NULL,
  `city` VARCHAR(255) NOT NULL,
  `postal_code` VARCHAR(10) NOT NULL,
  `address` VARCHAR(255) NOT NULL,
  `lat` FLOAT NOT NULL,
  `lng` FLOAT NOT NULL,
  `phone` VARCHAR(255) DEFAULT NULL,
  `website` VARCHAR(255) DEFAULT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `cover_image_url` VARCHAR(255) DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `validation_qr_token` VARCHAR(255) DEFAULT NULL,
  `qr_generated_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `establishments_slug_unique` (`slug`),
  UNIQUE KEY `establishments_validation_qr_token_unique` (`validation_qr_token`),
  KEY `establishments_region_id_idx` (`region_id`),
  KEY `establishments_type_idx` (`type`),
  CONSTRAINT `establishments_region_id_fk`
    FOREIGN KEY (`region_id`) REFERENCES `regions` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 8. restaurant_details (-> establishments, cuisine_types)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `restaurant_details`;
CREATE TABLE `restaurant_details` (
  `establishment_id` INT NOT NULL,
  `distinction` ENUM('none', 'bib_gourmand', 'one_star', 'two_stars', 'three_stars', 'green_star') NOT NULL DEFAULT 'none',
  `cuisine_type_id` INT DEFAULT NULL,
  `price_range` TINYINT DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`establishment_id`),
  KEY `restaurant_details_distinction_idx` (`distinction`),
  KEY `restaurant_details_cuisine_type_id_idx` (`cuisine_type_id`),
  CONSTRAINT `restaurant_details_establishment_id_fk`
    FOREIGN KEY (`establishment_id`) REFERENCES `establishments` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `restaurant_details_cuisine_type_id_fk`
    FOREIGN KEY (`cuisine_type_id`) REFERENCES `cuisine_types` (`id`)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 9. lodging_details (-> establishments)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `lodging_details`;
CREATE TABLE `lodging_details` (
  `establishment_id` INT NOT NULL,
  `keys_level` TINYINT NOT NULL,
  `lodging_type` ENUM('hotel', 'maison_hotes', 'gite', 'lodge', 'autre') NOT NULL,
  `rooms_count` INT DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`establishment_id`),
  CONSTRAINT `lodging_details_establishment_id_fk`
    FOREIGN KEY (`establishment_id`) REFERENCES `establishments` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 10. establishment_managers (-> users, establishments)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `establishment_managers`;
CREATE TABLE `establishment_managers` (
  `user_id` INT NOT NULL,
  `establishment_id` INT NOT NULL,
  `role` ENUM('owner', 'manager', 'staff') NOT NULL DEFAULT 'manager',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `establishment_id`),
  KEY `establishment_managers_establishment_id_idx` (`establishment_id`),
  CONSTRAINT `establishment_managers_user_id_fk`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `establishment_managers_establishment_id_fk`
    FOREIGN KEY (`establishment_id`) REFERENCES `establishments` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 11. stories (-> establishments, users)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `stories`;
CREATE TABLE `stories` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `establishment_id` INT NOT NULL,
  `author_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT NOT NULL,
  `media_url` VARCHAR(255) DEFAULT NULL,
  `status` ENUM('pending', 'approved', 'rejected', 'flagged') NOT NULL DEFAULT 'pending',
  `moderation_score` DECIMAL(5, 2) DEFAULT NULL,
  `moderation_notes` TEXT DEFAULT NULL,
  `published_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `stories_establishment_id_idx` (`establishment_id`),
  KEY `stories_status_idx` (`status`),
  KEY `stories_author_id_idx` (`author_id`),
  CONSTRAINT `stories_establishment_id_fk`
    FOREIGN KEY (`establishment_id`) REFERENCES `establishments` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `stories_author_id_fk`
    FOREIGN KEY (`author_id`) REFERENCES `users` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 12. experiences (-> users, establishments)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `experiences`;
CREATE TABLE `experiences` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `establishment_id` INT NOT NULL,
  `experienced_at` DATETIME NOT NULL,
  `status` ENUM('validated', 'rejected', 'disputed') NOT NULL DEFAULT 'validated',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `experiences_user_id_status_idx` (`user_id`, `status`),
  KEY `experiences_user_id_establishment_id_status_idx` (`user_id`, `establishment_id`, `status`),
  KEY `experiences_establishment_id_idx` (`establishment_id`),
  CONSTRAINT `experiences_user_id_fk`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `experiences_establishment_id_fk`
    FOREIGN KEY (`establishment_id`) REFERENCES `establishments` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 13. quests (-> badges)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `quests`;
CREATE TABLE `quests` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `type` ENUM('region', 'category', 'mixed', 'seasonal') NOT NULL,
  `target_count` INT NOT NULL,
  `reward_points` INT NOT NULL DEFAULT 0,
  `reward_badge_id` INT DEFAULT NULL,
  `starts_at` DATETIME DEFAULT NULL,
  `ends_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `quests_reward_badge_id_idx` (`reward_badge_id`),
  CONSTRAINT `quests_reward_badge_id_fk`
    FOREIGN KEY (`reward_badge_id`) REFERENCES `badges` (`id`)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 14. quest_criteria (-> quests)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `quest_criteria`;
CREATE TABLE `quest_criteria` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `quest_id` INT NOT NULL,
  `criterion_type` ENUM('region', 'distinction', 'establishment_type', 'cuisine_type', 'lodging_type') NOT NULL,
  `criterion_value` VARCHAR(255) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `quest_criteria_quest_id_idx` (`quest_id`),
  CONSTRAINT `quest_criteria_quest_id_fk`
    FOREIGN KEY (`quest_id`) REFERENCES `quests` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 15. passes (-> users, levels, titles, quests)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `passes`;
CREATE TABLE `passes` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `pass_number` VARCHAR(20) NOT NULL,
  `level_id` INT NOT NULL,
  `title_id` INT DEFAULT NULL,
  `featured_quest_id` INT DEFAULT NULL,
  `experiences_count` INT NOT NULL DEFAULT 0,
  `points_total` INT NOT NULL DEFAULT 0,
  `member_since` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `passes_user_id_unique` (`user_id`),
  UNIQUE KEY `passes_pass_number_unique` (`pass_number`),
  KEY `passes_level_id_idx` (`level_id`),
  KEY `passes_title_id_idx` (`title_id`),
  KEY `passes_featured_quest_id_idx` (`featured_quest_id`),
  CONSTRAINT `passes_user_id_fk`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `passes_level_id_fk`
    FOREIGN KEY (`level_id`) REFERENCES `levels` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `passes_title_id_fk`
    FOREIGN KEY (`title_id`) REFERENCES `titles` (`id`)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT `passes_featured_quest_id_fk`
    FOREIGN KEY (`featured_quest_id`) REFERENCES `quests` (`id`)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 16. user_quests (-> users, quests)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `user_quests`;
CREATE TABLE `user_quests` (
  `user_id` INT NOT NULL,
  `quest_id` INT NOT NULL,
  `progress_count` INT NOT NULL DEFAULT 0,
  `completed_at` DATETIME DEFAULT NULL,
  `started_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `quest_id`),
  KEY `user_quests_quest_id_idx` (`quest_id`),
  CONSTRAINT `user_quests_user_id_fk`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `user_quests_quest_id_fk`
    FOREIGN KEY (`quest_id`) REFERENCES `quests` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 17. user_badges (-> users, badges)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `user_badges`;
CREATE TABLE `user_badges` (
  `user_id` INT NOT NULL,
  `badge_id` INT NOT NULL,
  `earned_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `badge_id`),
  KEY `user_badges_badge_id_idx` (`badge_id`),
  CONSTRAINT `user_badges_user_id_fk`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `user_badges_badge_id_fk`
    FOREIGN KEY (`badge_id`) REFERENCES `badges` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 18. friendships (-> users)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `friendships`;
CREATE TABLE `friendships` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `friend_id` INT NOT NULL,
  `status` ENUM('pending', 'accepted', 'blocked') NOT NULL DEFAULT 'pending',
  `initiated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `accepted_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `friendships_user_id_friend_id_unique` (`user_id`, `friend_id`),
  KEY `friendships_user_id_status_idx` (`user_id`, `status`),
  KEY `friendships_friend_id_idx` (`friend_id`),
  CONSTRAINT `friendships_user_id_fk`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `friendships_friend_id_fk`
    FOREIGN KEY (`friend_id`) REFERENCES `users` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- Seed minimal : 1 niveau par défaut pour permettre la création de Pass
-- =====================================================================
INSERT INTO `levels` (`rank`, `tier_name`, `min_experiences`, `color`, `icon`)
VALUES ('commis', 'Commis', 0, '#C62828', 'star');

SET FOREIGN_KEY_CHECKS = 1;
