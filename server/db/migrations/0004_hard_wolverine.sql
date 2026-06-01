ALTER TABLE `buyer_requirements` ADD `quality_standard` text;
--> statement-breakpoint
UPDATE `buyer_requirements`
SET `quality_standard` = CASE
  WHEN `min_value` IS NOT NULL AND trim(`min_value`) <> ''
    AND `max_value` IS NOT NULL AND trim(`max_value`) <> ''
    AND trim(`min_value`) <> trim(`max_value`)
    THEN trim(`min_value`) || ' - ' || trim(`max_value`)
  WHEN `min_value` IS NOT NULL AND trim(`min_value`) <> ''
    THEN trim(`min_value`)
  WHEN `max_value` IS NOT NULL AND trim(`max_value`) <> ''
    THEN trim(`max_value`)
  ELSE NULL
END
WHERE `quality_standard` IS NULL;
