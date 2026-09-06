ALTER TABLE "gba_rom" ADD COLUMN IF NOT EXISTS "cover_image_base64" text;
--> statement-breakpoint
ALTER TABLE "gba_rom" ALTER COLUMN "cover_image_base64" SET DEFAULT '';